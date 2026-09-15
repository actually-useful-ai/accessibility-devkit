import { it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { scanSource } from '@accessibility-devkit/cli';
import { analyzeReadableText, assessTimeLimit } from '@accessibility-devkit/core';
import { fileURLToPath } from 'node:url';

it('initializes and calls every tool through an actual stdio child process', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../dist/cli.mjs', import.meta.url))],
    stderr: 'pipe',
  });
  const client = new Client({ name: 'accessibility-contract-test', version: '1.0.0' });
  let stderr = '';
  transport.stderr?.on('data', (chunk) => {
    stderr += chunk;
  });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    expect(listed.tools.map((t) => t.name).sort()).toEqual([
      'analyze_readability',
      'assess_timing',
      'check_contrast',
      'scan_source',
    ]);
    for (const tool of listed.tools)
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, openWorldHint: false });
    const source = '<html lang="en"><img src="photo.png"></html>';
    const scan = await client.callTool({
      name: 'scan_source',
      arguments: { source, label: 'fixture' },
    });
    expect(scan.structuredContent).toEqual(scanSource(source, { target: 'fixture' }));
    const contrast = await client.callTool({
      name: 'check_contrast',
      arguments: { foreground: '#000', background: '#fff' },
    });
    expect(contrast.structuredContent).toMatchObject({ ratio: 21, meetsThreshold: true });
    const text = 'A short sentence.';
    const readable = await client.callTool({ name: 'analyze_readability', arguments: { text } });
    expect(readable.structuredContent).toMatchObject(analyzeReadableText(text));
    const policy = { essential: true };
    const timing = await client.callTool({ name: 'assess_timing', arguments: policy });
    expect(timing.structuredContent).toEqual(assessTimeLimit(policy));
    const invalid = await client.callTool({
      name: 'check_contrast',
      arguments: { foreground: 'red', background: '#fff' },
    });
    expect(invalid.isError).toBe(true);
    const pathOnly = await client.callTool({
      name: 'scan_source',
      arguments: { path: '/etc/passwd' },
    });
    expect(pathOnly.isError).toBe(true);
    expect(stderr).toBe('');
  } finally {
    await client.close();
    await transport.close();
  }
}, 20_000);
