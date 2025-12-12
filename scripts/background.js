// ============================================
// Earth Cinema - Background Service Worker
// Handles API calls to fal.ai
// Runs independently of popup
// ============================================

// Config loaded from config.json (for development)
let CONFIG = { FAL_API_KEY: null };
let configLoaded = false;

// Storage keys (same as popup)
const STORAGE_KEYS = {
  CAPTURED_IMAGE: 'earthCinema_capturedImage',
  TRANSFORMED_URL: 'earthCinema_transformedUrl',
  VIDEO_URL: 'earthCinema_videoUrl',
  OPERATION: 'earthCinema_operation',
  OPERATION_ERROR: 'earthCinema_operationError',
  TRANSFORM_PROMPT: 'earthCinema_transformPrompt',
  VIDEO_PROMPT: 'earthCinema_videoPrompt'
};

// Load config on startup
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    if (response.ok) {
      CONFIG = await response.json();
      configLoaded = true;
      console.log('[Earth Cinema] Config loaded from config.json');
    }
  } catch (e) {
    console.log('[Earth Cinema] No config.json found, will use stored key');
  }
}

// Initialize config
loadConfig();

// API Endpoints
const FAL_API = {
  VIDEO: 'https://fal.run/fal-ai/veo3.1/fast/image-to-video'
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sendResponse);
  return true; // Keep message channel open for async response
});

/**
 * Route messages to appropriate handlers
 */
async function handleMessage(request, sendResponse) {
  // Ensure config is loaded before handling requests
  if (!configLoaded) {
    await loadConfig();
  }
  
  try {
    switch (request.action) {
      case 'checkConfig':
        const hasKey = !!(CONFIG.FAL_API_KEY && CONFIG.FAL_API_KEY !== 'YOUR_FAL_API_KEY_HERE');
        console.log('[Earth Cinema] checkConfig:', hasKey);
        sendResponse({ hasConfigKey: hasKey });
        break;
        
      case 'startTransform':
        // Start transform in background, don't wait for it
        sendResponse({ started: true });
        runTransformInBackground(request.imageData, request.prompt, request.apiKey);
        break;
        
      case 'startVideo':
        // Start video generation in background, don't wait for it
        sendResponse({ started: true });
        runVideoInBackground(request.imageUrl, request.prompt, request.apiKey, request.duration, request.generateAudio);
        break;
        
      case 'checkOperationStatus':
        const status = await getOperationStatus();
        sendResponse(status);
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action: ' + request.action });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get current operation status from storage
 */
async function getOperationStatus() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.OPERATION,
    STORAGE_KEYS.OPERATION_ERROR,
    STORAGE_KEYS.TRANSFORMED_URL,
    STORAGE_KEYS.VIDEO_URL
  ]);
  
  const status = {
    operation: stored[STORAGE_KEYS.OPERATION] || null,
    error: stored[STORAGE_KEYS.OPERATION_ERROR] || null,
    transformedUrl: stored[STORAGE_KEYS.TRANSFORMED_URL] || null,
    videoUrl: stored[STORAGE_KEYS.VIDEO_URL] || null
  };
  
  console.log('[Earth Cinema] getOperationStatus:', status);
  return status;
}

/**
 * Get the API key (from config or passed in)
 */
function getApiKey(passedKey) {
  if (CONFIG.FAL_API_KEY && CONFIG.FAL_API_KEY !== 'YOUR_FAL_API_KEY_HERE') {
    return CONFIG.FAL_API_KEY;
  }
  return passedKey;
}

/**
 * Run transform in background and save result to storage
 */
async function runTransformInBackground(imageData, prompt, passedApiKey) {
  const apiKey = getApiKey(passedApiKey);
  
  if (!apiKey) {
    await saveOperationError('transforming', 'No API key configured');
    return;
  }
  
  // Mark operation as in progress
  await chrome.storage.local.set({
    [STORAGE_KEYS.OPERATION]: 'transforming',
    [STORAGE_KEYS.OPERATION_ERROR]: null
  });
  
  console.log('[Earth Cinema] Starting background transform...');
  
  // Enhance prompt to remove UI elements and keep the scene
  const enhancedPrompt = `Remove ALL UI elements from the image. Then: ${prompt}. Depict this EXACT viewing angle and distance.`;
  
  try {
    const response = await fetch('https://fal.run/fal-ai/nano-banana-pro/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_urls: [imageData],
        aspect_ratio: 'auto',
        resolution: '2K'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[Earth Cinema] Transform complete:', result);
    
    if (result.images && result.images.length > 0) {
      // Save result to storage
      await chrome.storage.local.set({
        [STORAGE_KEYS.TRANSFORMED_URL]: result.images[0].url,
        [STORAGE_KEYS.OPERATION]: null,
        [STORAGE_KEYS.OPERATION_ERROR]: null
      });
      
      // Try to notify popup if it's open
      notifyPopup('transformComplete', { success: true, imageUrl: result.images[0].url });
    } else {
      throw new Error('No image returned from transformation');
    }
    
  } catch (error) {
    console.error('[Earth Cinema] Transform error:', error);
    await saveOperationError('transforming', error.message);
    notifyPopup('transformComplete', { success: false, error: error.message });
  }
}

/**
 * Run video generation in background and save result to storage
 */
async function runVideoInBackground(imageUrl, prompt, passedApiKey, duration = '8s', generateAudio = true) {
  const apiKey = getApiKey(passedApiKey);
  
  if (!apiKey) {
    await saveOperationError('generating_video', 'No API key configured');
    return;
  }
  
  // Mark operation as in progress
  await chrome.storage.local.set({
    [STORAGE_KEYS.OPERATION]: 'generating_video',
    [STORAGE_KEYS.OPERATION_ERROR]: null
  });
  
  console.log('[Earth Cinema] Starting Veo 3.1 video generation...', { duration, generateAudio });
  
  try {
    // Use Veo 3.1 Fast sync endpoint
    const response = await fetch(FAL_API.VIDEO, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_url: imageUrl,
        duration: duration,
        resolution: '1080p',
        generate_audio: generateAudio,
        aspect_ratio: 'auto'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Earth Cinema] Video API error:', errorData);
      throw new Error(errorData.detail || errorData.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[Earth Cinema] Video result:', result);
    
    if (result.video && result.video.url) {
      // Save result to storage
      await chrome.storage.local.set({
        [STORAGE_KEYS.VIDEO_URL]: result.video.url,
        [STORAGE_KEYS.OPERATION]: null,
        [STORAGE_KEYS.OPERATION_ERROR]: null
      });
      
      notifyPopup('videoComplete', { success: true, videoUrl: result.video.url });
    } else {
      throw new Error('No video returned from generation');
    }
    
  } catch (error) {
    console.error('[Earth Cinema] Video error:', error);
    await saveOperationError('generating_video', error.message);
    notifyPopup('videoComplete', { success: false, error: error.message });
  }
}

/**
 * Save operation error to storage
 */
async function saveOperationError(operation, errorMessage) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.OPERATION]: null,
    [STORAGE_KEYS.OPERATION_ERROR]: errorMessage
  });
}

/**
 * Try to notify popup (if it's open)
 */
function notifyPopup(action, data) {
  chrome.runtime.sendMessage({ action, ...data }).catch(() => {
    // Popup is closed, that's fine - data is in storage
    console.log('[Earth Cinema] Popup not open, result saved to storage');
  });
}

/**
 * Poll for result from fal.ai queue
 */
async function pollForResult(requestId, apiKey, baseEndpoint, timeout = 60000) {
  const statusUrl = `${baseEndpoint}/requests/${requestId}/status`;
  const startTime = Date.now();
  
  console.log('[Earth Cinema] Polling for result:', requestId);
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Key ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      
      const status = await response.json();
      console.log('[Earth Cinema] Status:', status.status);
      
      if (status.status === 'COMPLETED') {
        const resultUrl = `${baseEndpoint}/requests/${requestId}`;
        const resultResponse = await fetch(resultUrl, {
          headers: {
            'Authorization': `Key ${apiKey}`
          }
        });
        
        if (!resultResponse.ok) {
          throw new Error(`Result fetch failed: ${resultResponse.status}`);
        }
        
        return await resultResponse.json();
      }
      
      if (status.status === 'FAILED') {
        throw new Error(status.error || 'Processing failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('[Earth Cinema] Poll error:', error);
      if (error.message.includes('FAILED')) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error('Request timed out');
}

// Log that service worker is active
console.log('[Earth Cinema] Service worker loaded');
