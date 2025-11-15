FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage: Uses ARG values for environment variables
FROM base AS builder

# Build arguments for environment variables
ARG BETTER_AUTH_URL
ARG NEXT_PUBLIC_API_URL
ARG DATABASE_URL
ARG BETTER_AUTH_SECRET

# Set non-sensitive environment variables
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}

# Copy source code
COPY . .

# Build the application
# Uses ARG values for environment variables
# 
# For GitHub Actions with docker/build-push-action:
#   - name: Build and push
#     uses: docker/build-push-action@v6
#     with:
#       context: ./nextjs
#       file: ./nextjs/Dockerfile
#       build-args: |
#         DATABASE_URL=${{ secrets.DATABASE_URL }}
#         BETTER_AUTH_SECRET=${{ secrets.BETTER_AUTH_SECRET }}
#         BETTER_AUTH_URL=http://localhost:3000
#         NEXT_PUBLIC_API_URL=http://localhost:8000
#
# For local development:
#   docker build \
#     --build-arg DATABASE_URL="postgresql://..." \
#     --build-arg BETTER_AUTH_SECRET="your-secret" \
#     --build-arg BETTER_AUTH_URL="http://localhost:3000" \
#     --build-arg NEXT_PUBLIC_API_URL="http://localhost:8000" \
#     -t nextjs-app ./nextjs
RUN set -e && \
    export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/better_auth_db}" && \
    export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-ci-build-secret-placeholder}" && \
    pnpm build

# Runtime stage: Only include non-sensitive public environment variables
# All other variables (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL) must be provided at runtime
FROM base AS runtime

# Only set public environment variables (NEXT_PUBLIC_* are safe to include)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy built application and necessary files from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/app ./app
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/auth-schema.ts ./auth-schema.ts

# Expose port
EXPOSE 3000

# Run the application
# Note: DATABASE_URL and BETTER_AUTH_SECRET must be provided at runtime via -e or docker-compose
CMD ["pnpm", "start"]
