// ============================================
// Earth Cinema - Background Service Worker
// Handles API calls to fal.ai
// Runs independently of popup
// ============================================

// Storage keys (same as popup)
const STORAGE_KEYS = {
  CAPTURED_IMAGE: 'earthCinema_capturedImage',
  TRANSFORMED_URL: 'earthCinema_transformedUrl',
  VIDEO_URL: 'earthCinema_videoUrl',
  OPERATION: 'earthCinema_operation',
  OPERATION_ERROR: 'earthCinema_operationError',
  TRANSFORM_PROMPT: 'earthCinema_transformPrompt',
  VIDEO_PROMPT: 'earthCinema_videoPrompt',
  API_KEY: 'falApiKey'
};

// API Endpoints
const FAL_API = {
  VIDEO: 'https://fal.run/fal-ai/veo3.1/fast/image-to-video'
};

// ============================================
// Service Worker Keep-Alive Helper
// Prevents Chrome from terminating the worker during long operations
// ============================================
async function waitUntil(promise) {
  const keepAlive = setInterval(() => {
    chrome.runtime.getPlatformInfo();
  }, 25 * 1000);
  
  try {
    return await promise;
  } finally {
    clearInterval(keepAlive);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sendResponse);
  return true; // Keep message channel open for async response
});

/**
 * Route messages to appropriate handlers
 */
async function handleMessage(request, sendResponse) {
  try {
    switch (request.action) {
      case 'startTransform':
        // Start transform in background, don't wait for it
        sendResponse({ started: true });
        runTransformInBackground(request.imageData, request.prompt, request.resolution);
        break;
        
      case 'startVideo':
        // Start video generation in background, don't wait for it
        sendResponse({ started: true });
        runVideoInBackground(request.imageUrl, request.prompt, request.duration, request.generateAudio);
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
 * Get the API key from storage
 */
async function getApiKey() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
  return stored[STORAGE_KEYS.API_KEY] || null;
}

/**
 * Run transform in background and save result to storage
 */
async function runTransformInBackground(imageData, prompt, resolution = '2K') {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    await saveOperationError('transforming', 'No API key configured. Please add your fal.ai API key in the extension settings.');
    return;
  }
  
  // Mark operation as in progress
  await chrome.storage.local.set({
    [STORAGE_KEYS.OPERATION]: 'transforming',
    [STORAGE_KEYS.OPERATION_ERROR]: null
  });
  
  console.log('[Earth Cinema] Starting background transform...', { resolution });
  
  // Enhance prompt to remove UI elements and keep the scene
  const enhancedPrompt = `Remove ALL UI elements from the image. Then: ${prompt}. Depict this EXACT viewing angle and distance.`;
  
  try {
    // Create timeout promise (90 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Transform timed out after 90 seconds. The fal.ai service may be busy. Please try again.')), 90000)
    );
    
    // Wrap in waitUntil to keep service worker alive
    const fetchPromise = waitUntil(fetch('https://fal.run/fal-ai/nano-banana-pro/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_urls: [imageData],
        aspect_ratio: 'auto',
        resolution: resolution
      })
    }));
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.detail || errorData.message || `API error: ${response.status}`;
      
      // Provide helpful error messages for common status codes
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid API key. Please check your key in the extension settings.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 413) {
        errorMessage = 'Image too large. Try capturing at a lower resolution.';
      } else if (response.status === 500 || response.status === 503) {
        errorMessage = 'fal.ai service is temporarily unavailable. Please try again later.';
      }
      
      throw new Error(errorMessage);
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
    let userMessage = error.message;
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    await saveOperationError('transforming', userMessage);
    notifyPopup('transformComplete', { success: false, error: userMessage });
  }
}

/**
 * Run video generation in background and save result to storage
 */
async function runVideoInBackground(imageUrl, prompt, duration = '8s', generateAudio = true) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    await saveOperationError('generating_video', 'No API key configured. Please add your fal.ai API key in the extension settings.');
    return;
  }
  
  // Mark operation as in progress
  await chrome.storage.local.set({
    [STORAGE_KEYS.OPERATION]: 'generating_video',
    [STORAGE_KEYS.OPERATION_ERROR]: null
  });
  
  console.log('[Earth Cinema] Starting Veo 3.1 video generation...', { duration, generateAudio });
  
  try {
    // Create timeout promise (8 minutes)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Video generation timed out after 8 minutes. The fal.ai service may be busy. Please try again.')), 480000)
    );
    
    // Wrap in waitUntil to keep service worker alive
    const fetchPromise = waitUntil(fetch(FAL_API.VIDEO, {
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
    }));
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Earth Cinema] Video API error:', errorData);
      let errorMessage = errorData.detail || errorData.message || `API error: ${response.status}`;
      
      // Provide helpful error messages for common status codes
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid API key. Please check your key in the extension settings.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 500 || response.status === 503) {
        errorMessage = 'fal.ai service is temporarily unavailable. Please try again later.';
      }
      
      throw new Error(errorMessage);
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
    let userMessage = error.message;
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    await saveOperationError('generating_video', userMessage);
    notifyPopup('videoComplete', { success: false, error: userMessage });
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
