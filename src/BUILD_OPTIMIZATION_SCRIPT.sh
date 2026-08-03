#!/bin/bash

# Build Process Optimization & Cache Clearing Script
# Usage: bash BUILD_OPTIMIZATION_SCRIPT.sh

set -e

echo "=========================================="
echo "Build Process Optimization Script"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop any running processes
echo -e "${YELLOW}Step 1: Stopping any running processes...${NC}"
pkill -f "npm run dev" || true
pkill -f "npm run build" || true
pkill -f "astro" || true
sleep 2
echo -e "${GREEN}✓ Processes stopped${NC}"
echo ""

# Step 2: Clear caches
echo -e "${YELLOW}Step 2: Clearing all caches...${NC}"

echo "  - Removing .astro directory..."
rm -rf .astro

echo "  - Removing dist directory..."
rm -rf dist

echo "  - Removing node_modules/.vite..."
rm -rf node_modules/.vite

echo "  - Removing node_modules/.cache..."
rm -rf node_modules/.cache

echo "  - Clearing npm cache..."
npm cache clean --force

echo -e "${GREEN}✓ All caches cleared${NC}"
echo ""

# Step 3: Reinstall dependencies
echo -e "${YELLOW}Step 3: Reinstalling dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Build with increased memory
echo -e "${YELLOW}Step 4: Building with increased memory (4GB)...${NC}"
echo "  This may take 1-2 minutes..."
echo ""

export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

echo ""
echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Step 5: Check bundle size
echo -e "${YELLOW}Step 5: Checking bundle size...${NC}"
BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
echo "  Bundle size: $BUNDLE_SIZE"

# Parse size in MB
SIZE_MB=$(du -sm dist/ | cut -f1)
if [ "$SIZE_MB" -gt 20 ]; then
  echo -e "${RED}⚠ WARNING: Bundle size is large (${SIZE_MB}MB)${NC}"
  echo "  Consider optimizing images and fonts"
elif [ "$SIZE_MB" -gt 10 ]; then
  echo -e "${YELLOW}⚠ Bundle size is moderate (${SIZE_MB}MB)${NC}"
  echo "  Monitor for further optimization opportunities"
else
  echo -e "${GREEN}✓ Bundle size is optimal (${SIZE_MB}MB)${NC}"
fi
echo ""

# Step 6: Check for circular dependencies
echo -e "${YELLOW}Step 6: Checking for circular dependencies...${NC}"
CIRCULAR=$(npm run build 2>&1 | grep -i "circular" || true)
if [ -z "$CIRCULAR" ]; then
  echo -e "${GREEN}✓ No circular dependencies detected${NC}"
else
  echo -e "${RED}⚠ Circular dependencies found:${NC}"
  echo "$CIRCULAR"
fi
echo ""

# Step 7: Verify build artifacts
echo -e "${YELLOW}Step 7: Verifying build artifacts...${NC}"
if [ -d "dist" ]; then
  FILE_COUNT=$(find dist -type f | wc -l)
  echo "  Files in dist: $FILE_COUNT"
  echo -e "${GREEN}✓ Build artifacts verified${NC}"
else
  echo -e "${RED}✗ Build artifacts missing${NC}"
  exit 1
fi
echo ""

# Step 8: Summary
echo "=========================================="
echo -e "${GREEN}Build Optimization Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Test locally: npm run preview"
echo "  2. Deploy to Wix: wix deploy"
echo "  3. Or use Wix Dashboard Publish button"
echo ""
echo "If you encounter issues:"
echo "  - Check build.log for errors"
echo "  - Verify bundle size: du -sh dist/"
echo "  - Check for circular deps: npm run build 2>&1 | grep circular"
echo ""
