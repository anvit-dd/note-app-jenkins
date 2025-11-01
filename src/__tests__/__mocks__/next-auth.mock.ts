export const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

export const getServerSessionMock = jest.fn().mockResolvedValue(mockSession)

export const mockAuthOptions = {
  providers: [],
  session: { strategy: 'jwt' as const },
  secret: 'test-secret',
}

