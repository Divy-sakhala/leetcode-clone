const { test } = require('node:test');
const assert = require('node:assert');
const validate = require('../src/utils/validator');
const { HttpError } = require('../src/utils/httpError');

const valid = { firstName: 'Divy', emailId: 'divy@example.com', password: 'Str0ng!Pass' };

test('accepts a valid signup', () => {
  assert.doesNotThrow(() => validate(valid));
});

test('rejects missing fields', () => {
  for (const field of ['firstName', 'emailId', 'password']) {
    const data = { ...valid };
    delete data[field];
    assert.throws(() => validate(data), { message: 'Some Field Missing' });
  }
});

test('rejects an invalid email', () => {
  assert.throws(() => validate({ ...valid, emailId: 'not-an-email' }), { message: 'Invalid Email' });
});

test('rejects a weak password', () => {
  for (const password of ['Sh0rt!', 'alllowercase1!', 'NoDigits!!', 'NoSymbol123']) {
    assert.throws(() => validate({ ...valid, password }), { message: 'Weak Password' });
  }
});

test('validation errors are 400s', () => {
  try {
    validate({});
    assert.fail('expected validate to throw');
  } catch (err) {
    assert.ok(err instanceof HttpError);
    assert.strictEqual(err.status, 400);
  }
});
