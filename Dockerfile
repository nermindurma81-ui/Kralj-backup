# 🚀 OpenClaw on Railway - Simplified & Optimized
# Minimal dependencies for faster, more reliable builds

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install minimal system dependencies (Alpine uses apk, not apt)
RUN apk add --no-cache \
    git \
    curl \
    python3 \
    && rm -rf /var/cache/apk/*

# Install OpenClaw CLI globally
RUN npm install -g openclaw-cli

# Create workspace directory
RUN mkdir -p /app/workspace

# Copy workspace files
COPY . /app/workspace/

# Set environment variables
ENV NODE_ENV=production
ENV OPENCLAW_WORKSPACE=/app/workspace
ENV OPENCLAW_PORT=9110
ENV OPENCLAW_HOST=0.0.0.0

# Expose port
EXPOSE 9110

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9110/health || exit 1

# Start command
CMD ["sh", "-c", "cd /app/workspace && npx openclaw gateway start --port $OPENCLAW_PORT --host $OPENCLAW_HOST --workspace $OPENCLAW_WORKSPACE"]
