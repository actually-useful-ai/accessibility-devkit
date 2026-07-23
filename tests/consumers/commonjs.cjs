const assert = require('node:assert/strict');
const { assessTimeLimit } = require('../../packages/core/dist/index.js');

assert.equal(assessTimeLimit({ adjustmentMultiplier: 10 }).status, 'passes');
