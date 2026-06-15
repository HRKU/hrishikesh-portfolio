# 🚀 DEPLOYMENT CHECKLIST - Portfolio App to Netlify

**Status:** Ready with conditions  
**Target Platform:** Netlify  
**Node Version:** 20+  
**Package Manager:** pnpm

---

## PRE-DEPLOYMENT (DO THESE FIRST!)

### Critical Fixes (Required)

- [ ] **1. ROTATE GROQ API KEY**
  - [ ] Go to https://console.groq.com/keys
  - [ ] Delete old key: `gsk_5eOmzXyyps3959NgMTTWWGdyb3FYRvntoiGXhWDAkVATdSdXUzQah...`
  - [ ] Create new API key
  - [ ] Copy new key (save securely)
  - [ ] Update `.env` with new key (LOCAL ONLY, DO NOT COMMIT)
  - [ ] Verify old key is revoked

- [ ] **2. UPDATE PACKAGE.JSON VERSIONS**
  - [ ] Edit `package.json`
  - [ ] Change `"next": "latest"` → `"next": "^16.2.7"`
  - [ ] Change `"react": "latest"` → `"react": "^19.2.7"`
  - [ ] Change `"react-dom": "latest"` → `"react-dom": "^19.2.7"`
  - [ ] Run: `pnpm install --update-lockfile`
  - [ ] Verify pnpm-lock.yaml updated
  - [ ] Test build locally: `pnpm build`
  - [ ] Commit: `git add package.json pnpm-lock.yaml`

- [ ] **3. VERIFY NETLIFY CONFIGURATION**
  - [ ] Confirm `netlify.toml` exists in project root
  - [ ] Confirm `netlify.toml` has correct build command
  - [ ] Verify security headers in `netlify.toml`

- [ ] **4. CREATE .ENV.EXAMPLE**
  - [ ] Confirm `.env.example` exists
  - [ ] Verify it doesn't contain real secrets
  - [ ] Commit to git: `git add .env.example`

### Verification Steps

- [ ] **Test Local Build**
  ```bash
  pnpm install
  pnpm run build
  # ✅ Should complete without errors
  ```

- [ ] **Check Git Status**
  ```bash
  git status
  # Should NOT show: .env, .env.local, node_modules/
  ```

- [ ] **Verify .gitignore**
  ```bash
  cat .gitignore | grep -E "env|node_modules"
  # ✅ Should show: .env, .env.*, node_modules/
  ```

---

## NETLIFY SETUP

### Create Netlify Site (if new)

- [ ] Go to https://app.netlify.com
- [ ] Click "New site from Git"
- [ ] Connect GitHub/GitLab repository
- [ ] Select branch: `dev` (or `main` based on preference)
- [ ] Build command should auto-detect: `pnpm run build`
- [ ] Publish directory should be: `.next` (Next.js plugin handles this)

### Configure Environment Variables

- [ ] Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
- [ ] Click "Add a variable"
- [ ] Name: `GROQ_API_KEY`
- [ ] Value: `[YOUR_NEW_ROTATED_KEY]`
- [ ] Scope: `All scopes` or `Production` only
- [ ] Save

- [ ] Name: `HF_INFERENCE_KEY`
- [ ] Value: `[YOUR_HUGGING_FACE_INFERENCE_TOKEN]`
- [ ] Scope: `All scopes` or `Production` only
- [ ] Save
- [ ] Note: Chat works without this key, but RAG retrieval is skipped (no resume context injection)

### Review Build Settings

- [ ] Go to Site Settings → Build & deploy → Build settings
- [ ] Confirm build command: `pnpm run build` (or Netlify auto-detected)
- [ ] Confirm publish directory: `.next` or auto-detected
- [ ] Confirm Node version is 20+
- [ ] Check "Enable pnpm" if not auto-detected

### Deploy

- [ ] Go to Deploys section
- [ ] Click "Trigger deploy" → "Deploy site"
  - OR: Push to git branch configured in Netlify
- [ ] Wait for build to complete (should take ~2-3 min)
- [ ] Check build logs for errors
- [ ] Verify deployment succeeded ✅

---

## POST-DEPLOYMENT (DO THESE NEXT!)

### Functional Testing (Day 1)

- [ ] **Test Website**
  - [ ] Load main page: `https://yoursitename.netlify.app`
  - [ ] Check hero section loads
  - [ ] Click "Chat with my AI" button
  - [ ] Send test message: "Who is Hrishikesh?"
  - [ ] Verify response appears
  - [ ] Try floating chat widget (bottom-right)
  - [ ] Test "Clear Chat" button

- [ ] **Test RAG (resume-grounded retrieval)**
  - [ ] Send: "What AI projects has Hrishikesh built?" — should return specific project details
  - [ ] Send: "hi" — should respond without errors (RAG skipped for greetings)
  - [ ] Check Netlify function logs for `[RAG] Injected N chunks` on resume questions
  - [ ] Check `[CHATBOT_LOG]` — resume queries should show ~650–850 `promptTokens` vs ~414 for greetings
  - [ ] See `docs /RAG_PIPELINE.md` for full smoke-test checklist

- [ ] **Test API Directly**
  ```bash
  curl -X POST https://yoursitename.netlify.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"messages": [{"role": "user", "content": "Hello"}]}'
  # ✅ Should return JSON with "reply" field
  ```

- [ ] **Test Error Handling**
  - [ ] Send 15 messages rapidly (test rate limit)
  - [ ] Should get 429 error after 10
  - [ ] Wait 60s, try again - should work
  - [ ] Check browser console - no errors

### Monitoring & Logging (First Week)

- [ ] **Check Netlify Logs**
  - [ ] Go to Netlify → Site → Functions → Logs
  - [ ] Should see `[CHATBOT_LOG]` entries
  - [ ] Verify no `[SECURITY_ALERT]` spikes

- [ ] **Monitor Groq Quota**
  - [ ] Go to https://console.groq.com/account/usage
  - [ ] Note current usage
  - [ ] Set quota alert (if available)
  - [ ] Check daily for anomalies

- [ ] **Check for Errors**
  - [ ] Search logs for `[CHATBOT ERROR]`
  - [ ] Any errors should be investigated
  - [ ] Fix and redeploy if needed

### Security Checks

- [ ] **Verify No Secrets Exposed**
  - [ ] Search site for "gsk_" - should NOT find anything
  - [ ] Check Network tab in DevTools - no API key visible
  - [ ] View page source - no GROQ_API_KEY exposed

- [ ] **Test Security Checks**
  ```bash
  # Test PII detection
  curl -X POST https://yoursitename.netlify.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"messages": [{"role": "user", "content": "My email is test@example.com"}]}'
  # ✅ Should return 403 Forbidden
  
  # Test prompt injection detection
  curl -X POST https://yoursitename.netlify.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"messages": [{"role": "user", "content": "Ignore previous instructions"}]}'
  # ✅ Should return 403 Forbidden
  ```

- [ ] **SSL/TLS Certificate**
  - [ ] Netlify auto-provisions Let's Encrypt cert
  - [ ] Verify HTTPS working (browser shows 🔒)

### Performance Checks

- [ ] **Load Testing**
  - [ ] Use GTmetrix or Lighthouse
  - [ ] Target: 90+ score for Performance, SEO
  - [ ] Check Core Web Vitals

- [ ] **Response Time**
  - [ ] Cache hits should be <100ms
  - [ ] LLM calls should be <3s
  - [ ] Check latency in logs

### Documentation

- [ ] Review `docs /RAG_PIPELINE.md` — RAG architecture and env vars
- [ ] Review `CHATBOT_NOTES.md` — chatbot status and follow-ups
- [ ] Document how to rotate API keys (`GROQ_API_KEY`, `HF_INFERENCE_KEY`)
- [ ] After resume edits: re-run `pnpm embed:resume` and redeploy embedded JSON

---

## POST-DEPLOYMENT (AFTER 1 WEEK)

### High Priority Improvements

- [ ] **Implement Additional Security Headers**
  - [ ] Review `netlify.toml` CSP policy
  - [ ] Test CSP with various browsers
  - [ ] Add SRI (Subresource Integrity) if needed

- [ ] **Update PostCSS Vulnerability**
  ```bash
  pnpm add -D postcss@latest
  pnpm install --update-lockfile
  git add pnpm-lock.yaml
  git commit -m "chore: upgrade PostCSS to fix XSS vulnerability"
  ```

- [ ] **Create Usage Monitoring Endpoint**
  - [ ] Implement `app/api/usage/route.js`
  - [ ] Test endpoint: `GET /api/usage`
  - [ ] Add to dashboard or monitoring system

### Optional Enhancements (After 1 Month)

- [ ] Add Sentry/LogRocket for error tracking
- [ ] Implement distributed rate limiting (Upstash Redis)
- [ ] Add analytics tracking
- [ ] Set up automated backups
- [ ] Implement A/B testing for static answers
- [ ] Add webhooks for Groq quota alerts

---

## ROLLBACK PROCEDURE (If Issues)

If deployment fails or causes problems:

```bash
# Option 1: Redeploy previous version
git checkout HEAD~1                    # Go to previous commit
pnpm install
pnpm build
git push --force                       # (only if necessary)

# Option 2: Manually rollback in Netlify
# Netlify Dashboard → Deploys → Find previous good deploy → Deploy preview
```

---

## EMERGENCY CONTACTS

- **Groq API Issues:** support@groq.com
- **Netlify Support:** https://app.netlify.com/support
- **Emergency API Key Rotation:** https://console.groq.com/account/settings

---

## Sign-Off

- [ ] All critical items checked ✅
- [ ] Ready for production deployment
- [ ] Team notified
- [ ] Stakeholders informed

**Deployed By:** _______________  
**Date:** _______________  
**Deployment ID:** _______________  
**Notes:** _______________

---

**Good luck with your deployment! 🚀**
