# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --include=dev

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Generate Prisma client for runtime
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
