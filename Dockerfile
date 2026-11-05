# Node.js 22 LTS base image (Alpine Linux for small footprint and minimal attack surface)
FROM node:22-alpine

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Create working directory
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code and public assets
COPY src/ ./src/
COPY public/ ./public/

# Switch to non-root user provided by node image for enhanced container security
USER node

# Expose standard Cloud Run port
EXPOSE 8080

# Run directly with Node.js native TypeScript type stripping (Zero build step!)
CMD ["node", "--experimental-strip-types", "src/index.ts"]

