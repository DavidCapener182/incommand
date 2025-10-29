import { NextRequest } from 'next/server';
import { enforceAdmin } from '@/lib/auth/onlyAdmin';

jest.mock('@/lib/auth/session', () => ({
  getUser: jest.fn(),
}));

const { getUser } = jest.requireMock('@/lib/auth/session') as { getUser: jest.Mock };

describe('onlyAdmin enforcement', () => {
  const request = {} as NextRequest;

  beforeEach(() => {
    process.env.ALLOWED_ADMIN_EMAIL = 'david@incommand.uk';
    getUser.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    getUser.mockResolvedValue(null);
    const result = await enforceAdmin(request);
    expect(result.ok).toBe(false);
    expect(result.response?.status).toBe(401);
  });

  it('rejects requests from non-allowlisted users', async () => {
    getUser.mockResolvedValue({ email: 'someone@example.com' });
    const result = await enforceAdmin(request);
    expect(result.ok).toBe(false);
    expect(result.response?.status).toBe(403);
  });

  it('allows the configured admin', async () => {
    getUser.mockResolvedValue({ email: 'david@incommand.uk' });
    const result = await enforceAdmin(request);
    expect(result.ok).toBe(true);
    expect(result.email).toBe('david@incommand.uk');
  });
});
