import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createAccessibilityServer } from './index';

const server = createAccessibilityServer();
server.connect(new StdioServerTransport()).catch(() => {
  process.stderr.write('Accessibility MCP server could not start.\n');
  process.exitCode = 1;
});
