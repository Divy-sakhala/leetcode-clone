const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert');
const axios = require('axios');
const { getLanguageById, submitToken, waiting, summarizeResults } = require('../src/utils/problemUtility');

afterEach(() => mock.restoreAll());

const result = (status_id, extra = {}) => ({ status_id, time: '0.010', memory: 1000, stderr: null, ...extra });

test('getLanguageById maps supported languages to Judge0 ids', () => {
  assert.strictEqual(getLanguageById('c++'), 54);
  assert.strictEqual(getLanguageById('java'), 62);
  assert.strictEqual(getLanguageById('JavaScript'), 63);
  assert.strictEqual(getLanguageById('python'), undefined);
});

test('waiting resolves only after the timer', async () => {
  const start = Date.now();
  await waiting(50);
  assert.ok(Date.now() - start >= 45);
});

test('summarizeResults: all passing is accepted', () => {
  const summary = summarizeResults([result(3, { time: '0.010', memory: 1000 }), result(3, { time: '0.020', memory: 3000 })]);
  assert.strictEqual(summary.status, 'accepted');
  assert.strictEqual(summary.passed, 2);
  assert.strictEqual(summary.memory, 3000);
  assert.ok(Math.abs(summary.runtime - 0.03) < 1e-9);
  assert.strictEqual(summary.errorMessage, null);
});

test('summarizeResults: status 4 is a wrong answer', () => {
  const summary = summarizeResults([result(3), result(4)]);
  assert.strictEqual(summary.status, 'wrong');
  assert.strictEqual(summary.passed, 1);
});

test('summarizeResults: compile and runtime failures are errors', () => {
  const compile = summarizeResults([result(6, { compile_output: 'syntax error' })]);
  assert.strictEqual(compile.status, 'error');
  assert.strictEqual(compile.errorMessage, 'syntax error');

  const runtime = summarizeResults([result(11, { stderr: 'boom' })]);
  assert.strictEqual(runtime.status, 'error');
  assert.strictEqual(runtime.errorMessage, 'boom');
});

test('summarizeResults: an error outranks a wrong answer, in either order', () => {
  assert.strictEqual(summarizeResults([result(4), result(5)]).status, 'error');
  assert.strictEqual(summarizeResults([result(5), result(4)]).status, 'error');
});

test('submitToken polls until every submission has finished', async () => {
  const responses = [
    { submissions: [result(1), result(2)] },
    { submissions: [result(3), result(2)] },
    { submissions: [result(3), result(4)] },
  ];
  const request = mock.method(axios, 'request', async () => ({ data: responses.shift() }));

  const submissions = await submitToken(['t1', 't2'], { interval: 1 });

  assert.strictEqual(request.mock.callCount(), 3);
  assert.deepStrictEqual(submissions.map((s) => s.status_id), [3, 4]);
  assert.strictEqual(request.mock.calls[0].arguments[0].params.tokens, 't1,t2');
});

test('submitToken gives up after maxAttempts', async () => {
  const request = mock.method(axios, 'request', async () => ({ data: { submissions: [result(1)] } }));

  await assert.rejects(submitToken(['t1'], { interval: 1, maxAttempts: 3 }), /Timed out/);
  assert.strictEqual(request.mock.callCount(), 3);
});

test('submitToken passes Judge0 request errors through', async () => {
  mock.method(axios, 'request', async () => { throw new Error('network down'); });
  await assert.rejects(submitToken(['t1'], { interval: 1 }), /network down/);
});
