import { GET } from '@/app/api/share/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    shareLink: {
      findMany: jest.fn(),
    },
  },
}))

// Mock environment variable
process.env.NEXTAUTH_URL = 'http://localhost:3000'

describe('/api/share', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/share', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should return all share links for authenticated user', async () => {
      const mockShareLinks = [
        {
          id: 'link-1',
          token: 'token-123',
          expiresAt: null,
          createdAt: new Date(),
          note: {
            id: 'note-1',
            title: 'Test Note',
            slug: 'test-note',
            published: false,
          },
        },
        {
          id: 'link-2',
          token: 'token-456',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          note: {
            id: 'note-2',
            title: 'Another Note',
            slug: 'another-note',
            published: true,
          },
        },
      ]

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.shareLink.findMany as jest.Mock).mockResolvedValue(mockShareLinks)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0]).toHaveProperty('shareUrl')
      expect(data[0].shareUrl).toBe('http://localhost:3000/shared/token-123')
      expect(data[0]).toHaveProperty('note')
      expect(data[0].note.title).toBe('Test Note')
    })

    it('should return 500 on database error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.shareLink.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Internal server error')
    })
  })
})

