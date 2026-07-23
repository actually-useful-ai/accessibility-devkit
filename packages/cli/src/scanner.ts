import {
  RUNTIME_VERSION,
  SCHEMA_VERSION,
  summarize,
  type AccessibilityReport,
  type Profile,
  type ReportItem,
  type SourceLocation,
} from './report';

export interface ScanOptions {
  target: string;
  profile?: Profile;
  runtime?: 'node' | 'python';
}

interface TagToken {
  name: string;
  attributes: Record<string, string>;
  index: number;
  location: SourceLocation;
}

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function locationAt(source: string, index: number, excerpt: string): SourceLocation {
  const lineStart = source.lastIndexOf('\n', index - 1) + 1;
  return {
    line: lineAt(source, index),
    column: index - lineStart + 1,
    excerpt: excerpt.replace(/\s+/g, ' ').trim().slice(0, 160),
  };
}

function parseAttributes(raw: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of raw.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attributes;
}

function tagsIn(source: string): TagToken[] {
  const tags: TagToken[] = [];
  const pattern = /<([a-zA-Z][\w:-]*)(\s[^<>]*?)?\s*\/?>/g;
  for (const match of source.matchAll(pattern)) {
    tags.push({
      name: match[1].toLowerCase(),
      attributes: parseAttributes(match[2] ?? ''),
      index: match.index,
      location: locationAt(source, match.index, match[0]),
    });
  }
  return tags;
}

function item(
  values: Pick<
    ReportItem,
    | 'ruleId'
    | 'classification'
    | 'certainty'
    | 'severity'
    | 'evidence'
    | 'message'
    | 'remediation'
    | 'verification'
  > & { wcag?: string[]; location?: SourceLocation | null },
): ReportItem {
  return { wcag: [], location: null, ...values };
}

function strippedText(fragment: string): string {
  return fragment
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function elementFragments(source: string, name: string): Array<{ text: string; index: number }> {
  const pattern = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi');
  return Array.from(source.matchAll(pattern), (match) => ({
    text: strippedText(match[1]),
    index: match.index,
  }));
}

function manualBaseline(): ReportItem[] {
  return [
    item({
      ruleId: 'color-only-communication',
      classification: 'normative',
      certainty: 'manual',
      severity: 'info',
      evidence: 'human',
      message:
        'Confirm that color is not the only way information, status, or required action is conveyed.',
      wcag: ['1.4.1'],
      remediation:
        'Pair color with text, shape, pattern, position, or another programmatically available cue.',
      verification: 'Review each state visually and with color or custom styles disabled.',
    }),
    item({
      ruleId: 'contrast-rendered',
      classification: 'normative',
      certainty: 'manual',
      severity: 'info',
      evidence: 'runtime',
      message:
        'Measure rendered foreground and background colors, including states, images, gradients, and transparency.',
      wcag: ['1.4.3', '1.4.11'],
      remediation:
        'Adjust rendered colors that do not meet the applicable text or non-text threshold.',
      verification: 'Measure computed colors in the browser and inspect every interactive state.',
    }),
    item({
      ruleId: 'landmark-structure',
      classification: 'normative',
      certainty: 'manual',
      severity: 'info',
      evidence: 'runtime',
      message:
        'Review the rendered landmark structure, including nesting, repeated landmark labels, and content outside landmarks.',
      wcag: ['1.3.1', '2.4.1'],
      remediation:
        'Use native landmark elements and label repeated landmarks of the same type when their purposes differ.',
      verification:
        'Inspect the accessibility tree and navigate the page with a screen reader landmark list.',
    }),
  ];
}

function cviChecks(): ReportItem[] {
  const shared = {
    classification: 'supplemental' as const,
    certainty: 'manual' as const,
    severity: 'info' as const,
    evidence: 'human' as const,
    wcag: [] as string[],
    location: null,
  };
  return [
    item({
      ...shared,
      ruleId: 'cvi-individual-profile',
      message:
        'Review the experience against the person’s individual CVI profile and preferred presentation.',
      remediation: 'Make presentation, contrast, spacing, field complexity, and pacing adjustable.',
      verification:
        'Evaluate with the person or a qualified specialist; no universal palette or ratio establishes CVI access.',
    }),
    item({
      ...shared,
      ruleId: 'cvi-visual-complexity',
      message: 'Review clutter, crowding, background complexity, and competing visual targets.',
      remediation: 'Reduce simultaneous visual demands and allow isolation of the current task.',
      verification:
        'Observe target recognition across realistic screens, not isolated components only.',
    }),
    item({
      ...shared,
      ruleId: 'cvi-fatigue-motion',
      message:
        'Review visual fatigue, latency, motion, and the time needed to find and interpret targets.',
      remediation: 'Provide pauses, stable layouts, reduced motion, and enough processing time.',
      verification: 'Test over a representative session with the person’s preferred pacing.',
    }),
    item({
      ...shared,
      ruleId: 'cvi-multisensory-alternatives',
      message:
        'Confirm that important information has usable nonvisual or multisensory alternatives.',
      remediation:
        'Provide meaningful speech, sound, touch, or text alternatives chosen with the person.',
      verification: 'Complete key tasks using the person’s preferred combination of senses.',
    }),
  ];
}

function switchChecks(): ReportItem[] {
  const shared = {
    classification: 'supplemental' as const,
    certainty: 'manual' as const,
    severity: 'info' as const,
    evidence: 'human' as const,
    wcag: [] as string[],
    location: null,
  };
  return [
    item({
      ...shared,
      ruleId: 'switch-control-verification',
      message: 'Complete the primary flow with the operating system’s Switch Control.',
      remediation:
        'Use native semantics, predictable focus order, and visible focus; remove unreachable controls.',
      verification:
        'Navigate, activate, dismiss, recover from errors, and complete the task using switch input only.',
    }),
    item({
      ...shared,
      ruleId: 'switch-timing-preferences',
      message:
        'Confirm scan speed, dwell, repeat filtering, and time limits can match the person’s needs.',
      remediation: 'Expose timing choices and avoid a universal dwell or repeat interval.',
      verification: 'Test slow and fast settings with the person’s switch configuration.',
    }),
    item({
      ...shared,
      ruleId: 'switch-simple-action',
      message:
        'Confirm complex pointer gestures have a single-switch or simple-action alternative.',
      wcag: ['2.5.1', '2.5.7'],
      remediation: 'Add controls for drag, path, multipoint, and pointer-only actions.',
      verification:
        'Complete every pointer-driven action using focus and a single activation command.',
    }),
  ];
}

/** Scan HTML source without claiming browser, assistive-technology, or human verification. */
export function scanSource(source: string, options: ScanOptions): AccessibilityReport {
  const tags = tagsIn(source);
  const findings: ReportItem[] = [];
  const manualChecks = manualBaseline();

  const html = tags.find((tag) => tag.name === 'html');
  if (!html?.attributes.lang?.trim()) {
    findings.push(
      item({
        ruleId: 'document-language',
        classification: 'normative',
        certainty: 'detected',
        severity: 'error',
        evidence: 'source',
        message: 'The document does not declare a default language.',
        wcag: ['3.1.1'],
        location: html?.location ?? { line: 1, column: 1 },
        remediation: 'Add a valid lang attribute to the html element.',
        verification:
          'Inspect the accessibility tree and confirm language changes are also marked.',
      }),
    );
  }

  const ids = new Map<string, TagToken>();
  for (const tag of tags) {
    const id = tag.attributes.id;
    if (!id) continue;
    const first = ids.get(id);
    if (first) {
      findings.push(
        item({
          ruleId: 'duplicate-id',
          classification: 'normative',
          certainty: 'detected',
          severity: 'error',
          evidence: 'source',
          message: `The id ${JSON.stringify(id)} is used more than once.`,
          wcag: ['1.3.1', '4.1.2'],
          location: tag.location,
          remediation: 'Give each relationship target a unique id and update its references.',
          verification: `Confirm every reference to ${JSON.stringify(id)} resolves to one intended element.`,
        }),
      );
    } else {
      ids.set(id, tag);
    }
  }

  for (const tag of tags.filter((candidate) => candidate.name === 'img')) {
    if (!Object.hasOwn(tag.attributes, 'alt')) {
      findings.push(
        item({
          ruleId: 'image-alt-missing',
          classification: 'normative',
          certainty: 'detected',
          severity: 'error',
          evidence: 'source',
          message: 'An image has no alt attribute.',
          wcag: ['1.1.1'],
          location: tag.location,
          remediation:
            'Add contextual alternative text, or alt="" when the image is intentionally decorative.',
          verification:
            'Review the image in context and confirm the accessible name communicates its purpose.',
        }),
      );
    } else if (tag.attributes.alt.trim() === '') {
      manualChecks.push(
        item({
          ruleId: 'image-alt-empty-context',
          classification: 'normative',
          certainty: 'manual',
          severity: 'info',
          evidence: 'human',
          message:
            'An image uses empty alternative text; that can be correct only when its content is redundant or decorative.',
          wcag: ['1.1.1'],
          location: tag.location,
          remediation:
            'Keep alt="" for decorative images; otherwise provide concise contextual alternative text.',
          verification: 'Review adjacent content and the task with images unavailable.',
        }),
      );
    }
  }

  const labelFors = new Set(
    tags
      .filter((tag) => tag.name === 'label' && tag.attributes.for)
      .map((tag) => tag.attributes.for),
  );
  for (const tag of tags.filter((candidate) =>
    ['input', 'select', 'textarea'].includes(candidate.name),
  )) {
    const type = (tag.attributes.type || 'text').toLowerCase();
    if (['hidden', 'button', 'submit', 'reset', 'image'].includes(type)) continue;
    const named =
      (tag.attributes.id && labelFors.has(tag.attributes.id)) ||
      tag.attributes['aria-label']?.trim() ||
      tag.attributes['aria-labelledby']?.trim() ||
      tag.attributes.title?.trim();
    if (!named) {
      findings.push(
        item({
          ruleId: 'form-label',
          classification: 'normative',
          certainty: 'potential',
          severity: 'error',
          evidence: 'source',
          message: 'A form control has no source-visible label or accessible-name reference.',
          wcag: ['1.3.1', '3.3.2', '4.1.2'],
          location: tag.location,
          remediation:
            'Associate a visible label with the control and preserve its accessible name.',
          verification:
            'Inspect the computed accessible name; account for labels created at runtime.',
        }),
      );
    }
  }

  for (const tag of tags) {
    const tabindex = tag.attributes.tabindex;
    if (tabindex !== undefined && Number.parseInt(tabindex, 10) > 0) {
      findings.push(
        item({
          ruleId: 'focus-positive-tabindex',
          classification: 'normative',
          certainty: 'potential',
          severity: 'warning',
          evidence: 'source',
          message: 'A positive tabindex can create a focus order that diverges from reading order.',
          wcag: ['2.4.3'],
          location: tag.location,
          remediation:
            'Use DOM order and tabindex="0" or native focusability instead of a positive value.',
          verification: 'Traverse the complete flow with Tab, Shift+Tab, and Switch Control.',
        }),
      );
    }
  }

  let previousHeading = 0;
  for (const tag of tags.filter((candidate) => /^h[1-6]$/.test(candidate.name))) {
    const level = Number(tag.name[1]);
    if (previousHeading && level > previousHeading + 1) {
      findings.push(
        item({
          ruleId: 'heading-order',
          classification: 'advisory',
          certainty: 'potential',
          severity: 'warning',
          evidence: 'source',
          message: `Heading level jumps from h${previousHeading} to h${level}.`,
          wcag: ['1.3.1', '2.4.6'],
          location: tag.location,
          remediation:
            'Use heading levels that reflect the content hierarchy without skipping a parent level.',
          verification:
            'Review the heading outline and confirm it matches the information structure.',
        }),
      );
    }
    previousHeading = level;
  }

  for (const link of elementFragments(source, 'a')) {
    if (!link.text || /^(click here|read more|learn more|more)$/i.test(link.text)) {
      findings.push(
        item({
          ruleId: 'link-purpose',
          classification: 'normative',
          certainty: 'potential',
          severity: 'warning',
          evidence: 'source',
          message: 'A link has empty or generic source-visible text.',
          wcag: ['2.4.4'],
          location: locationAt(source, link.index, source.slice(link.index, link.index + 120)),
          remediation: 'Write link text that identifies the destination or action in context.',
          verification: 'Review the computed accessible name and a links-only list.',
        }),
      );
    }
  }

  for (const table of source.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    if (!/<th\b/i.test(table[1])) {
      manualChecks.push(
        item({
          ruleId: 'table-headers-context',
          classification: 'normative',
          certainty: 'manual',
          severity: 'info',
          evidence: 'human',
          message:
            'A table has no source-visible header cells; determine whether it presents data or is only layout.',
          wcag: ['1.3.1'],
          location: locationAt(source, table.index, table[0].slice(0, 120)),
          remediation:
            'For data tables, add correctly scoped headers and a useful caption when needed.',
          verification: 'Navigate the table by row and column with a screen reader.',
        }),
      );
    }
  }

  for (const tag of tags) {
    const interactive =
      ['button', 'input', 'select', 'textarea'].includes(tag.name) ||
      (tag.name === 'a' && Boolean(tag.attributes.href)) ||
      Boolean(tag.attributes.role?.match(/^(button|link|checkbox|radio|switch|tab|menuitem)$/));
    if (!interactive) continue;
    const style = tag.attributes.style ?? '';
    const width = /(?:^|;)\s*width\s*:\s*([\d.]+)px/i.exec(style)?.[1];
    const height = /(?:^|;)\s*height\s*:\s*([\d.]+)px/i.exec(style)?.[1];
    if ((width && Number(width) < 24) || (height && Number(height) < 24)) {
      manualChecks.push(
        item({
          ruleId: 'target-size-spacing',
          classification: 'normative',
          certainty: 'manual',
          severity: 'info',
          evidence: 'runtime',
          message:
            'A source dimension is below 24 CSS pixels; rendered size, spacing, and WCAG exceptions still require review.',
          wcag: ['2.5.8'],
          location: tag.location,
          remediation:
            'Increase the rendered target or provide sufficient spacing or an applicable exception.',
          verification:
            'Measure rendered boxes and spacing at representative viewport sizes and zoom levels.',
        }),
      );
    }
  }

  for (const tag of tags) {
    const hasExecutableTiming =
      (['audio', 'video'].includes(tag.name) && Object.hasOwn(tag.attributes, 'autoplay')) ||
      (tag.name === 'meta' && tag.attributes['http-equiv']?.toLowerCase() === 'refresh');
    if (hasExecutableTiming) {
      manualChecks.push(
        item({
          ruleId: 'timing-media-control',
          classification: 'normative',
          certainty: 'manual',
          severity: 'info',
          evidence: 'runtime',
          message:
            'Source markup configures automatic media or refresh behavior that needs runtime timing review.',
          wcag: ['2.2.1', '2.2.2'],
          location: tag.location,
          remediation: 'Provide pause, stop, hide, disable, or adjustment controls as applicable.',
          verification:
            'Exercise the behavior in the browser and evaluate the complete timing policy.',
        }),
      );
    }
  }

  if (options.profile === 'cvi' || options.profile === 'all') manualChecks.push(...cviChecks());
  if (options.profile === 'switch' || options.profile === 'all') {
    manualChecks.push(...switchChecks());
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    producer: {
      name: 'accessibility-devkit',
      version: RUNTIME_VERSION,
      runtime: options.runtime ?? 'node',
    },
    target: { kind: 'file', value: options.target },
    summary: summarize(findings, manualChecks),
    findings,
    manualChecks,
  };
}
