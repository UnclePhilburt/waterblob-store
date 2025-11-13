#!/bin/bash

echo ""
echo "🚀🚀🚀 RENDER START SCRIPT 🚀🚀🚀"
echo ""
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo ""
echo "Checking server.js..."
if [ -f "server.js" ]; then
    echo "✅ server.js EXISTS"
else
    echo "❌ server.js NOT FOUND"
    exit 1
fi
echo ""
echo "Checking node_modules..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules EXISTS"
else
    echo "❌ node_modules NOT FOUND"
    exit 1
fi
echo ""
echo "Node version:"
node --version
echo ""
echo "NPM version:"
npm --version
echo ""
echo "Environment variables:"
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"
echo ""
echo "🔥 Starting Node server..."
echo ""
node server.js
