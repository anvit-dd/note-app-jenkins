import { PrismaClient } from '@prisma/client'

export const createMockPrismaClient = () => {
  const notes: any[] = []
  const users: any[] = []
  const shareLinks: any[] = []

  return {
    note: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shareLink: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as any as PrismaClient
}

export const mockPrisma = createMockPrismaClient()

