const { test } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

process.env.JWT_KEY = 'test-secret';
const userMiddleware = require('../src/middleware/userMiddleware');
const adminMiddleware = require('../src/middleware/adminMiddleware');

const fakeRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
};

const run = async (middleware, cookies) => {
  const res = fakeRes();
  let calledNext = false;
  await middleware({ cookies }, res, () => { calledNext = true; });
  return { res, calledNext };
};

for (const [name, middleware] of [['userMiddleware', userMiddleware], ['adminMiddleware', adminMiddleware]]) {
  test(`${name} rejects a request with no token`, async () => {
    const { res, calledNext } = await run(middleware, {});
    assert.strictEqual(calledNext, false);
    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { message: 'Token is not present' });
  });

  test(`${name} rejects a token signed with another key`, async () => {
    const token = jwt.sign({ _id: 'abc', role: 'admin' }, 'wrong-secret');
    const { res, calledNext } = await run(middleware, { token });
    assert.strictEqual(calledNext, false);
    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { message: 'Invalid or expired token' });
  });

  test(`${name} rejects an expired token`, async () => {
    const token = jwt.sign({ _id: 'abc', role: 'admin', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_KEY);
    const { res, calledNext } = await run(middleware, { token });
    assert.strictEqual(calledNext, false);
    assert.strictEqual(res.statusCode, 401);
  });
}
