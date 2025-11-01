import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user successfully', async () => {
    const newUser = {
      id: 'user-new',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'USER',
      createdAt: new Date(),
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
    ;(prisma.user.create as jest.Mock).mockResolvedValue(newUser)

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      }),
    }) as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('User created successfully')
    expect(data.user.id).toBe('user-new')
    expect(data.user.email).toBe('newuser@example.com')
    expect(data.user.name).toBe('New User')
    expect(data.user.role).toBe('USER')
  })

  it('should return 400 if user already exists', async () => {
    const existingUser = {
      id: 'user-existing',
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'hashed-password',
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      }),
    }) as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('User with this email already exists')
  })

  it('should return 400 for invalid email', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      }),
    }) as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Validation error')
    expect(data.errors).toBeDefined()
  })

  it('should return 400 for password too short', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123', // Too short
        name: 'Test User',
      }),
    }) as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Validation error')
    expect(data.errors).toBeDefined()
    expect(data.errors[0].message).toContain('at least 6 characters')
  })

  it('should return 400 for missing name', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: '', // Empty name
      }),
    }) as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Validation error')
    expect(data.errors).toBeDefined()
  })

  it('should return 500 on database error', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
    ;(prisma.user.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    }) as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Internal server error')
  })
})
