#!/bin/bash

echo "🔥🔥🔥 RENDER BUILD SCRIPT STARTING 🔥🔥🔥"
echo ""
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo ""
echo "Parent directory contents:"
cd ..
ls -la
echo ""
echo "Checking for frontend directory..."
if [ -d "frontend" ]; then
    echo "✅ Frontend directory EXISTS"
    echo "Frontend contents:"
    ls -la frontend/
else
    echo "❌ Frontend directory NOT FOUND"
fi
echo ""
echo "Checking for backend directory..."
if [ -d "backend" ]; then
    echo "✅ Backend directory EXISTS"
    echo "Backend contents:"
    ls -la backend/
else
    echo "❌ Backend directory NOT FOUND"
fi
echo ""
echo "Going to backend directory..."
cd backend || exit 1
echo "Now in: $(pwd)"
echo ""
echo "Installing npm dependencies..."
npm install
BUILD_EXIT_CODE=$?
echo ""
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅✅✅ NPM INSTALL SUCCESSFUL ✅✅✅"
else
    echo "❌❌❌ NPM INSTALL FAILED WITH CODE $BUILD_EXIT_CODE ❌❌❌"
    exit $BUILD_EXIT_CODE
fi
echo ""
echo "Checking node_modules..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules EXISTS"
    echo "Installed packages:"
    ls node_modules/ | head -20
else
    echo "❌ node_modules NOT FOUND"
fi
echo ""
echo "🔥🔥🔥 BUILD COMPLETE 🔥🔥🔥"
