# 🚀 OpenClaw on Railway - Optimized Dockerfile
# Built with lessons from 45 skills deployment

FROM node:20-bookworm-slim

# Set working directory
WORKDIR /app

# Install system dependencies (optimized for size + speed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    ffmpeg \
    python3 \
    python3-pip \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install OpenClaw CLI globally
RUN npm install -g openclaw-cli

# Create workspace directory
RUN mkdir -p /app/workspace

# Copy workspace files
COPY workspace/ /app/workspace/

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Copy health check script
COPY healthcheck.sh /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# Set environment variables
ENV NODE_ENV=production
ENV OPENCLAW_WORKSPACE=/app/workspace
ENV OPENCLAW_PORT=9110
ENV OPENCLAW_HOST=0.0.0.0

# Expose port
EXPOSE 9110

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD bash /app/healthcheck.sh || exit 1

# Start command
CMD ["bash", "/app/start.sh"]
