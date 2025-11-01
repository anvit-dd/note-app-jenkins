import { authOptions } from '@/lib/auth'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

describe('Auth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have correct session configuration', () => {
    expect(authOptions.session).toBeDefined()
    expect(authOptions.session!.strategy).toBe('jwt')
    expect(authOptions.session!.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
  })

  it('should have correct JWT configuration', () => {
    expect(authOptions.jwt).toBeDefined()
    expect(authOptions.jwt!.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
  })

  it('should have a CredentialsProvider', () => {
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('credentials')
  })

  describe('Credentials Provider', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const credentialsProvider = authOptions.providers[0] as any

    it('should have correct name', () => {
      expect(credentialsProvider.id).toBe('credentials')
    })

    it('should have authorize function defined', () => {
      expect(credentialsProvider.authorize).toBeDefined()
      expect(typeof credentialsProvider.authorize).toBe('function')
    })

    it('should have credentials configuration', () => {
      expect(credentialsProvider.name).toBe('Credentials')
    })
  })

  describe('JWT callback', () => {
    it('should add role to token when user is present', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = {} as any
      const user = { id: 'user-123', role: 'ADMIN' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await authOptions.callbacks!.jwt!({ token, user, account: null, profile: undefined } as any)

      expect(result.role).toBe('ADMIN')
    })

    it('should not modify token when user is absent', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = { role: 'USER' } as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await authOptions.callbacks!.jwt!({ token, account: null, profile: undefined } as any)

      expect(result.role).toBe('USER')
    })
  })

  describe('Session callback', () => {
    it('should add user id and role to session', async () => {
      const session = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        expires: new Date().toISOString(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = { sub: 'user-123', role: 'ADMIN' } as any

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await authOptions.callbacks!.session!({ session, token } as any) as any

      expect(result.user.id).toBe('user-123')
      expect(result.user.role).toBe('ADMIN')
    })
  })
})

