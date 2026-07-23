import { readFileSync } from 'node:fs';

import { executeCommand } from './command';

const stdin = process.stdin.isTTY ? undefined : readFileSync(0, 'utf8');
const result = await executeCommand(process.argv.slice(2), { stdin });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.exitCode;
