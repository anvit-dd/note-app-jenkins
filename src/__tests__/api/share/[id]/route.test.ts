import { DELETE } from '@/app/api/share/[id]/route'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    shareLink: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

type RouteParams = { params: { id: string } }

describe('/api/share/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DELETE /api/share/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const params = { id: 'share-link-1' }
      const request = new NextRequest('http://localhost:3000/api/share/share-link-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as RouteParams)
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

      const params = { id: 'share-link-1' }
      const request = new NextRequest('http://localhost:3000/api/share/share-link-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as RouteParams)
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

      const params = { id: 'share-link-999' }
      const request = new NextRequest('http://localhost:3000/api/share/share-link-999', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as RouteParams)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Share link not found or access denied')
    })

    it('should return 500 on database error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.shareLink.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const params = { id: 'share-link-1' }
      const request = new NextRequest('http://localhost:3000/api/share/share-link-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params } as RouteParams)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Internal server error')
    })
  })
})

