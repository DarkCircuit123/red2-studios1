#!/bin/bash

# BUILD DIAGNOSTIC SCRIPT
# Comprehensive diagnostics for Wix build issues
# This script identifies fatal errors preventing successful 'wix build'

echo "=========================================="
echo "WIX BUILD DIAGNOSTIC SCRIPT"
echo "=========================================="
echo ""

# Step 1: Check Node version
echo "📋 Step 1: Checking Node.js version..."
node --version
npm --version
echo ""

# Step 2: Check for missing dependencies
echo "📋 Step 2: Checking for missing dependencies..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules not found - running npm install"
  npm install
else
  echo "✅ node_modules exists"
fi
echo ""

# Step 3: TypeScript compilation check
echo "📋 Step 3: Running TypeScript compilation check..."
npx tsc --noEmit 2>&1 | head -50
echo ""

# Step 4: Check for critical import errors
echo "📋 Step 4: Scanning for critical import errors..."
echo "  - Checking for Astro imports in React components..."
grep -r "from ['\"]astro" src/components --include="*.tsx" --include="*.ts" 2>/dev/null | head -10
echo ""

# Step 5: Check for server-only imports in client components
echo "📋 Step 5: Checking for server-only imports in client components..."
grep -r "from ['\"]fs\|from ['\"]path\|from ['\"]os" src/components --include="*.tsx" --include="*.ts" 2>/dev/null | head -10
echo ""

# Step 6: Verify Wix SDK imports
echo "📋 Step 6: Verifying Wix SDK imports..."
grep -r "@wix/codegen-framework-packages" src --include="*.ts" --include="*.tsx" 2>/dev/null
echo ""

# Step 7: Check for circular dependencies
echo "📋 Step 7: Checking for potential circular dependencies..."
echo "  - Router imports..."
grep -A 5 "import.*Router" src/components/AppRoot.tsx
echo ""

# Step 8: Verify API routes
echo "📋 Step 8: Verifying API routes..."
echo "  - Checking for APIRoute exports..."
grep -l "export.*APIRoute" src/pages/api/**/*.ts 2>/dev/null | wc -l
echo "  - API routes found"
echo ""

# Step 9: Check astro.config.mjs
echo "📋 Step 9: Checking astro.config.mjs..."
if [ -f "src/astro.config.mjs" ]; then
  echo "✅ astro.config.mjs exists"
  echo "  - Checking for critical integrations..."
  grep -E "wix\(|react\(|tailwind\(" src/astro.config.mjs | head -5
else
  echo "❌ astro.config.mjs not found"
fi
echo ""

# Step 10: Check for build-time errors
echo "📋 Step 10: Attempting Astro build..."
echo "  - Running: astro build"
npx astro build 2>&1 | tee build-output.log | head -100
echo ""

echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "  - Check build-output.log for full build output"
echo "  - Look for [ERROR] or [FATAL] messages"
echo "  - Review TypeScript compilation errors above"
echo ""
