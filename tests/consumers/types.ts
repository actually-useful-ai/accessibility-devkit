import { assessTimeLimit, type TimeLimitPolicy } from '../../packages/core/dist/index.js';

const policy: TimeLimitPolicy = { warningDurationMs: 20_000, extensionCount: 10 };
const status: 'passes' | 'fails' | 'manual' = assessTimeLimit(policy).status;

void status;
