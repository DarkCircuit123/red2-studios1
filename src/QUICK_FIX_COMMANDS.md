# Quick Fix Commands - Copy & Paste

**For Build Hanging & Publishing Issues**

---

## ONE-LINE FIX (Copy & Paste All)

```bash
rm -rf .astro dist node_modules/.vite node_modules/.cache && npm cache clean --force && npm install && NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## STEP-BY-STEP COMMANDS

### 1. Clear Caches
```bash
rm -rf .astro
rm -rf dist
rm -rf node_modules/.vite
rm -rf node_modules/.cache
npm cache clean --force
```

### 2. Reinstall
```bash
npm install
```

### 3. Build with Memory
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 4. Verify
```bash
du -sh dist/
npm run build 2>&1 | grep -i "circular"
```

### 5. Test Locally
```bash
npm run preview
```

### 6. Deploy
```bash
wix deploy
```

---

## TROUBLESHOOTING COMMANDS

### If Build Still Hangs
```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### Check Bundle Size
```bash
du -sh dist/
find dist -type f -size +1M -exec ls -lh {} \;
```

### Check for Circular Dependencies
```bash
npm run build 2>&1 | grep -i "circular"
```

### Monitor Build Process
```bash
# Mac
top -l 1 | head -20

# Linux
watch -n 1 'free -h && ps aux | grep node'
```

### Save Build Log
```bash
npm run build 2>&1 | tee build.log
```

---

## PERMANENT FIX

Update `package.json` scripts:

```json
"scripts": {
  "build": "NODE_OPTIONS=--max-old-space-size=4096 astro build",
  "dev": "astro dev",
  "preview": "astro preview"
}
```

Then just use:
```bash
npm run build
```

---

## EMERGENCY ROLLBACK

```bash
git log --oneline -10
git revert HEAD
npm run build
```

---

## EXPECTED RESULTS

✅ Build completes in < 2 minutes
✅ Bundle size < 10MB
✅ No circular dependencies
✅ Local preview works
✅ Deploy succeeds

---

## TIME ESTIMATE

- Cache clearing: 1 minute
- Reinstall: 2 minutes
- Build: 2 minutes
- Verify: 1 minute
- **Total: ~6 minutes**

---

## KEY POINTS

1. **Always clear caches first** - Don't skip this
2. **Use increased memory** - 4GB minimum, 8GB if still hanging
3. **Test locally** - Before deploying to Wix
4. **Check bundle size** - Should be < 10MB
5. **No circular deps** - Should find none

---

## WHAT TO DO IF STUCK

1. Check build.log: `npm run build 2>&1 | tee build.log`
2. Check memory: `top` or `free -h`
3. Check bundle: `du -sh dist/`
4. Increase memory: `NODE_OPTIONS="--max-old-space-size=8192" npm run build`
5. Rollback if needed: `git revert HEAD`

---

## NOTES

- **No publish button needed** - AdminPanel is content management only
- **Content saves immediately** - No publish step for CMS changes
- **Code deployment separate** - Use wix deploy or Wix dashboard
- **Build should be fast** - If > 5 minutes, something is wrong

---

## SUPPORT

If issues persist:
- Save build.log: `npm run build 2>&1 | tee build.log`
- Check bundle: `du -sh dist/`
- Check deps: `npm run build 2>&1 | grep circular`
- Contact Wix support with logs
