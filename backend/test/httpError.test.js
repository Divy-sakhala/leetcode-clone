const { test } = require('node:test');
const assert = require('node:assert');
const { HttpError, handleError } = require('../src/utils/httpError');

const capture = (err) => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  handleError(res, err);
  return res;
};

const named = (name) => Object.assign(new Error('x'), { name });

test('maps known errors to status codes and JSON messages', () => {
  const cases = [
    [new HttpError(403, 'Nope'), 403, 'Nope'],
    [named('TokenExpiredError'), 401, 'Invalid or expired token'],
    [named('CastError'), 400, 'Invalid id'],
    [Object.assign(new Error('dup'), { code: 11000, keyValue: { emailId: 'a@b.c' } }), 409, 'Email already registered'],
    [Object.assign(new Error('bad json'), { type: 'entity.parse.failed' }), 400, 'Malformed JSON body'],
  ];
  for (const [err, status, message] of cases) {
    const res = capture(err);
    assert.strictEqual(res.statusCode, status);
    assert.deepStrictEqual(res.body, { message });
  }
});

test('unknown errors become a generic 500 without leaking details', (t) => {
  t.mock.method(console, 'error', () => {});
  const res = capture(new Error('connection string mongodb://user:secret@host'));
  assert.strictEqual(res.statusCode, 500);
  assert.deepStrictEqual(res.body, { message: 'Internal server error' });
});
