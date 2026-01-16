# Chrome Web Store Submission Checklist

## ✅ Phase 1: Code Preparation (COMPLETED)

- [x] Remove config.json support from production code
- [x] Add API key test connection button
- [x] Add timeout handling (90s for image, 8min for video)
- [x] Audit console.log statements (no sensitive data logged)
- [x] Write privacy policy (PRIVACY.md)
- [x] Add better error messages for common failures
- [x] Update README for end users
- [x] Update manifest.json with homepage_url

## 🔲 Phase 2: Required Assets

### Screenshots (REQUIRED)
- [ ] Capture 3-5 screenshots (1280x800 or 640x400)
  - [ ] Extension popup with API key section
  - [ ] Captured Google Earth view
  - [ ] Transformed image result
  - [ ] Video generation in progress
  - [ ] Final video result

### Promotional Images (Recommended)
- [ ] Small promo tile: 440x280 pixels
- [ ] (Optional) Marquee: 1400x560 pixels for featured placement

### Store Listing Content
- [ ] Write detailed description (see draft below)
- [ ] Short description (132 chars max): "Transform Google Earth views into cinematic AI-generated images and videos"
- [ ] Choose category: **Productivity**
- [ ] Add tags/keywords: AI, Google Earth, Video Generation, Image Editing, Drone Shots

## 🔲 Phase 3: Legal & Contact

- [ ] Add support email in Developer Dashboard
- [ ] Host privacy policy (can use GitHub Pages or add to README)
- [ ] Update manifest.json homepage_url with actual GitHub URL
- [ ] Update PRIVACY.md with support email

## 🔲 Phase 4: Testing Checklist

### Fresh Install Flow
- [ ] Test extension installation from scratch
- [ ] Verify API key prompt appears on first use
- [ ] Test "Test Connection" button with valid key
- [ ] Test "Test Connection" button with invalid key
- [ ] Verify API key is saved correctly

### Core Functionality
- [ ] Capture Google Earth view
- [ ] Transform image (1K, 2K, 4K resolutions)
- [ ] Generate video (4s, 6s, 8s durations)
- [ ] Test with/without audio generation
- [ ] Download image
- [ ] Download video
- [ ] Open in fullscreen (image and video)

### Error Scenarios
- [ ] Invalid API key error handling
- [ ] Network disconnection during operation
- [ ] Rate limit (429) error handling
- [ ] Transform timeout (90s)
- [ ] Video timeout (8min)
- [ ] Image too large (413) error

### Edge Cases
- [ ] Close popup during operation (state persists)
- [ ] Refresh extension page (state persists)
- [ ] Multiple transform operations in sequence
- [ ] Navigate away from Google Earth

### Browser Compatibility
- [ ] Test on Chrome (latest stable)
- [ ] Test on Chrome (one version back)
- [ ] Test on Edge (Chromium)

## 📝 Store Listing Draft

### Name
Earth Cinema

### Short Description (132 chars max)
Transform Google Earth views into cinematic AI-generated images and videos

### Detailed Description

```
Earth Cinema transforms your Google Earth 3D views into stunning cinematic images and videos using AI. Capture any location, apply artistic transformations, and generate professional drone-shot videos—all without leaving Google Earth.

✨ FEATURES

• One-click capture of Google Earth 3D views
• AI-powered image transformation with Nano Banana Pro
• Generate cinematic videos with customizable duration (4s, 6s, 8s)
• Optional audio generation for videos
• Multiple resolution options (1K, 2K, 4K)
• Download transformed images and videos
• Fullscreen preview mode

🚀 HOW TO USE

1. Navigate to earth.google.com and find any scenic location
2. Click the Earth Cinema extension icon
3. Enter your fal.ai API key (one-time setup)
4. Capture your view and describe your desired transformation
5. Generate a cinematic video from your transformed image

🔑 API KEY REQUIRED

This extension requires a fal.ai API key. Get started with a free tier at:
https://fal.ai/dashboard/keys

The extension uses two powerful AI models:
• Nano Banana Pro for image transformation
• Veo 3.1 Fast for video generation

💰 PRICING

Earth Cinema is completely free. You only pay for API usage directly to fal.ai based on your usage. Check fal.ai's pricing at: https://fal.ai/pricing

🔒 PRIVACY

Your API key is stored securely in your browser. No data is collected or sent to third parties except fal.ai for processing. See our privacy policy for details.

🎥 PERFECT FOR

• Content creators making YouTube videos
• Social media creators
• Educators and students
• Travel enthusiasts
• Anyone who loves Google Earth

📧 SUPPORT

Questions or issues? Contact us at [your-email] or open an issue on GitHub:
https://github.com/[your-username]/earth-cinema

Built with ❤️ by fal.ai
```

### Category
Productivity (primary)
Photography (secondary, if allowed)

### Language
English

### Privacy Practices

**Data Usage:**
- API keys (stored locally, encrypted by Chrome)
- Screenshots (sent to fal.ai for processing)

**Data Handling:**
- Data is not sold to third parties
- Data is not used for purposes unrelated to the extension's core functionality
- Data is not used to determine creditworthiness or for lending

### Justification for Permissions

When submitting, you'll need to justify permissions:

**activeTab**
Required to capture screenshots of the visible Google Earth tab without requesting access to all websites.

**storage**
Required to securely store the user's fal.ai API key and user preferences (prompts, settings) locally in the browser.

**tabs**
Required to use chrome.tabs.captureVisibleTab API for capturing high-quality screenshots of the Google Earth view.

**host_permissions (fal.ai domains)**
Required to communicate with fal.ai's API endpoints for:
- Image transformation (nano-banana-pro)
- Video generation (veo3.1)
All communication is over HTTPS and only sends user-initiated content.

## 🎯 Pre-Submission Final Checks

- [ ] Version number is appropriate (1.0.0)
- [ ] All icons are present (16, 48, 128)
- [ ] manifest.json is valid JSON
- [ ] No console errors in production
- [ ] Privacy policy is accessible
- [ ] Support email is active
- [ ] GitHub repo is public (if linking to it)
- [ ] Remove any dev-only files from package
- [ ] Test the .zip package locally

## 📦 Creating the Submission Package

1. Create a clean directory with only necessary files:
   ```
   manifest.json
   icons/
   popup/
   scripts/
   PRIVACY.md
   ```

2. Do NOT include:
   - `config.json` (dev only)
   - `.git/` directory
   - `.gitignore`
   - `README.md` (unless required)
   - `node_modules/` (we don't have any)
   - Development scripts

3. Zip the directory (not a parent folder)

4. Upload to Chrome Web Store Developer Dashboard

## ⏱️ Expected Review Time

- Initial review: 1-3 business days
- If changes requested: 1-3 days per iteration
- Average total time: 3-7 days

## 🚨 Common Rejection Reasons to Avoid

✅ We've addressed these:
- [x] Clear single purpose
- [x] Privacy policy provided
- [x] Permissions justified
- [x] No obfuscated code
- [x] User data handling explained
- [x] Third-party API disclosed

## 📞 Support Contacts Needed

- Support email: [REQUIRED - add yours]
- GitHub repository: [REQUIRED - add your username]
- Privacy policy URL: Use GitHub Pages or link to PRIVACY.md

## 🎉 Post-Submission

Once approved:
1. Share on social media
2. Add "Available on Chrome Web Store" badge to README
3. Monitor user reviews and feedback
4. Set up GitHub Issues for bug reports
5. Plan future updates

---

**Ready to submit?** Make sure all checkboxes are complete!

