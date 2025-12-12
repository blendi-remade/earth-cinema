# Earth Cinema

Chrome extension that transforms Google Earth 3D views into cinematic images and videos using [fal.ai](https://fal.ai).

## Features

- **Capture** any Google Earth 3D view
- **Transform** with AI (Nano Banana Pro) into cinematic shots
- **Generate videos** (Veo 3.1) with customizable duration and audio

## Setup

1. Clone this repo
2. Create `config.json` in root with your fal.ai API key:
   ```json
   {
     "FAL_API_KEY": "your-key-here"
   }
   ```
3. Go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" → select this folder

## Usage

1. Navigate to [earth.google.com](https://earth.google.com/web)
2. Find a scenic 3D view (works with any other view too)
3. Click the extension icon
4. Capture → Transform → Generate Video

## Tech

- Chrome Extension (Manifest V3)
- [fal.ai](https://fal.ai) APIs:
  - `nano-banana-pro/edit` (image transformation)
  - `veo3.1/fast/image-to-video` (video generation)
