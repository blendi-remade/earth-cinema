# Security of API Key Storage in Chrome Extensions

## How Earth Cinema Protects Your API Key

### ✅ What We Do (Secure)

**1. Chrome's Encrypted Storage (`chrome.storage.local`)**
- Your API key is stored using Chrome's built-in storage API
- Chrome automatically encrypts this data at rest on your disk
- Only accessible by the extension itself
- Isolated from websites and other extensions
- Encrypted with your OS user account credentials

**2. No Network Transmission (Except to fal.ai)**
- The key NEVER leaves your computer except when making API calls
- Only sent to `fal.run` and `fal.ai` domains (the legitimate API)
- Always transmitted over HTTPS (encrypted in transit)
- Never logged to console or error messages
- Never sent to analytics or tracking services

**3. Extension Sandboxing**
- Chrome extensions run in isolated contexts
- Websites cannot access extension storage
- Content scripts (running on google.earth.com) cannot access storage
- Only the extension's popup and service worker can read the key

**4. Code Transparency**
- All code is open source and reviewable
- No obfuscation or hidden behavior
- Chrome Web Store review process validates the code

### 🔒 Attack Scenarios & Protection

#### ❌ Attacker on Website Cannot Access Key
**Scenario:** You visit a malicious website that tries to steal your key

**Protection:**
- Websites have ZERO access to `chrome.storage.local`
- Cross-origin isolation prevents websites from reading extension data
- Content scripts don't have access to the API key
- Even if a website exploits a browser bug, the storage is encrypted

#### ❌ Physical Access to Computer
**Scenario:** Someone has access to your computer files

**Protection:**
- Storage is encrypted at the OS level
- Requires your user account to decrypt
- Can't just copy files and read them elsewhere
- If someone has your user account access, they have bigger problems (they can access everything)

#### ❌ Malicious Browser Extension
**Scenario:** Another extension tries to read your data

**Protection:**
- Extensions are isolated from each other
- One extension cannot access another's storage
- Chrome's permission system prevents cross-extension access

#### ❌ Network Interception (MITM Attack)
**Scenario:** Attacker on your network tries to steal key in transit

**Protection:**
- All API calls use HTTPS (TLS encryption)
- Certificate pinning by the browser
- Key is encrypted during transmission
- Attacker would only see encrypted traffic

#### ✅ Code Injection / XSS in Extension
**Scenario:** Vulnerability in the extension allows code injection

**Protection Level:** Limited
- If attacker can execute code in the extension context, they could access storage
- This is why we:
  - Use no external dependencies (no supply chain attacks)
  - Don't use `eval()` or `innerHTML` with user data
  - Follow strict Content Security Policy
  - Have code reviews before updates

### 🆚 Comparison to Other Methods

| Storage Method | Security Level | Our Choice |
|----------------|----------------|------------|
| Plain text file | ❌ Very insecure | No |
| config.json in extension | ⚠️ Unencrypted | No (removed) |
| `chrome.storage.local` | ✅ Encrypted | **Yes** |
| `chrome.storage.sync` | ✅ Encrypted + synced | Could use this |
| Server-side storage | ⚠️ Depends on server | No (adds complexity) |
| Browser password manager | ✅ Most secure | Not available for extensions |

### 🔐 Additional Security Measures

**What We Do:**
1. **No Logging:** API keys never appear in console.log statements
2. **Input Validation:** Key format is validated before use
3. **Test Connection:** Users can verify key works without committing it
4. **Clear Visibility:** Users see when key is configured
5. **Easy Removal:** Users can delete key anytime via "Start Over"

**What You Should Do:**
1. **Never share your API key:** It's like a password
2. **Use fal.ai's free tier first:** Test before adding payment info
3. **Monitor usage:** Check fal.ai dashboard for unexpected API calls
4. **Rotate keys if compromised:** Generate new key at fal.ai dashboard
5. **Use browser profiles:** Separate work/personal browsing

### ⚠️ What This Doesn't Protect Against

**Local Malware:**
- If your computer has malware/keylogger, it could capture keystrokes
- Malware with system-level access could read Chrome's encrypted storage
- **Solution:** Keep antivirus updated, don't install suspicious software

**Browser Vulnerabilities:**
- Theoretical zero-day exploits in Chrome could bypass isolation
- Extremely rare and quickly patched
- **Solution:** Keep Chrome updated

**Physical Access + Your Login:**
- If someone logs into your OS account, they can access Chrome storage
- **Solution:** Use strong passwords, lock your computer, enable disk encryption

### 🎯 Why This Is Industry Standard

**Major Services Using Similar Approach:**
- LastPass, 1Password (password managers)
- MetaMask, Coinbase (crypto wallets)
- GitHub, AWS (developer tools)
- Grammarly, Honey (popular extensions)

All use `chrome.storage.local` for sensitive tokens because:
1. It's the most secure option available to extensions
2. Chrome maintains the encryption layer
3. Audited and trusted by millions of users
4. No server-side complexity or breach risk

### 📊 Risk Assessment

**Overall Risk Level: LOW** ✅

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Malicious website | High | None | Sandboxing prevents access |
| Network interception | Medium | None | HTTPS encryption |
| Extension vulnerability | Low | Medium | Code review, CSP, no deps |
| Malware on system | Low | High | User responsibility, OS security |
| Chrome zero-day | Very Low | Medium | Chrome auto-updates |

### 🔄 Key Rotation Best Practice

If you're ever concerned:
1. Go to [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
2. Delete old key
3. Generate new key
4. Update in extension

This invalidates the old key immediately.

### 📚 Further Reading

- [Chrome Extension Security Best Practices](https://developer.chrome.com/docs/extensions/mv3/security/)
- [chrome.storage API Documentation](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Content Security Policy for Extensions](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)

---

## Summary

**Is it secure?** Yes, as secure as password managers and crypto wallets.

**Can websites steal it?** No, impossible due to browser sandboxing.

**Can other extensions steal it?** No, extensions are isolated.

**Can someone on my network steal it?** No, transmitted over HTTPS.

**What's the main risk?** Malware on your computer (affects everything, not just this extension).

**Bottom line:** This is the industry-standard secure approach for Chrome extensions. Your API key is as safe as anything else stored in Chrome.

