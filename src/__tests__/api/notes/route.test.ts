import { GET, POST } from '@/app/api/notes/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    note: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('/api/notes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/notes', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should return all notes for authenticated user', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          title: 'Test Note 1',
          content: 'Content 1',
          slug: 'test-note-1',
          published: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastEdited: new Date(),
        },
        {
          id: 'note-2',
          title: 'Test Note 2',
          content: 'Content 2',
          slug: 'test-note-2',
          published: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastEdited: new Date(),
        },
      ]

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findMany as jest.Mock).mockResolvedValue(mockNotes)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].id).toBe('note-1')
      expect(data[0].title).toBe('Test Note 1')
      expect(data[1].id).toBe('note-2')
      expect(data[1].title).toBe('Test Note 2')
      expect(prisma.note.findMany).toHaveBeenCalledWith({
        where: { authorId: 'user-123' },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          slug: true,
          published: true,
          createdAt: true,
          updatedAt: true,
          lastEdited: true,
        },
      })
    })

    it('should return 500 on database error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Internal server error')
    })
  })

  describe('POST /api/notes', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Note',
          content: 'Content',
        }),
      }) as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe('Unauthorized')
    })

    it('should create a new note successfully', async () => {
      const newNote = {
        id: 'note-new',
        title: 'New Note',
        content: 'New Content',
        slug: 'new-note',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastEdited: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.note.create as jest.Mock).mockResolvedValue(newNote)

      const request = new Request('http://localhost:3000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Note',
          content: 'New Content',
        }),
      }) as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('note-new')
      expect(data.title).toBe('New Note')
      expect(data.content).toBe('New Content')
      expect(data.slug).toBe('new-note')
      expect(prisma.note.create).toHaveBeenCalled()
    })

    it('should return 400 for invalid input', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })

      const request = new Request('http://localhost:3000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '', // Invalid: empty title
          content: 'Content',
        }),
      }) as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Validation error')
      expect(data.errors).toBeDefined()
    })

    it('should generate unique slug when duplicate exists', async () => {
      const newNote = {
        id: 'note-new',
        title: 'Test Note',
        content: 'Content',
        slug: 'test-note-1',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastEdited: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.note.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing' }) // First slug exists
        .mockResolvedValueOnce(null) // Second slug is free
      ;(prisma.note.create as jest.Mock).mockResolvedValue(newNote)

      const request = new Request('http://localhost:3000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'Content',
        }),
      }) as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.slug).toBe('test-note-1')
      expect(data.title).toBe('Test Note')
      expect(data.content).toBe('Content')
    })
  })
})

