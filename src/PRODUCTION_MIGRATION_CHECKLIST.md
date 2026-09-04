# Production Migration Checklist

**Project:** Portfolio Base64 Image Migration  
**Date:** 2026-07-30  
**Status:** ✅ READY FOR EXECUTION

---

## Pre-Migration Verification

### ✅ Codebase Audit Complete
- [x] No `readAsDataURL()` in active code
- [x] No `data:image/` in component/API code
- [x] No `toDataURL()` for image storage
- [x] All uploads use `/api/media/upload`
- [x] CMS fields store URLs, not base64

**Evidence:** See `/src/BASE64_CODEBASE_AUDIT.md`

### ✅ Migration Tools Created
- [x] `/src/api/portfolio-scan.ts` - Identify base64 images
- [x] `/src/api/portfolio-migration.ts` - Convert to URLs
- [x] `/src/api/portfolio-update.ts` - Update CMS items
- [x] `/src/api/portfolio-verify.ts` - Verify success

### ✅ Documentation Complete
- [x] Migration guide created
- [x] Verification procedures documented
- [x] Troubleshooting guide included
- [x] Codebase audit completed

---

## Migration Execution Steps

### Step 1: Pre-Migration Backup
```bash
# Backup current Portfolio collection
# (Recommended: Use Wix backup feature in Business Manager)
```
**Status:** [ ] Complete

### Step 2: Scan for Base64 Images
```bash
curl -X GET http://localhost:3000/api/portfolio-scan
```

**Expected Output:**
```json
{
  "success": true,
  "totalItems": <number>,
  "itemsWithBase64": <number>,
  "items": [...]
}
```

**Acceptance Criteria:**
- [ ] Request succeeds (status 200)
- [ ] `itemsWithBase64` > 0 (if 0, skip to Step 5)
- [ ] All items listed with base64 fields identified

**Status:** [ ] Complete

### Step 3: Execute Migration
```bash
curl -X POST http://localhost:3000/api/portfolio-migration
```

**Expected Output:**
```json
{
  "success": true,
  "result": {
    "totalItems": <number>,
    "itemsWithBase64": <number>,
    "successfulMigrations": <number>,
    "failedMigrations": 0,
    "skippedItems": 0,
    "logs": [...]
  }
}
```

**Acceptance Criteria:**
- [ ] Request succeeds (status 200)
- [ ] `successfulMigrations` equals `itemsWithBase64`
- [ ] `failedMigrations` = 0
- [ ] All logs show "success" status
- [ ] No errors in logs

**Status:** [ ] Complete

### Step 4: Verify Migration Success
```bash
curl -X GET http://localhost:3000/api/portfolio-verify
```

**Expected Output:**
```json
{
  "success": true,
  "result": {
    "totalItems": <number>,
    "itemsWithBase64": 0,
    "itemsClean": <number>,
    "cleanPercentage": 100.0,
    "status": "success",
    "details": []
  }
}
```

**Acceptance Criteria:**
- [ ] Request succeeds (status 200)
- [ ] `itemsWithBase64` = 0
- [ ] `cleanPercentage` = 100.0
- [ ] `status` = "success"
- [ ] `details` array is empty

**Status:** [ ] Complete

### Step 5: Test Upload Flow
1. Navigate to Portfolio admin/upload page
2. Select a 20-50 MB JPEG image
3. Upload and observe:
   - [ ] Upload completes without error
   - [ ] Network tab shows POST to `/api/media/upload`
   - [ ] Response contains `mediaUrl` (not base64)
   - [ ] CMS item shows URL in image field
   - [ ] Image displays correctly on portfolio page

**Status:** [ ] Complete

### Step 6: Verify No Regressions
```bash
# Check for any remaining base64 in logs
grep -r "data:image/" src/components/ src/api/ --exclude-dir=ui

# Verify upload service still works
curl -X GET http://localhost:3000/api/portfolio-verify
```

**Acceptance Criteria:**
- [ ] No base64 found in active code
- [ ] Verification still shows 100% clean
- [ ] No errors in application logs

**Status:** [ ] Complete

---

## Post-Migration Verification

### ✅ CMS Inspection
- [ ] Open Portfolio collection in Wix Business Manager
- [ ] Spot-check 5 random items
- [ ] Verify each has URL in image fields (not base64)
- [ ] Verify images display correctly

### ✅ Performance Check
- [ ] Portfolio page loads quickly
- [ ] Images render without delay
- [ ] No console errors
- [ ] No "Document too large" errors in logs

### ✅ Functionality Test
- [ ] Portfolio detail pages load correctly
- [ ] Image galleries display properly
- [ ] Lightbox/zoom features work
- [ ] Navigation between projects works

### ✅ Error Log Review
- [ ] No "Document too large" errors
- [ ] No media upload failures
- [ ] No CMS update errors
- [ ] No base64-related warnings

---

## Rollback Plan

If migration fails or causes issues:

### Option 1: Restore from Backup
```bash
# Restore Portfolio collection from backup
# (Use Wix Business Manager backup feature)
```

### Option 2: Manual Cleanup
```bash
# If partial migration occurred:
1. Identify failed items from migration logs
2. Manually delete base64 from those items
3. Re-run migration for those items
4. Verify again
```

### Option 3: Revert Code
```bash
# If new code causes issues:
1. Revert to previous version
2. Keep migrated data (URLs are safe)
3. Investigate and fix code
4. Re-deploy
```

---

## Success Criteria

### ✅ All of the following must be true:

1. **Scan Results**
   - [ ] Initial scan identified base64 images
   - [ ] Count matches expected items

2. **Migration Results**
   - [ ] 100% of identified base64 images migrated
   - [ ] 0 failed migrations
   - [ ] All logs show success

3. **Verification Results**
   - [ ] 0 items with base64 remaining
   - [ ] 100% clean percentage
   - [ ] Status = "success"

4. **Upload Test**
   - [ ] Large file (50+ MB) uploads successfully
   - [ ] CMS item contains URL, not base64
   - [ ] Image displays correctly

5. **Codebase**
   - [ ] No base64 in active code
   - [ ] All uploads use media endpoint
   - [ ] No regressions introduced

6. **Performance**
   - [ ] No "Document too large" errors
   - [ ] Portfolio pages load quickly
   - [ ] Images render without issues

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-Migration Verification | 30 min | [ ] |
| Backup | 15 min | [ ] |
| Scan | 5 min | [ ] |
| Migration | 10-30 min | [ ] |
| Verification | 5 min | [ ] |
| Testing | 30 min | [ ] |
| Documentation | 15 min | [ ] |
| **Total** | **1-2 hours** | [ ] |

---

## Sign-Off

### Migration Coordinator
- Name: ___________________
- Date: ___________________
- Status: [ ] Approved [ ] Rejected

### Technical Lead
- Name: ___________________
- Date: ___________________
- Status: [ ] Approved [ ] Rejected

### Project Manager
- Name: ___________________
- Date: ___________________
- Status: [ ] Approved [ ] Rejected

---

## Post-Migration Monitoring

### Week 1
- [ ] Daily verification that no base64 appears
- [ ] Monitor error logs for regressions
- [ ] Test new uploads daily

### Week 2-4
- [ ] Weekly verification endpoint check
- [ ] Monitor performance metrics
- [ ] Check for any "Document too large" errors

### Ongoing
- [ ] Monthly verification
- [ ] Include in deployment checklist
- [ ] Document any issues found

---

## Appendix: Quick Reference

### Endpoints
- **Scan:** `GET /api/portfolio-scan`
- **Migrate:** `POST /api/portfolio-migration`
- **Verify:** `GET /api/portfolio-verify`
- **Update:** `POST /api/portfolio-update`

### Key Files
- Migration script: `/src/api/portfolio-migration.ts`
- Scan script: `/src/api/portfolio-scan.ts`
- Verify script: `/src/api/portfolio-verify.ts`
- Update script: `/src/api/portfolio-update.ts`
- Guide: `/src/MIGRATION_VERIFICATION_GUIDE.md`
- Audit: `/src/BASE64_CODEBASE_AUDIT.md`

### Support
- For issues: Review `/src/MIGRATION_VERIFICATION_GUIDE.md` troubleshooting section
- For questions: Check `/src/BASE64_CODEBASE_AUDIT.md` for technical details
- For monitoring: Use verification endpoint regularly

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-30  
**Status:** ✅ READY FOR PRODUCTION
