import { GET } from '@/app/api/shared/[token]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    shareLink: {
      findUnique: jest.fn(),
    },
  },
}))

type RouteParams = { params: Promise<{ token: string }> }

describe('/api/shared/[token]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/shared/[token]', () => {
    it('should return 404 if share link not found', async () => {
      ;(prisma.shareLink.findUnique as jest.Mock).mockResolvedValue(null)

      const params = Promise.resolve({ token: 'invalid-token' })
      const request = new NextRequest('http://localhost:3000/api/shared/invalid-token', {
        method: 'GET',
      })

      const response = await GET(request, { params } as RouteParams)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Share link not found')
    })

    it('should return 410 if share link has expired', async () => {
      const expiredLink = {
        id: 'link-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        createdAt: new Date(),
        note: {
          id: 'note-1',
          title: 'Expired Note',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastEdited: new Date(),
          author: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      }

      ;(prisma.shareLink.findUnique as jest.Mock).mockResolvedValue(expiredLink)

      const params = Promise.resolve({ token: 'expired-token' })
      const request = new NextRequest('http://localhost:3000/api/shared/expired-token', {
        method: 'GET',
      })

      const response = await GET(request, { params } as RouteParams)
      const data = await response.json()

      expect(response.status).toBe(410)
      expect(data.message).toBe('Share link has expired')
    })

    it('should return note data for valid non-expired link', async () => {
      const validLink = {
        id: 'link-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        createdAt: new Date(),
        note: {
          id: 'note-1',
          title: 'Shared Note',
          content: 'Shared Content',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastEdited: new Date(),
          author: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      }

      ;(prisma.shareLink.findUnique as jest.Mock).mockResolvedValue(validLink)

      const params = Promise.resolve({ token: 'valid-token' })
      const request = new NextRequest('http://localhost:3000/api/shared/valid-token', {
        method: 'GET',
      })

      const response = await GET(request, { params } as RouteParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('note-1')
      expect(data.title).toBe('Shared Note')
      expect(data.content).toBe('Shared Content')
      expect(data.author).toEqual({
        name: 'Test User',
        email: 'test@example.com',
      })
      expect(data.createdAt).toBe(validLink.note.createdAt.toISOString())
      expect(data.updatedAt).toBe(validLink.note.updatedAt.toISOString())
      expect(data.lastEdited).toBe(validLink.note.lastEdited.toISOString())
    })

    it('should return note data for link without expiration', async () => {
      const validLink = {
        id: 'link-1',
        token: 'valid-token',
        expiresAt: null,
        createdAt: new Date(),
        note: {
          id: 'note-1',
          title: 'Shared Note',
          content: 'Shared Content',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastEdited: new Date(),
          author: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      }

      ;(prisma.shareLink.findUnique as jest.Mock).mockResolvedValue(validLink)

      const params = Promise.resolve({ token: 'valid-token' })
      const request = new NextRequest('http://localhost:3000/api/shared/valid-token', {
        method: 'GET',
      })

      const response = await GET(request, { params } as RouteParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe('Shared Note')
    })

    it('should return 500 on database error', async () => {
      ;(prisma.shareLink.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const params = Promise.resolve({ token: 'valid-token' })
      const request = new NextRequest('http://localhost:3000/api/shared/valid-token', {
        method: 'GET',
      })

      const response = await GET(request, { params } as RouteParams)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Internal server error')
    })
  })
})

