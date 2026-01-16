# Earth Cinema

Chrome extension that transforms Google Earth 3D views into cinematic images and videos using [fal.ai](https://fal.ai).

## Features

- **Capture** any Google Earth 3D view
- **Transform** with AI (Nano Banana Pro) into cinematic shots
- **Generate videos** (Veo 3.1) with customizable duration and audio

## Setup

1. Clone this repo
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select this folder
5. Get your API key at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
6. Click the extension icon and enter your API key

## Usage

1. Navigate to [earth.google.com](https://earth.google.com/web)
2. Find a scenic 3D view (works with any other view too, street view can also be really cool!)
3. Click the extension icon
4. Enter your fal.ai API key (first time only)
5. Capture → Transform → Generate Video

## Tech

- Chrome Extension (Manifest V3)
- [fal.ai](https://fal.ai) APIs:
  - `nano-banana-pro/edit` (image transformation)
  - `veo3.1/fast/image-to-video` (video generation)
