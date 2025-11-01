import { POST, GET, DELETE } from '@/app/api/notes/[id]/share/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    note: {
      findFirst: jest.fn(),
    },
    shareLink: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mocked-token-123'),
  })),
}))

// Mock environment variable
process.env.NEXTAUTH_URL = 'http://localhost:3000'

describe('/api/notes/[id]/share', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/notes/[id]/share', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/notes/note-1/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: 'note-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should create a share link successfully', async () => {
      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        authorId: 'user-123',
      }

      const mockShareLink = {
        id: 'share-link-1',
        token: 'mocked-token-123',
        expiresAt: null,
        createdAt: new Date(),
        note: {
          title: 'Test Note',
          slug: 'test-note',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(mockNote)
      ;(prisma.shareLink.create as jest.Mock).mockResolvedValue(mockShareLink)

      const request = new Request('http://localhost:3000/api/notes/note-1/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: 'note-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.token).toBe('mocked-token-123')
      expect(data.shareUrl).toBe('http://localhost:3000/shared/mocked-token-123')
    })

    it('should return 404 if note not found or access denied', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/notes/note-999/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: 'note-999' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Note not found or access denied')
    })

    it('should return 400 for invalid input', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })

      const request = new Request('http://localhost:3000/api/notes/note-1/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing noteId
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Invalid input')
    })
  })

  describe('GET /api/notes/[id]/share', () => {
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
      ]

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.shareLink.findMany as jest.Mock).mockResolvedValue(mockShareLinks)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].shareUrl).toBe('http://localhost:3000/shared/token-123')
    })
  })

  describe('DELETE /api/notes/[id]/share', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const params = Promise.resolve({ id: 'share-link-1' })
      const request = new Request('http://localhost:3000/api/notes/note-1/share/share-link-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should delete a share link successfully', async () => {
      const mockShareLink = {
        id: 'share-link-1',
        token: 'token-123',
        createdBy: 'user-123',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.shareLink.findFirst as jest.Mock).mockResolvedValue(mockShareLink)
      ;(prisma.shareLink.delete as jest.Mock).mockResolvedValue(mockShareLink)

      const params = Promise.resolve({ id: 'share-link-1' })
      const request = new Request('http://localhost:3000/api/notes/note-1/share/share-link-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Share link deleted successfully')
      expect(prisma.shareLink.delete).toHaveBeenCalledWith({
        where: { id: 'share-link-1' },
      })
    })

    it('should return 404 if share link not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.shareLink.findFirst as jest.Mock).mockResolvedValue(null)

      const params = Promise.resolve({ id: 'share-link-999' })
      const request = new Request('http://localhost:3000/api/notes/note-1/share/share-link-999', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Share link not found or access denied')
    })
  })
})

