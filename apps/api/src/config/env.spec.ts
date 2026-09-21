import { corsOrigins, validateEnv } from './env';

describe('validateEnv', () => {
  it('falls back to local development defaults', () => {
    const env = validateEnv({});
    expect(env.PORT).toBe(4000);
    expect(env.CHAIN_ID).toBe(31337);
    expect(env.NODE_ENV).toBe('development');
    expect(env.REGISTRY_ADDRESS).toBeUndefined();
  });

  it('turns the env strings into numbers', () => {
    const env = validateEnv({ PORT: '5000', CHAIN_ID: '80002' });
    expect(env.PORT).toBe(5000);
    expect(env.CHAIN_ID).toBe(80002);
  });

  it('rejects a malformed contract address', () => {
    expect(() => validateEnv({ REGISTRY_ADDRESS: 'not-an-address' })).toThrow(
      /REGISTRY_ADDRESS/,
    );
  });
});

describe('corsOrigins', () => {
  it('splits and trims the list', () => {
    expect(corsOrigins('http://a.com, http://b.com ,')).toEqual([
      'http://a.com',
      'http://b.com',
    ]);
  });
});
