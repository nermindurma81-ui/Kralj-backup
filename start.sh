#!/bin/sh

# 🚀 OpenClaw Railway Start Script - Alpine Version
# Simplified for reliability

set -e

echo "🚀 Starting OpenClaw on Railway..."
echo "==================================="

cd /app/workspace

# Set defaults
export OPENCLAW_WORKSPACE=${OPENCLAW_WORKSPACE:-/app/workspace}
export OPENCLAW_PORT=${OPENCLAW_PORT:-9110}
export OPENCLAW_HOST=${OPENCLAW_HOST:-0.0.0.0}

echo "✅ Workspace: $OPENCLAW_WORKSPACE"
echo "✅ Port: $OPENCLAW_PORT"
echo "✅ Host: $OPENCLAW_HOST"

# Check for optional keys
[ -n "$GROQ_API_KEY" ] && echo "✅ Groq API configured"
[ -n "$PEXELS_API_KEY" ] && echo "✅ Pexels API configured"

# Start OpenClaw
echo "🚀 Starting Gateway..."
exec npx openclaw gateway start \
    --port $OPENCLAW_PORT \
    --host $OPENCLAW_HOST \
    --workspace $OPENCLAW_WORKSPACE
