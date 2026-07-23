import { readFileSync } from 'node:fs';

import {
  analyzeReadableText,
  assessTimeLimit,
  getContrastRatio,
  meetsContrastThreshold,
  type ContrastLevel,
  type TextSize,
  type TimeLimitPolicy,
} from '@accessibility-devkit/core';

import {
  RUNTIME_VERSION,
  SCHEMA_VERSION,
  summarize,
  type AccessibilityReport,
  type Profile,
  type ReportItem,
  type Severity,
} from './report';
import { scanSource } from './scanner';

type OutputFormat = 'text' | 'json';
type FailOn = 'error' | 'warning' | 'never';

export interface CommandEnvironment {
  stdin?: string;
  runtime?: 'node' | 'python';
}

export interface CommandResult {
  exitCode: 0 | 1 | 2;
  stdout: string;
  stderr: string;
}

interface ParsedArguments {
  positionals: string[];
  format: OutputFormat;
  failOn: FailOn;
  profile?: Profile;
  level: ContrastLevel;
  textSize: TextSize;
}

function parseArguments(args: string[]): ParsedArguments {
  const parsed: ParsedArguments = {
    positionals: [],
    format: 'text',
    failOn: 'error',
    level: 'AA',
    textSize: 'normal',
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    const next = args[index + 1];
    if (value === '--format' && next) {
      if (!['text', 'json'].includes(next)) throw new TypeError('--format must be text or json.');
      parsed.format = next as OutputFormat;
      index += 1;
    } else if (value === '--fail-on' && next) {
      if (!['error', 'warning', 'never'].includes(next)) {
        throw new TypeError('--fail-on must be error, warning, or never.');
      }
      parsed.failOn = next as FailOn;
      index += 1;
    } else if (value === '--profile' && next) {
      if (!['cvi', 'switch', 'all'].includes(next)) {
        throw new TypeError('--profile must be cvi, switch, or all.');
      }
      parsed.profile = next as Profile;
      index += 1;
    } else if (value === '--level' && next) {
      if (!['AA', 'AAA'].includes(next)) throw new TypeError('--level must be AA or AAA.');
      parsed.level = next as ContrastLevel;
      index += 1;
    } else if (value === '--text-size' && next) {
      if (!['normal', 'large'].includes(next)) {
        throw new TypeError('--text-size must be normal or large.');
      }
      parsed.textSize = next as TextSize;
      index += 1;
    } else if (value.startsWith('--')) {
      throw new TypeError(`Unknown option: ${value}`);
    } else {
      parsed.positionals.push(value);
    }
  }

  return parsed;
}

function report(
  runtime: 'node' | 'python',
  target: AccessibilityReport['target'],
  findings: ReportItem[],
  manualChecks: ReportItem[] = [],
): AccessibilityReport {
  return {
    schemaVersion: SCHEMA_VERSION,
    producer: { name: 'accessibility-devkit', version: RUNTIME_VERSION, runtime },
    target,
    summary: summarize(findings, manualChecks),
    findings,
    manualChecks,
  };
}

function makeItem(
  values: Partial<ReportItem> & Pick<ReportItem, 'ruleId' | 'message'>,
): ReportItem {
  return {
    classification: 'normative',
    certainty: 'detected',
    severity: 'error',
    evidence: 'computed',
    wcag: [],
    location: null,
    remediation: 'Review and correct the reported accessibility concern.',
    verification: 'Repeat the check and complete the relevant human or browser verification.',
    ...values,
  };
}

function hasFailure(findings: ReportItem[], failOn: FailOn): boolean {
  if (failOn === 'never') return false;
  const severities: Severity[] = failOn === 'warning' ? ['error', 'warning'] : ['error'];
  return findings.some((finding) => severities.includes(finding.severity));
}

function formatText(value: AccessibilityReport): string {
  const lines = [
    `Accessibility Devkit — ${value.target.value}`,
    `${value.summary.findings} finding(s), ${value.summary.manualChecks} manual check(s)`,
  ];
  for (const finding of value.findings) {
    lines.push(`[${finding.severity.toUpperCase()}] ${finding.ruleId}: ${finding.message}`);
  }
  if (value.manualChecks.length) {
    lines.push('Manual verification still required:');
    for (const check of value.manualChecks) lines.push(`- ${check.ruleId}: ${check.message}`);
  }
  return `${lines.join('\n')}\n`;
}

function output(value: AccessibilityReport, format: OutputFormat): string {
  return format === 'json' ? `${JSON.stringify(value, null, 2)}\n` : formatText(value);
}

function mergeScans(reports: AccessibilityReport[], paths: string[]): AccessibilityReport {
  const findings = reports.flatMap((entry, reportIndex) =>
    entry.findings.map((finding) => ({
      ...finding,
      location: finding.location
        ? {
            ...finding.location,
            excerpt: `${paths[reportIndex]}: ${finding.location.excerpt ?? ''}`.trim(),
          }
        : null,
    })),
  );
  const seenManual = new Set<string>();
  const manualChecks = reports
    .flatMap((entry) => entry.manualChecks)
    .filter((check) => {
      const key = `${check.ruleId}:${check.location?.line ?? 'global'}:${check.location?.excerpt ?? ''}`;
      if (seenManual.has(key)) return false;
      seenManual.add(key);
      return true;
    });
  return report('node', { kind: 'file', value: paths.join(', ') }, findings, manualChecks);
}

function scanCommand(positionals: string[], options: ParsedArguments): AccessibilityReport {
  if (positionals.length === 0) throw new TypeError('scan requires at least one file.');
  if (positionals.some((path) => /^https?:\/\//i.test(path))) {
    throw new TypeError('Live URLs use the maintained browser runner: npx @axe-core/cli <url>');
  }
  const reports = positionals.map((path) =>
    scanSource(readFileSync(path, 'utf8'), { target: path, profile: options.profile }),
  );
  return reports.length === 1 ? reports[0] : mergeScans(reports, positionals);
}

function contrastCommand(positionals: string[], options: ParsedArguments): AccessibilityReport {
  if (positionals.length !== 2) {
    throw new TypeError('contrast requires a foreground and background hex color.');
  }
  const [foreground, background] = positionals;
  const ratio = getContrastRatio(foreground, background);
  const passes = meetsContrastThreshold(foreground, background, options.level, options.textSize);
  const findings = passes
    ? []
    : [
        makeItem({
          ruleId: 'contrast-text',
          message: `Contrast is ${ratio.toFixed(2)}:1 and does not meet ${options.level} for ${options.textSize} text.`,
          wcag: ['1.4.3', '1.4.6'],
          remediation:
            'Change the foreground or background until the applicable contrast threshold is met.',
          verification: 'Measure the final computed colors in every rendered state.',
        }),
      ];
  return report('node', { kind: 'colors', value: `${foreground} on ${background}` }, findings);
}

function readabilityCommand(
  positionals: string[],
  environment: CommandEnvironment,
): AccessibilityReport {
  if (positionals.length !== 1) throw new TypeError('readability requires one file path or -.');
  const path = positionals[0];
  const text = path === '-' ? (environment.stdin ?? '') : readFileSync(path, 'utf8');
  const analysis = analyzeReadableText(text);
  const findings =
    analysis.fleschKincaidGrade > 9
      ? [
          makeItem({
            ruleId: 'readability-english',
            classification: 'advisory',
            certainty: 'potential',
            severity: 'warning',
            message: `The English-specific estimate is grade ${analysis.fleschKincaidGrade}.`,
            wcag: ['3.1.5'],
            remediation:
              'Shorten sentences, explain specialist terms, and test the revised content with readers.',
            verification:
              'Treat the score as a writing clue; test comprehension with the intended audience.',
          }),
        ]
      : [];
  const manualChecks = [
    makeItem({
      ruleId: 'readability-comprehension',
      classification: 'advisory',
      certainty: 'manual',
      severity: 'info',
      evidence: 'human',
      message: `English heuristic: ${analysis.words} words, grade ${analysis.fleschKincaidGrade}, reading ease ${analysis.fleschReadingEase}.`,
      remediation:
        'Revise for the audience’s vocabulary, context, and task, not a target score alone.',
      verification: 'Test understanding and task completion with representative readers.',
    }),
  ];
  return report(
    'node',
    { kind: path === '-' ? 'stdin' : 'text', value: path },
    findings,
    manualChecks,
  );
}

function timingCommand(positionals: string[]): AccessibilityReport {
  if (positionals.length !== 1) throw new TypeError('timing requires one policy JSON file.');
  const path = positionals[0];
  const policy = JSON.parse(readFileSync(path, 'utf8')) as TimeLimitPolicy;
  const assessment = assessTimeLimit(policy);
  const shared = {
    ruleId: 'timing-adjustable',
    message: assessment.reason,
    wcag: ['2.2.1'],
    remediation:
      'Allow disabling, at least ten-times adjustment, or a 20-second warning with at least ten extensions.',
    verification: 'Exercise the complete time-limit policy and any claimed exception in context.',
  };
  const findings = assessment.status === 'fails' ? [makeItem(shared)] : [];
  const manualChecks =
    assessment.status === 'manual'
      ? [
          makeItem({
            ...shared,
            certainty: 'manual',
            severity: 'info',
            evidence: 'human',
          }),
        ]
      : [];
  return report('node', { kind: 'policy', value: path }, findings, manualChecks);
}

export async function executeCommand(
  args: string[],
  environment: CommandEnvironment = {},
): Promise<CommandResult> {
  try {
    const [command, ...rest] = args;
    if (!command)
      throw new TypeError('A command is required: scan, contrast, readability, or timing.');
    const options = parseArguments(rest);
    let result: AccessibilityReport;
    if (command === 'scan') result = scanCommand(options.positionals, options);
    else if (command === 'contrast') result = contrastCommand(options.positionals, options);
    else if (command === 'readability')
      result = readabilityCommand(options.positionals, environment);
    else if (command === 'timing') result = timingCommand(options.positionals);
    else throw new TypeError(`Unknown command: ${command}`);

    if (environment.runtime) result.producer.runtime = environment.runtime;
    return {
      exitCode: hasFailure(result.findings, options.failOn) ? 1 : 0,
      stdout: output(result, options.format),
      stderr: '',
    };
  } catch (error) {
    return {
      exitCode: 2,
      stdout: '',
      stderr: `${error instanceof Error ? error.message : String(error)}\n`,
    };
  }
}
