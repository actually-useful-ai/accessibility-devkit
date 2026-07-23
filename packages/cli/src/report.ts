export const SCHEMA_VERSION = '1.0.0';
export const RUNTIME_VERSION = '1.1.0';

export type Profile = 'cvi' | 'switch' | 'all';
export type Classification = 'normative' | 'advisory' | 'supplemental';
export type Certainty = 'detected' | 'potential' | 'manual';
export type Severity = 'error' | 'warning' | 'info';
export type EvidenceLevel = 'source' | 'computed' | 'runtime' | 'human';

export interface SourceLocation {
  line: number;
  column: number;
  excerpt?: string;
}

export interface ReportItem {
  ruleId: string;
  classification: Classification;
  certainty: Certainty;
  severity: Severity;
  evidence: EvidenceLevel;
  message: string;
  wcag: string[];
  location: SourceLocation | null;
  remediation: string;
  verification: string;
}

export interface AccessibilityReport {
  schemaVersion: string;
  producer: {
    name: 'accessibility-devkit';
    version: string;
    runtime: 'node' | 'python';
  };
  target: {
    kind: 'file' | 'stdin' | 'text' | 'colors' | 'policy';
    value: string;
  };
  summary: {
    errors: number;
    warnings: number;
    info: number;
    findings: number;
    manualChecks: number;
  };
  findings: ReportItem[];
  manualChecks: ReportItem[];
}

export function summarize(
  findings: ReportItem[],
  manualChecks: ReportItem[],
): AccessibilityReport['summary'] {
  return {
    errors: findings.filter((finding) => finding.severity === 'error').length,
    warnings: findings.filter((finding) => finding.severity === 'warning').length,
    info: findings.filter((finding) => finding.severity === 'info').length,
    findings: findings.length,
    manualChecks: manualChecks.length,
  };
}
