#!/bin/bash

# Enverse Deployment Verification Script
# Run this before deploying to catch common issues

echo "🔍 Enverse Pre-Deployment Check"
echo "================================"

# Check 1: No hardcoded URLs in frontend
echo ""
echo "✓ Checking for hardcoded URLs..."
HARDCODED=$(grep -r "127.0.0.1:8000\|localhost:8000" frontend/enverse-ui/src --exclude-dir=node_modules --exclude="*.config.ts" | grep -v "config/api.ts" | wc -l)
if [ "$HARDCODED" -eq 0 ]; then
    echo "  ✅ No hardcoded URLs found"
else
    echo "  ❌ Found hardcoded URLs! Check frontend/enverse-ui/src/"
    grep -r "127.0.0.1:8000\|localhost:8000" frontend/enverse-ui/src --exclude-dir=node_modules --exclude="*.config.ts" | grep -v "config/api.ts"
    exit 1
fi

# Check 2: .env files exist
echo ""
echo "✓ Checking environment files..."
if [ -f "frontend/enverse-ui/.env" ]; then
    echo "  ✅ Frontend .env exists"
else
    echo "  ⚠️  Frontend .env missing (create from .env.example)"
fi

if [ -f "backend/.env" ]; then
    echo "  ✅ Backend .env exists"
else
    echo "  ⚠️  Backend .env missing (optional for local dev)"
fi

# Check 3: Required dependencies
echo ""
echo "✓ Checking dependencies..."
if [ -f "frontend/enverse-ui/node_modules/.package-lock.json" ]; then
    echo "  ✅ Frontend dependencies installed"
else
    echo "  ❌ Run: cd frontend/enverse-ui && npm install"
fi

if [ -f "backend/requirements.txt" ]; then
    echo "  ✅ Backend requirements.txt found"
else
    echo "  ❌ Backend requirements.txt missing!"
    exit 1
fi

# Check 4: Config files
echo ""
echo "✓ Checking deployment configs..."
if [ -f "Dockerfile.backend" ]; then
    echo "  ✅ Backend Dockerfile exists"
else
    echo "  ❌ Dockerfile.backend missing!"
fi

if [ -f "Dockerfile.frontend" ]; then
    echo "  ✅ Frontend Dockerfile exists"
else
    echo "  ❌ Dockerfile.frontend missing!"
fi

if [ -f "frontend/enverse-ui/vercel.json" ]; then
    echo "  ✅ Vercel config exists"
else
    echo "  ⚠️  vercel.json missing (optional)"
fi

# Check 5: CORS configuration
echo ""
echo "✓ Checking CORS settings..."
CORS_CHECK=$(grep "allow_origins=\[\"\*\"\]" backend/app/main.py)
if [ -n "$CORS_CHECK" ]; then
    echo "  ⚠️  CORS allows all origins - update for production!"
    echo "     In backend/app/main.py, replace allow_origins=[\"*\"]"
else
    echo "  ✅ CORS configured"
fi

# Check 6: API config file
echo ""
echo "✓ Checking API configuration..."
if [ -f "frontend/enverse-ui/src/config/api.ts" ]; then
    echo "  ✅ API config exists"
else
    echo "  ❌ frontend/enverse-ui/src/config/api.ts missing!"
    exit 1
fi

echo ""
echo "================================"
echo "🎯 Pre-Deployment Check Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env files with production values"
echo "2. Update CORS in backend/app/main.py for production domains"
echo "3. Test locally: npm run dev (frontend) + uvicorn app.main:app (backend)"
echo "4. Commit and push to GitHub"
echo "5. Connect to Render (backend) and Vercel (frontend)"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."
