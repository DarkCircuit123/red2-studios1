# Build Diagnostic Report - 2026-08-13

## Issue Summary
The Wix Astro project has path alias resolution issues preventing successful builds.

## Root Cause Analysis

### 1. Path Alias Configuration
**File**: `tsconfig.json` (project root)
```json
"paths": {
  "@/integrations/*": ["integrations/*"],
  "@/integrations": ["integrations"]
}
```

**Issue**: The `integrations/` folder is at the **project root**, not inside `src/`. This creates ambiguity in module resolution.

### 2. Import Pattern
All files import from `@/integrations`:
```typescript
import { BaseCrudService } from '@/integrations';
import { useMember } from '@/integrations';
```

### 3. Directory Structure
```
/project-root/
├── integrations/          ← Root level
│   ├── cms/
│   ├── members/
│   └── index.ts
├── src/
│   ├── components/
│   ├── pages/
│   └── ...
└── tsconfig.json
```

## Build Errors Expected
1. **Module resolution failures** - TypeScript can't find `@/integrations`
2. **Client/Server boundary issues** - React components importing server-only modules
3. **Astro integration conflicts** - Wix extensions not properly registered

## Recommended Fixes

### Fix 1: Ensure tsconfig.json is correct
- Verify `baseUrl: "."` is set
- Verify path aliases point to correct locations
- Add `skipLibCheck: true` to ignore type errors in dependencies

### Fix 2: Move integrations into src/ (PREFERRED)
```
src/
├── integrations/
│   ├── cms/
│   ├── members/
│   └── index.ts
```
Then update tsconfig:
```json
"@/integrations/*": ["src/integrations/*"],
"@/integrations": ["src/integrations"]
```

### Fix 3: Add client directive to client-only modules
Files that use React hooks must have `'use client'` directive:
- `src/integrations/members/providers/MemberProvider.tsx`
- `src/integrations/cms/cms-ecom/cart/useCartStore.ts`

### Fix 4: Verify Astro config
- Ensure `@wix/astro` integration is properly configured
- Check that React integration is enabled for both dev and build
- Verify output mode is `"server"` for SSR

## Next Steps
1. Run `npm run build` to capture exact error messages
2. Apply minimal fixes to resolve import errors
3. Test build in both dev and production modes
4. Verify Wix extension registration
