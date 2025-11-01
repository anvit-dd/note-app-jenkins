import { GET, PUT, DELETE } from '@/app/api/notes/[id]/route'
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
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe('/api/notes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/notes/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const params = Promise.resolve({ id: 'note-1' })
      const request = new Request('http://localhost:3000/api/notes/note-1', {
        method: 'GET',
      })

      const response = await GET(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should return a specific note if it belongs to the user', async () => {
      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test Content',
        slug: 'test-note',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastEdited: new Date(),
        author: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(mockNote)

      const params = Promise.resolve({ id: 'note-1' })
      const request = new Request('http://localhost:3000/api/notes/note-1', {
        method: 'GET',
      })

      const response = await GET(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('note-1')
      expect(data.title).toBe('Test Note')
      expect(data.content).toBe('Test Content')
      expect(data.author.id).toBe('user-123')
      expect(data.author.name).toBe('Test User')
    })

    it('should return 404 if note not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(null)

      const params = Promise.resolve({ id: 'note-999' })
      const request = new Request('http://localhost:3000/api/notes/note-999', {
        method: 'GET',
      })

      const response = await GET(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Note not found')
    })
  })

  describe('PUT /api/notes/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const params = { id: 'note-1' }
      const request = new Request('http://localhost:3000/api/notes/note-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      })

      const response = await PUT(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should update a note successfully', async () => {
      const existingNote = {
        id: 'note-1',
        title: 'Old Title',
        content: 'Old Content',
        slug: 'old-title',
        published: false,
      }

      const updatedNote = {
        id: 'note-1',
        title: 'New Title',
        content: 'New Content',
        slug: 'new-title',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastEdited: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock)
        .mockResolvedValueOnce(existingNote) // First call: check ownership
        .mockResolvedValueOnce(null) // Second call: check slug uniqueness
      ;(prisma.note.update as jest.Mock).mockResolvedValue(updatedNote)

      const params = { id: 'note-1' }
      const request = new Request('http://localhost:3000/api/notes/note-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Title',
          content: 'New Content',
        }),
      })

      const response = await PUT(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('note-1')
      expect(data.title).toBe('New Title')
      expect(data.content).toBe('New Content')
      expect(data.slug).toBe('new-title')
      expect(prisma.note.update).toHaveBeenCalled()
    })

    it('should return 404 if note not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(null)

      const params = { id: 'note-999' }
      const request = new Request('http://localhost:3000/api/notes/note-999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      })

      const response = await PUT(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Note not found')
    })

    it('should return 400 for invalid input', async () => {
      const existingNote = {
        id: 'note-1',
        title: 'Old Title',
        content: 'Old Content',
        slug: 'old-title',
        published: false,
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote)

      const params = { id: 'note-1' }
      const request = new Request('http://localhost:3000/api/notes/note-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }), // Invalid: empty title
      })

      const response = await PUT(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Validation error')
    })
  })

  describe('DELETE /api/notes/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const params = { id: 'note-1' }
      const request = new Request('http://localhost:3000/api/notes/note-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should delete a note successfully', async () => {
      const existingNote = {
        id: 'note-1',
        title: 'Test Note',
        authorId: 'user-123',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote)
      ;(prisma.note.delete as jest.Mock).mockResolvedValue(existingNote)

      const params = { id: 'note-1' }
      const request = new Request('http://localhost:3000/api/notes/note-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Note deleted successfully')
      expect(prisma.note.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' },
      })
    })

    it('should return 404 if note not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findFirst as jest.Mock).mockResolvedValue(null)

      const params = { id: 'note-999' }
      const request = new Request('http://localhost:3000/api/notes/note-999', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Note not found')
    })
  })
})

