# Publishing @bklit/sdk to npm

## 📋 Pre-Publish Checklist

- [x] Version bumped to 1.0.0 (breaking change)
- [x] CHANGELOG.md created with v1.0.0 notes
- [x] README.md updated for WebSocket
- [x] Keywords updated (added "websocket", "real-time")
- [x] Build successful with types (`.d.ts` files)
- [x] Package size verified (7.8 KB)
- [ ] npm login completed
- [ ] Test package locally
- [ ] Publish to npm
- [ ] Create GitHub release tag
- [ ] Verify on npm registry

---

## 🔑 Step 1: Login to npm

```bash
npm login
```

Follow the prompts to authenticate.

Verify:
```bash
npm whoami
```

---

## 🧪 Step 2: Test Package Locally

Before publishing, test the package:

```bash
cd packages/sdk

# Dry run (shows what will be published)
npm pack --dry-run

# Create actual tarball for testing
npm pack

# Install in test project
cd /tmp/test-project
npm install /path/to/bklit-sdk-1.0.0.tgz
```

Test the imports:

```javascript
import { initBklit, trackPageView, trackEvent } from '@bklit/sdk';
import { BklitComponent } from '@bklit/sdk/nextjs';

// Should have TypeScript types available
```

---

## 🚀 Step 3: Publish to npm

**Publish to npm registry:**

```bash
cd packages/sdk

# Build one more time to be safe
pnpm build

# Publish (will run prepublishOnly hook automatically)
npm publish --access public
```

**Expected output:**
```
+ @bklit/sdk@1.0.0
```

---

## 🏷️ Step 4: Create GitHub Release

After npm publish succeeds:

```bash
# Tag the release
git tag -a sdk-v1.0.0 -m "SDK v1.0.0 - WebSocket Architecture"
git push origin sdk-v1.0.0
```

**Then on GitHub:**
1. Go to https://github.com/bklit/bklit/releases
2. Click "Draft a new release"
3. Choose tag: `sdk-v1.0.0`
4. Title: `@bklit/sdk v1.0.0 - WebSocket Architecture`
5. Copy release notes from CHANGELOG.md
6. Mark as "Latest release"
7. Publish

---

## ✅ Step 5: Verify Publication

**Check on npm:**
```bash
npm view @bklit/sdk
```

Should show version 1.0.0

**Test installation:**
```bash
npm install @bklit/sdk
```

**Check npm page:**
https://www.npmjs.com/package/@bklit/sdk

---

## 📊 Post-Publish

### Update Documentation

Update docs to reference v1.0.0:

```bash
# Update installation commands
npm install @bklit/sdk@latest

# Update migration guides
# Point users to CHANGELOG for upgrade path
```

### Announce

- [ ] Tweet about v1.0.0 release
- [ ] Update README badge (if any)
- [ ] Discord announcement
- [ ] Product Hunt update (if applicable)

---

## 🔄 Future Releases

**Patch releases** (1.0.x) - Bug fixes:
```bash
npm version patch
npm publish
```

**Minor releases** (1.x.0) - New features:
```bash
npm version minor
npm publish
```

**Major releases** (x.0.0) - Breaking changes:
```bash
npm version major
npm publish
```

---

## ⚠️ Important Notes

1. **Cannot unpublish** after 24 hours - test thoroughly first!
2. **Version immutable** - Can't republish same version
3. **Public package** - Anyone can install and view source
4. **Breaking changes** - Always major version bump

---

## 🎉 Ready to Publish

Your package is ready! Just need to:

1. `npm login`
2. `npm publish --access public`
3. Create GitHub release
4. Celebrate! 🎊

