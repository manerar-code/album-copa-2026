/**
 * Unit tests for src/shared/services/supabase.ts
 *
 * Tests the guard that throws when env vars are missing in non-production environments.
 * Uses jest.resetModules() + require() to re-initialise the module per scenario.
 *
 * NOTE: NODE_ENV in Jest is 'test', which satisfies `!== 'production'`, so the
 * throw branch is active — exactly what these tests verify.
 */

const FAKE_URL = 'https://fake-project.supabase.co';
const FAKE_KEY = 'eyJhbGciOiJIUzI1NiJ9.fake.key';

// Mock @supabase/supabase-js so createClient never makes real HTTP requests.
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: {}, from: jest.fn() })),
}));

// Store originals once — restored after every test.
const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  // Restore env vars regardless of what the test did.
  if (originalUrl === undefined) {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  } else {
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
  }
  if (originalKey === undefined) {
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  }
  jest.resetModules();
});

describe('supabase client — env var guard', () => {
  it('creates a client successfully when both env vars are set', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = FAKE_URL;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = FAKE_KEY;

    expect(() => {
      require('@shared/services/supabase');
    }).not.toThrow();
  });

  it('throws when EXPO_PUBLIC_SUPABASE_URL is missing (NODE_ENV = test ≠ production)', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = FAKE_KEY;

    expect(() => {
      require('@shared/services/supabase');
    }).toThrow('Missing Supabase env vars');
  });

  it('throws when EXPO_PUBLIC_SUPABASE_ANON_KEY is missing (NODE_ENV = test ≠ production)', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = FAKE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => {
      require('@shared/services/supabase');
    }).toThrow('Missing Supabase env vars');
  });

  it('throws when both env vars are missing', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => {
      require('@shared/services/supabase');
    }).toThrow('Missing Supabase env vars');
  });
});
