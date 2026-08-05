import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(() => ({ auth: {} }))
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: createClientMock
}));

import { createAuthClient } from './lazy-client';

describe('createAuthClient', () => {
  beforeEach(() => {
    createClientMock.mockClear();
  });

  it('does not initialize Supabase until an auth interaction requests it', async () => {
    expect(createClientMock).not.toHaveBeenCalled();

    const client = await createAuthClient();

    expect(client).toEqual({ auth: {} });
    expect(createClientMock).toHaveBeenCalledOnce();
  });
});
