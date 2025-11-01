# Testing Documentation

This document describes the testing setup and strategy for the note-app backend.

## Test Framework

The project uses **Jest** as the testing framework, configured specifically for Next.js API routes.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

Current test coverage includes:

### API Endpoints

1. **Notes API** (`/api/notes`)
   - ✅ GET `/api/notes` - Fetch all notes for a user
   - ✅ POST `/api/notes` - Create a new note
   - ✅ GET `/api/notes/[id]` - Fetch a specific note
   - ✅ PUT `/api/notes/[id]` - Update a note
   - ✅ DELETE `/api/notes/[id]` - Delete a note

2. **Share API** (`/api/notes/[id]/share` and `/api/share`)
   - ✅ POST `/api/notes/[id]/share` - Create a share link
   - ✅ GET `/api/notes/[id]/share` - Get all share links for a user
   - ✅ GET `/api/share` - Get all share links
   - ✅ DELETE `/api/share/[id]` - Delete a share link
   - ✅ DELETE `/api/notes/[id]/share/[id]` - Delete a share link

3. **Shared Notes API** (`/api/shared/[token]`)
   - ✅ GET `/api/shared/[token]` - Fetch a shared note by token
   - ✅ Validates token expiration
   - ✅ Handles non-existent tokens

4. **Authentication API**
   - ✅ POST `/api/auth/register` - User registration
   - ✅ Credential validation
   - ✅ Duplicate email checking
   - ✅ Password hashing
   - ✅ Auth configuration testing

### Test Cases Covered

#### Authentication Tests
- ✅ Missing credentials
- ✅ Invalid email format
- ✅ Short passwords
- ✅ Duplicate email registration
- ✅ Successful registration
- ✅ Database error handling

#### Notes API Tests
- ✅ Unauthorized access (401)
- ✅ Fetch all notes
- ✅ Create note with unique slug generation
- ✅ Update note
- ✅ Delete note
- ✅ Note not found (404)
- ✅ Invalid input validation (400)
- ✅ Duplicate slug handling
- ✅ Database error handling (500)

#### Share API Tests
- ✅ Unauthorized access
- ✅ Create share link
- ✅ Fetch share links
- ✅ Delete share link
- ✅ Invalid token
- ✅ Expired token
- ✅ Token not found

## Test Structure

```
src/__tests__/
├── __mocks__/
│   ├── prisma.mock.ts          # Prisma client mocks
│   └── next-auth.mock.ts       # NextAuth mocks
├── api/
│   ├── auth/
│   │   └── register/
│   │       └── route.test.ts   # Registration tests
│   ├── notes/
│   │   ├── route.test.ts       # Notes CRUD tests
│   │   ├── [id]/
│   │   │   ├── route.test.ts   # Individual note tests
│   │   │   └── share/
│   │   │       └── route.test.ts # Note share tests
│   ├── share/
│   │   ├── route.test.ts       # Share links tests
│   │   └── [id]/
│   │       └── route.test.ts   # Delete share link tests
│   └── shared/
│       └── [token]/
│           └── route.test.ts   # Shared note tests
└── lib/
    └── auth.test.ts            # Auth configuration tests
```

## Mocking Strategy

### Prisma Mock
All database operations are mocked using `jest.fn()` to avoid actual database connections during tests.

### NextAuth Mock
Authentication is mocked using `getServerSession` mock, allowing tests to simulate authenticated and unauthenticated states.

### Request/Response Mocking
Using native `Request` and `NextResponse` APIs for API route testing.

## Key Testing Patterns

### 1. Authentication Pattern
```javascript
// Mock authenticated user
(getServerSession as jest.Mock).mockResolvedValue({
  user: { id: 'user-123' },
})

// Mock unauthenticated
(getServerSession as jest.Mock).mockResolvedValue(null)
```

### 2. Database Mocking
```javascript
// Mock Prisma response
(prisma.note.findMany as jest.Mock).mockResolvedValue(mockNotes)

// Mock database error
(prisma.note.findMany as jest.Mock).mockRejectedValue(
  new Error('Database error')
)
```

### 3. Request Creation
```javascript
const request = new Request('http://localhost:3000/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'value' }),
})
```

## Coverage Goals

- **Current**: 47.15% overall coverage
- **Target**: 80%+ for critical paths
- **Focus Areas**:
  - API route handlers
  - Authentication flows
  - Database operations
  - Error handling

## Continuous Integration

Tests should be run in CI/CD pipeline:
```bash
npm test -- --coverage --watchAll=false
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Use mocks for external dependencies
3. **Assertions**: Test both success and failure cases
4. **Cleanup**: Use `beforeEach` to reset mocks
5. **Descriptive Names**: Use clear test descriptions

## Future Enhancements

- Add integration tests with test database
- Add E2E tests with Playwright/Cypress
- Add performance tests
- Add security tests
- Improve coverage for utilities and middleware

