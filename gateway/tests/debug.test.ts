import { env } from '../src/config/env';
describe('debug', () => {
  it('logs env', () => {
    console.log(env);
  });
});
