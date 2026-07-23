import assert from 'node:assert/strict';

import { getContrastRatio } from '../../packages/core/dist/index.mjs';

assert.equal(getContrastRatio('#000', '#fff'), 21);
