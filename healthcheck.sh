#!/bin/bash

# 🔍 OpenClaw Health Check Script
# Returns 0 if healthy, 1 if unhealthy

PORT=${OPENCLAW_PORT:-9110}
HOST=${OPENCLAW_HOST:-localhost}

# Check if gateway is responding
if curl -f -s "http://$HOST:$PORT/health" > /dev/null 2>&1; then
    echo "✅ OpenClaw is healthy"
    exit 0
fi

# Alternative health check - check if process is running
if pgrep -f "openclaw" > /dev/null 2>&1; then
    echo "✅ OpenClaw process is running"
    exit 0
fi

echo "❌ OpenClaw is unhealthy"
exit 1
