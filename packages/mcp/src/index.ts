import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { scanSource } from '@accessibility-devkit/cli';
import {
  analyzeReadableText,
  assessTimeLimit,
  getContrastRatio,
  meetsContrastThreshold,
} from '@accessibility-devkit/core';

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
function result(value: object) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    structuredContent: { ...value },
  };
}

/** Local tools over supplied content only: no filesystem, URL fetches or model requests. */
export function createAccessibilityServer(): McpServer {
  const server = new McpServer({ name: 'accessibility-devkit', version: '0.1.0' });
  server.registerTool(
    'scan_source',
    {
      description:
        'Scan supplied HTML source. Returns source findings and separate manual checks; does not render or prove conformance.',
      inputSchema: {
        source: z.string().min(1).max(128_000),
        label: z.string().min(1).max(200).default('supplied-source'),
        profile: z.enum(['default', 'cvi', 'switch', 'all']).default('default'),
      },
      annotations,
    },
    async ({ source, label, profile }) =>
      result(
        scanSource(source, { target: label, profile: profile === 'default' ? undefined : profile }),
      ),
  );
  server.registerTool(
    'check_contrast',
    {
      description:
        'Measure a supplied hexadecimal text-color pair against a selected contrast threshold. Rendered states still need verification.',
      inputSchema: {
        foreground: z.string().regex(/^#?(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/),
        background: z.string().regex(/^#?(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/),
        level: z.enum(['AA', 'AAA']).default('AA'),
        textSize: z.enum(['normal', 'large']).default('normal'),
      },
      annotations,
    },
    async ({ foreground, background, level, textSize }) =>
      result({
        ratio: getContrastRatio(foreground, background),
        meetsThreshold: meetsContrastThreshold(foreground, background, level, textSize),
        level,
        textSize,
        verification:
          'Verify rendered colors, states, text size and background effects separately.',
      }),
  );
  server.registerTool(
    'analyze_readability',
    {
      description:
        'Estimate English readability from supplied text. These formulas are not comprehension tests.',
      inputSchema: { text: z.string().min(1).max(128_000) },
      annotations,
    },
    async ({ text }) =>
      result({
        ...analyzeReadableText(text),
        verification: 'Review comprehension with the intended audience.',
      }),
  );
  server.registerTool(
    'assess_timing',
    {
      description:
        'Assess supplied time-limit settings using the deterministic WCAG timing alternatives. Exceptions need human review.',
      inputSchema: {
        canDisable: z.boolean().optional(),
        adjustmentMultiplier: z.number().nonnegative().optional(),
        warningDurationMs: z.number().nonnegative().optional(),
        extensionCount: z.number().int().nonnegative().optional(),
        essential: z.boolean().optional(),
        realTime: z.boolean().optional(),
      },
      annotations,
    },
    async (policy) => result(assessTimeLimit(policy)),
  );
  return server;
}
