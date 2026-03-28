#!/bin/bash

# 🚀 OpenClaw Railway Start Script
# Optimized startup with health checks and error handling

set -e

echo "🚀 Starting OpenClaw on Railway..."
echo "==================================="

# Navigate to workspace
cd /app/workspace

# Check if workspace exists
if [ ! -d "/app/workspace" ]; then
    echo "❌ Workspace directory not found!"
    exit 1
fi

# Install skills if skills folder exists
if [ -d "/app/workspace/skills" ]; then
    echo "📦 Installing skills..."
    skill_count=$(find /app/workspace/skills -maxdepth 1 -type d -not -name "skills" -not -name ".*" | wc -l)
    echo "  ✅ Found $skill_count skills"
fi

# Check environment variables
echo "🔍 Checking environment variables..."
required_vars=(
    "OPENCLAW_WORKSPACE"
    "OPENCLAW_PORT"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  Warning: $var not set, using default"
    fi
done

# Set default values if not set
export OPENCLAW_WORKSPACE=${OPENCLAW_WORKSPACE:-/app/workspace}
export OPENCLAW_PORT=${OPENCLAW_PORT:-9110}
export OPENCLAW_HOST=${OPENCLAW_HOST:-0.0.0.0}

echo "✅ Workspace: $OPENCLAW_WORKSPACE"
echo "✅ Port: $OPENCLAW_PORT"
echo "✅ Host: $OPENCLAW_HOST"

# Check for optional integrations
if [ -n "$VERCEL_TOKEN" ]; then
    echo "✅ Vercel token configured"
fi

if [ -n "$GROQ_API_KEY" ]; then
    echo "✅ Groq API key configured"
fi

if [ -n "$PEXELS_API_KEY" ]; then
    echo "✅ Pexels API key configured"
fi

# Start OpenClaw Gateway
echo "🚀 Starting OpenClaw Gateway..."
echo "==================================="

# Use npx to run openclaw gateway
npx openclaw gateway start \
    --port $OPENCLAW_PORT \
    --host $OPENCLAW_HOST \
    --workspace $OPENCLAW_WORKSPACE &

# Wait for gateway to be ready
echo "⏳ Waiting for gateway to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f -s "http://localhost:$OPENCLAW_PORT/health" > /dev/null 2>&1; then
        echo "✅ Gateway is ready!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "  Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Gateway failed to start!"
    exit 1
fi

echo "🎉 OpenClaw is running on http://localhost:$OPENCLAW_PORT"

# Keep container running
wait
