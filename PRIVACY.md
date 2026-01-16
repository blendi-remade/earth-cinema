# Privacy Policy for Earth Cinema

**Last Updated: January 15, 2026**

## Overview

Earth Cinema is a Chrome browser extension that transforms Google Earth 3D views into cinematic images and videos using AI. This privacy policy explains how we handle your data.

## Data Collection

**What We Collect:**
- Your fal.ai API key (stored locally in your browser)
- Screenshot images of your Google Earth views (processed temporarily)
- User preferences (transform and video prompts, resolution settings)

**What We DON'T Collect:**
- No personal information
- No browsing history
- No analytics or tracking data
- No usage statistics
- No cookies

## Data Storage

All data is stored locally on your device using Chrome's secure storage API (`chrome.storage.local`):
- API keys are encrypted at rest by Chrome
- Captured images are stored temporarily in your browser
- Settings and preferences remain on your device

**We never store your data on our servers. We don't have any servers.**

## Data Transmission

The extension communicates with third-party services:

**fal.ai API:**
- Your screenshots and prompts are sent to fal.ai for AI processing
- Transmitted over secure HTTPS connections
- Used only to generate transformed images and videos
- Subject to fal.ai's privacy policy: https://fal.ai/privacy

**Google Earth:**
- Screenshots are captured from the Google Earth web interface
- No data is sent to Google by our extension

## Data Usage

Your data is used exclusively to:
- Authenticate with the fal.ai API
- Transform screenshots into cinematic images
- Generate videos from transformed images

We do not use your data for:
- Marketing or advertising
- Analytics or user tracking
- Sharing with third parties (except fal.ai for processing)
- Training AI models

## Data Retention

- Screenshots: Stored temporarily until you click "Start Over" or close the extension
- API key: Stored until you manually remove it or uninstall the extension
- Preferences: Stored until you reset them or uninstall the extension

## Data Control

You have full control over your data:
- **View**: All data is visible in the extension interface
- **Delete**: Click "Start Over" to clear images and settings
- **Remove**: Uninstall the extension to permanently delete all local data
- **Export**: Use the download buttons to save generated content

## Third-Party Services

**fal.ai:**
- Provides AI image transformation and video generation
- Privacy policy: https://fal.ai/privacy
- Terms of service: https://fal.ai/terms

You are responsible for obtaining and managing your own fal.ai API key. Earth Cinema is not affiliated with fal.ai.

## Permissions

The extension requests these Chrome permissions:

- **activeTab**: To capture screenshots of the visible Google Earth tab
- **storage**: To securely store your API key and preferences locally
- **tabs**: To interact with the active browser tab for screenshot capture
- **host_permissions** (fal.ai domains): To communicate with fal.ai's API for processing

## Security

We take security seriously:
- API keys are stored using Chrome's encrypted storage
- All API communication uses HTTPS
- No data is logged to external servers
- Extension code is open source and auditable

## Children's Privacy

Earth Cinema does not knowingly collect information from children under 13. The extension requires a fal.ai API key, which requires users to be 18+ per fal.ai's terms of service.

## Changes to This Policy

We may update this privacy policy. Changes will be posted to this document with an updated "Last Updated" date.

## Contact

For privacy concerns or questions:
- Email: [Your support email]
- GitHub Issues: https://github.com/[your-username]/earth-cinema

## Open Source

Earth Cinema is open source. You can review the code at:
https://github.com/[your-username]/earth-cinema

## Your Rights

Depending on your location, you may have rights under GDPR, CCPA, or other privacy laws:
- Right to access your data (all stored locally)
- Right to delete your data (uninstall the extension)
- Right to data portability (download your generated content)

Since all data is stored locally on your device, you have direct access to view, modify, or delete it at any time.

## Disclaimer

Earth Cinema is provided "as is" without warranties. Users are responsible for:
- Obtaining their own fal.ai API key
- Complying with fal.ai's terms of service
- Any costs associated with API usage
- Ensuring they have rights to content they create

---

By using Earth Cinema, you agree to this privacy policy and to fal.ai's terms of service.

