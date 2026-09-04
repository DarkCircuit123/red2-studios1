# CMS CLEANUP ACTION CHECKLIST

**Audit Date:** 2026-08-10  
**Status:** READY FOR PHASE 1 VERIFICATION  
**Confidence Level:** 95%+

---

## PHASE 1: VERIFICATION (IMMEDIATE - THIS WEEK)

### ✅ Task 1.1: Verify portfolioimagebackups Collection
- **Collection ID:** `portfolioimagebackups`
- **Current Status:** Listed in cleanup operations but not actively used
- **Verification Steps:**
  - [ ] Access Wix CMS dashboard
  - [ ] Navigate to "Portfolio Image Backups" collection
  - [ ] Check total item count
  - [ ] Review sample items (if any exist)
  - [ ] Check last modified date
  - [ ] Verify no active code references (already confirmed)
  
**Decision Criteria:**
- If **empty (0 items):** → Archive (move to Phase 2)
- If **contains data:** → Check backup dates and retention policy
  - If **older than 6 months:** → Archive
  - If **recent:** → Keep for now, document retention policy

**Owner:** Admin  
**Deadline:** 2026-08-12  
**Status:** ⏳ PENDING

---

### ✅ Task 1.2: Verify watermarksettings Collection
- **Collection ID:** `watermarksettings`
- **Current Status:** Only referenced in image validation, never applied in rendering
- **Verification Steps:**
  - [ ] Access Wix CMS dashboard
  - [ ] Navigate to "Watermark Settings" collection
  - [ ] Check total item count
  - [ ] Review sample items (if any exist)
  - [ ] Search codebase for "watermark" in rendering/display code
  - [ ] Verify watermarks are NOT applied to any images
  - [ ] Check if feature is mentioned in admin UI
  
**Decision Criteria:**
- If **empty (0 items):** → Archive (move to Phase 2)
- If **contains data but not used:** → Archive
- If **contains data AND used:** → Keep and document usage

**Owner:** Admin  
**Deadline:** 2026-08-12  
**Status:** ⏳ PENDING

---

### ✅ Task 1.3: Investigate passwordchangetokens Collection
- **Collection ID:** `passwordchangetokens`
- **Current Status:** No active code usage detected (possible duplicate)
- **Verification Steps:**
  - [ ] Access Wix CMS dashboard
  - [ ] Compare schema: `passwordchangetokens` vs `passwordchangeauthorizations`
  - [ ] Check total item count in both collections
  - [ ] Review field definitions in both
  - [ ] Verify if truly separate or duplicate
  - [ ] Check git history for when this was created
  - [ ] Verify no code references to this collection
  
**Decision Criteria:**
- If **identical schema to passwordchangeauthorizations:** → Likely duplicate
  - [ ] Migrate any data from passwordchangetokens to passwordchangeauthorizations
  - [ ] Archive passwordchangetokens
- If **different schema:** → Document purpose and keep
- If **empty:** → Archive

**Owner:** Admin + Developer  
**Deadline:** 2026-08-13  
**Status:** ⏳ PENDING

---

### ✅ Task 1.4: Verify dataexportaudit Collection
- **Collection ID:** `dataexportaudit`
- **Current Status:** Listed in cleanup operations but not actively used
- **Verification Steps:**
  - [ ] Access Wix CMS dashboard
  - [ ] Navigate to "Data Export Audit" collection
  - [ ] Check total item count
  - [ ] Review sample items (if any exist)
  - [ ] Check last modified date
  - [ ] Verify no active code references (already confirmed)
  - [ ] Check if data export feature is actually used
  
**Decision Criteria:**
- If **empty (0 items):** → Archive (move to Phase 2)
- If **contains data:** → Check dates and retention requirements
  - If **older than 1 year:** → Archive
  - If **recent:** → Keep for compliance

**Owner:** Admin  
**Deadline:** 2026-08-12  
**Status:** ⏳ PENDING

---

## PHASE 2: DOCUMENTATION (WEEK 1)

### ✅ Task 2.1: Document Verification Results
- [ ] Create verification report for each collection
- [ ] Document findings from Phase 1
- [ ] Get admin approval for each decision
- [ ] Create archive plan for confirmed unused collections

**Owner:** Admin  
**Deadline:** 2026-08-17  
**Status:** ⏳ PENDING

---

### ✅ Task 2.2: Create Archive Plan
- [ ] For each collection to archive:
  - [ ] Export data as backup (JSON/CSV)
  - [ ] Store backup in secure location
  - [ ] Document backup location and date
  - [ ] Create archive collection (if needed)
  - [ ] Document archival reason and date

**Owner:** Admin  
**Deadline:** 2026-08-17  
**Status:** ⏳ PENDING

---

### ✅ Task 2.3: Update Project Documentation
- [ ] Update this checklist with verification results
- [ ] Update CMS_DEPENDENCY_AUDIT_REPORT.md with findings
- [ ] Update DEPENDENCY_MAP.md with final status
- [ ] Create archive log

**Owner:** Developer  
**Deadline:** 2026-08-17  
**Status:** ⏳ PENDING

---

## PHASE 3: ARCHIVAL (WEEK 2+)

### ✅ Task 3.1: Archive Confirmed Unused Collections
- **Only proceed if Phase 1 verification confirms unused status**

For each collection to archive:
- [ ] Verify backup exists
- [ ] Create archive collection (name: `archive_[original_name]`)
- [ ] Copy data to archive collection (if any)
- [ ] Disable original collection (if possible)
- [ ] Document archival in project
- [ ] Monitor for any errors

**Collections Eligible for Archival (if verified unused):**
1. portfolioimagebackups
2. watermarksettings
3. dataexportaudit
4. passwordchangetokens (if duplicate)

**Owner:** Admin  
**Deadline:** 2026-08-24  
**Status:** ⏳ PENDING

---

### ✅ Task 3.2: Verify No Errors After Archival
- [ ] Run full test suite
- [ ] Check for any broken references
- [ ] Monitor application for errors
- [ ] Verify all pages load correctly
- [ ] Check admin panel functionality

**Owner:** Developer  
**Deadline:** 2026-08-24  
**Status:** ⏳ PENDING

---

## PHASE 4: MONITORING (ONGOING)

### ✅ Task 4.1: Monitor Archived Collections
- [ ] Set up monitoring for archived collections
- [ ] Check weekly for any new usage
- [ ] Log any access attempts
- [ ] Document findings

**Frequency:** Weekly  
**Owner:** Admin  
**Status:** ⏳ PENDING

---

### ✅ Task 4.2: Quarterly Review
- [ ] Review collection usage patterns
- [ ] Check for any new unused collections
- [ ] Update dependency map
- [ ] Update audit report

**Frequency:** Quarterly (every 3 months)  
**Owner:** Admin + Developer  
**Next Review:** 2026-11-10  
**Status:** ⏳ PENDING

---

## CRITICAL COLLECTIONS - DO NOT TOUCH

These collections are production-critical and must NEVER be archived or deleted:

```
🔴 CRITICAL - NEVER ARCHIVE
├── portfolio
├── portfolioimages
├── blogposts
├── services
├── reels
├── clientgalleries
├── galleryphotos
├── behindthescenes
├── homepagesettings
├── musicsettings
├── splashpage
└── homepageimages

🟡 SECURITY - NEVER ARCHIVE
├── apiratelimits
├── passwordchangeauthorizations
├── passwordchangelog
├── pinaccesslog
└── admincredentials

🟢 SUPPORT - KEEP UNLESS VERIFIED UNUSED
├── about
├── clientspress
├── teamm
├── storiesinsights
├── tickerstories
├── bookingavailability
├── bookings
└── contactsubmissions
```

---

## VERIFICATION CHECKLIST TEMPLATE

Use this template for each collection being verified:

```
COLLECTION: [name]
ID: [collection-id]
DATE: [verification-date]

VERIFICATION RESULTS:
- [ ] Item count: _____ items
- [ ] Last modified: _____
- [ ] Active code references: YES / NO
- [ ] Used in components: YES / NO
- [ ] Used in API endpoints: YES / NO
- [ ] Used in pages: YES / NO

FINDINGS:
[Detailed findings here]

DECISION:
[ ] KEEP - Active usage confirmed
[ ] KEEP - Security/compliance required
[ ] ARCHIVE - Unused, no active references
[ ] INVESTIGATE FURTHER - Unclear usage

APPROVAL:
- Admin: _____ (signature/date)
- Developer: _____ (signature/date)

NEXT STEPS:
[Action items here]
```

---

## RISK ASSESSMENT

### High Risk Actions (AVOID)
- ❌ Deleting collections without backup
- ❌ Deleting collections without 30-day review period
- ❌ Deleting security/audit collections
- ❌ Deleting collections with active code references
- ❌ Deleting without admin approval

### Low Risk Actions (SAFE)
- ✅ Archiving unused collections (with backup)
- ✅ Disabling collections (if platform supports)
- ✅ Monitoring archived collections
- ✅ Documenting findings
- ✅ Creating backup exports

### Recommended Approach
1. **NEVER DELETE** - Always archive instead
2. **ALWAYS BACKUP** - Export data before any action
3. **ALWAYS VERIFY** - Confirm unused status before archival
4. **ALWAYS MONITOR** - Watch for any new usage after archival
5. **ALWAYS DOCUMENT** - Keep detailed records of all actions

---

## ROLLBACK PLAN

If any issues occur after archival:

1. **Immediate Actions:**
   - [ ] Stop all archival operations
   - [ ] Restore from backup
   - [ ] Verify application functionality
   - [ ] Document issue

2. **Investigation:**
   - [ ] Identify what went wrong
   - [ ] Check error logs
   - [ ] Review dependencies
   - [ ] Update documentation

3. **Prevention:**
   - [ ] Add monitoring for this collection
   - [ ] Update dependency map
   - [ ] Document issue for future reference

---

## APPROVAL WORKFLOW

### Phase 1 Approval (Verification)
- [ ] Admin reviews verification results
- [ ] Developer confirms no code references
- [ ] Both approve decision

### Phase 2 Approval (Documentation)
- [ ] Admin approves archive plan
- [ ] Developer approves documentation updates
- [ ] Both sign off on Phase 2

### Phase 3 Approval (Archival)
- [ ] Admin approves archival execution
- [ ] Developer confirms backup exists
- [ ] Both approve before proceeding

### Phase 4 Approval (Monitoring)
- [ ] Admin confirms monitoring is active
- [ ] Developer confirms no errors
- [ ] Both approve completion

---

## COMMUNICATION PLAN

### Stakeholders to Notify
- [ ] Admin team
- [ ] Development team
- [ ] Project manager
- [ ] Client (if applicable)

### Communication Timeline
- **Before Phase 1:** Notify all stakeholders of audit
- **After Phase 1:** Share verification results
- **Before Phase 3:** Notify of archival plan
- **After Phase 3:** Confirm completion and monitoring

---

## SUCCESS CRITERIA

### Phase 1 Success
- [ ] All 4 collections verified
- [ ] Clear decision made for each
- [ ] No errors or issues found
- [ ] Admin approval obtained

### Phase 2 Success
- [ ] All findings documented
- [ ] Archive plan created
- [ ] All approvals obtained
- [ ] Documentation updated

### Phase 3 Success
- [ ] All archival completed
- [ ] No errors or broken references
- [ ] Backups verified
- [ ] Monitoring active

### Phase 4 Success
- [ ] Monitoring active and working
- [ ] No new issues found
- [ ] Quarterly reviews scheduled
- [ ] Documentation maintained

---

## TIMELINE SUMMARY

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 1: Verification | 3-5 days | 2026-08-10 | 2026-08-13 | ⏳ PENDING |
| Phase 2: Documentation | 5-7 days | 2026-08-14 | 2026-08-17 | ⏳ PENDING |
| Phase 3: Archival | 5-7 days | 2026-08-18 | 2026-08-24 | ⏳ PENDING |
| Phase 4: Monitoring | Ongoing | 2026-08-25 | Ongoing | ⏳ PENDING |

---

## CONTACT & ESCALATION

### Primary Contacts
- **Admin Lead:** [Name/Contact]
- **Developer Lead:** [Name/Contact]
- **Project Manager:** [Name/Contact]

### Escalation Path
1. Report issue to primary contact
2. If unresolved in 24 hours → escalate to manager
3. If unresolved in 48 hours → escalate to director

---

## FINAL NOTES

### Important Reminders
1. **This is a SAFE audit** - No collections are being deleted
2. **All actions are reversible** - Backups will be maintained
3. **Verification is key** - Never skip Phase 1
4. **Documentation is critical** - Keep detailed records
5. **Monitoring is ongoing** - Watch for issues after archival

### Key Principles
- ✅ **Safety First** - Never delete without backup
- ✅ **Verification Required** - Always confirm unused status
- ✅ **Approval Needed** - Get sign-off before each phase
- ✅ **Documentation Essential** - Keep detailed records
- ✅ **Monitoring Active** - Watch for issues after changes

---

## SIGN-OFF

**Audit Completed By:** [Name]  
**Date:** 2026-08-10  
**Status:** ✅ READY FOR PHASE 1

**Approved By:**
- [ ] Admin: _____ (signature/date)
- [ ] Developer: _____ (signature/date)
- [ ] Project Manager: _____ (signature/date)

---

*This checklist is a living document. Update it as you progress through each phase.*  
*Keep all verification results and approvals for compliance and audit purposes.*

---

**Next Step:** Begin Phase 1 Verification (Task 1.1 - 1.4)
