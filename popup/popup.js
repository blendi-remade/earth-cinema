// ============================================
// Earth Cinema - Popup Controller
// State persists across popup open/close
// ============================================

// DOM Elements
const elements = {
  // API Section
  apiToggle: document.getElementById('api-toggle'),
  apiContent: document.getElementById('api-content'),
  apiStatusBadge: document.getElementById('api-status-badge'),
  apiKeyInput: document.getElementById('api-key'),
  toggleVisibility: document.getElementById('toggle-visibility'),
  saveKeyBtn: document.getElementById('save-key'),
  
  // Steps
  steps: document.querySelectorAll('.step'),
  
  // Capture Section
  captureBtn: document.getElementById('capture-btn'),
  capturePreview: document.getElementById('capture-preview'),
  previewImage: document.getElementById('preview-image'),
  
  // Transform Section
  transformSection: document.getElementById('transform-section'),
  transformPrompt: document.getElementById('transform-prompt'),
  transformBtn: document.getElementById('transform-btn'),
  transformPreview: document.getElementById('transform-preview'),
  transformedImage: document.getElementById('transformed-image'),
  downloadImageBtn: document.getElementById('download-image'),
  
  // Video Section
  videoSection: document.getElementById('video-section'),
  videoPrompt: document.getElementById('video-prompt'),
  videoBtn: document.getElementById('video-btn'),
  videoPreview: document.getElementById('video-preview'),
  resultVideo: document.getElementById('result-video'),
  downloadVideoBtn: document.getElementById('download-video'),
  
  // Reset button
  resetBtn: document.getElementById('reset-btn'),
  
  // UI
  toast: document.getElementById('toast'),
  loading: document.getElementById('loading'),
  loadingText: document.getElementById('loading-text'),
  apiCard: document.querySelector('.api-card')
};

// State (will be synced with chrome.storage)
const state = {
  capturedImageBase64: null,
  transformedImageUrl: null,
  generatedVideoUrl: null,
  currentOperation: null, // 'capturing', 'transforming', 'generating_video', or null
  transformPrompt: '',
  videoPrompt: '',
  isApiKeyVisible: false,
  hasApiKey: false,
  hasConfigKey: false
};

// Storage keys
const STORAGE_KEYS = {
  CAPTURED_IMAGE: 'earthCinema_capturedImage',
  TRANSFORMED_URL: 'earthCinema_transformedUrl',
  VIDEO_URL: 'earthCinema_videoUrl',
  OPERATION: 'earthCinema_operation',
  TRANSFORM_PROMPT: 'earthCinema_transformPrompt',
  VIDEO_PROMPT: 'earthCinema_videoPrompt'
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadPersistedState();
  await checkApiKey();
  await checkGoogleEarthTab();
  setupEventListeners();
  restoreUI();
});

/**
 * Load persisted state from chrome.storage
 */
async function loadPersistedState() {
  try {
    const stored = await chrome.storage.local.get([
      STORAGE_KEYS.CAPTURED_IMAGE,
      STORAGE_KEYS.TRANSFORMED_URL,
      STORAGE_KEYS.VIDEO_URL,
      STORAGE_KEYS.OPERATION,
      STORAGE_KEYS.TRANSFORM_PROMPT,
      STORAGE_KEYS.VIDEO_PROMPT
    ]);
    
    state.capturedImageBase64 = stored[STORAGE_KEYS.CAPTURED_IMAGE] || null;
    state.transformedImageUrl = stored[STORAGE_KEYS.TRANSFORMED_URL] || null;
    state.generatedVideoUrl = stored[STORAGE_KEYS.VIDEO_URL] || null;
    state.currentOperation = stored[STORAGE_KEYS.OPERATION] || null;
    state.transformPrompt = stored[STORAGE_KEYS.TRANSFORM_PROMPT] || '';
    state.videoPrompt = stored[STORAGE_KEYS.VIDEO_PROMPT] || '';
    
    console.log('[Earth Cinema] Loaded persisted state:', {
      hasCaptured: !!state.capturedImageBase64,
      hasTransformed: !!state.transformedImageUrl,
      hasVideo: !!state.generatedVideoUrl,
      operation: state.currentOperation
    });
  } catch (error) {
    console.error('Error loading persisted state:', error);
  }
}

/**
 * Save state to chrome.storage
 */
async function saveState() {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.CAPTURED_IMAGE]: state.capturedImageBase64,
      [STORAGE_KEYS.TRANSFORMED_URL]: state.transformedImageUrl,
      [STORAGE_KEYS.VIDEO_URL]: state.generatedVideoUrl,
      [STORAGE_KEYS.OPERATION]: state.currentOperation,
      [STORAGE_KEYS.TRANSFORM_PROMPT]: state.transformPrompt,
      [STORAGE_KEYS.VIDEO_PROMPT]: state.videoPrompt
    });
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

/**
 * Restore UI based on persisted state
 */
async function restoreUI() {
  // Restore prompts
  if (state.transformPrompt) {
    elements.transformPrompt.value = state.transformPrompt;
  }
  if (state.videoPrompt) {
    elements.videoPrompt.value = state.videoPrompt;
  }
  
  // Restore captured image
  if (state.capturedImageBase64) {
    elements.previewImage.src = state.capturedImageBase64;
    elements.capturePreview.classList.remove('hidden');
    elements.transformSection.classList.remove('hidden');
    updateStep(2);
  }
  
  // Restore transformed image
  if (state.transformedImageUrl) {
    // Must also show transform section (parent container)
    elements.transformSection.classList.remove('hidden');
    elements.transformedImage.src = state.transformedImageUrl;
    elements.transformPreview.classList.remove('hidden');
    elements.videoSection.classList.remove('hidden');
    updateStep(3);
  }
  
  // Restore video
  if (state.generatedVideoUrl) {
    elements.resultVideo.src = state.generatedVideoUrl;
    elements.videoPreview.classList.remove('hidden');
  }
  
  // Show reset button if we have any progress
  if (state.capturedImageBase64 || state.transformedImageUrl || state.generatedVideoUrl) {
    elements.resetBtn?.classList.remove('hidden');
  }
  
  // Always check with background for latest status (in case operation completed)
  await checkOngoingOperation();
}

/**
 * Check if there's an ongoing operation from background
 */
async function checkOngoingOperation() {
  try {
    const status = await chrome.runtime.sendMessage({ action: 'checkOperationStatus' });
    console.log('[Earth Cinema] Operation status:', status);
    
    // Priority 1: Check if we have a NEW result that we haven't shown yet
    if (status.transformedUrl && status.transformedUrl !== state.transformedImageUrl) {
      console.log('[Earth Cinema] Found new transformed image!');
      state.transformedImageUrl = status.transformedUrl;
      state.currentOperation = null;
      await saveState();
      
      // Must also show transform section (parent container)
      elements.transformSection.classList.remove('hidden');
      elements.transformedImage.src = status.transformedUrl;
      elements.transformPreview.classList.remove('hidden');
      elements.videoSection.classList.remove('hidden');
      elements.resetBtn?.classList.remove('hidden');
      updateStep(3);
      hideLoading();
      elements.transformBtn.disabled = false;
      showToast('Done', 'Image transformed', 'success');
      stopPolling();
      return;
    }
    
    if (status.videoUrl && status.videoUrl !== state.generatedVideoUrl) {
      console.log('[Earth Cinema] Found new video!');
      state.generatedVideoUrl = status.videoUrl;
      state.currentOperation = null;
      await saveState();
      
      elements.resultVideo.src = status.videoUrl;
      elements.videoPreview.classList.remove('hidden');
      hideLoading();
      elements.videoBtn.disabled = false;
      showToast('Done', 'Video generated', 'success');
      stopPolling();
      return;
    }
    
    // Priority 2: Check for errors
    if (status.error) {
      console.log('[Earth Cinema] Found error:', status.error);
      state.currentOperation = null;
      await saveState();
      hideLoading();
      elements.transformBtn.disabled = false;
      elements.videoBtn.disabled = false;
      showToast('Failed', status.error, 'error');
      stopPolling();
      return;
    }
    
    // Priority 3: Check if operation is in progress
    if (status.operation === 'transforming') {
      state.currentOperation = 'transforming';
      showLoading('Transforming image...');
      startPolling();
    } else if (status.operation === 'generating_video') {
      state.currentOperation = 'generating_video';
      showLoading('Generating video...');
      startPolling();
    } else {
      // No operation, hide loading
      hideLoading();
      state.currentOperation = null;
    }
  } catch (error) {
    console.error('Error checking operation status:', error);
  }
}

/**
 * Poll for operation completion
 */
let pollingInterval = null;

function startPolling() {
  if (pollingInterval) return;
  
  pollingInterval = setInterval(async () => {
    try {
      const status = await chrome.runtime.sendMessage({ action: 'checkOperationStatus' });
      console.log('[Earth Cinema] Poll status:', status);
      
      // Check if we got a result (regardless of operation status)
      if (status.transformedUrl && !state.transformedImageUrl) {
        stopPolling();
        state.transformedImageUrl = status.transformedUrl;
        state.currentOperation = null;
        await saveState();
        
        // Must also show transform section (parent container)
        elements.transformSection.classList.remove('hidden');
        elements.transformedImage.src = status.transformedUrl;
        elements.transformPreview.classList.remove('hidden');
        elements.videoSection.classList.remove('hidden');
        updateStep(3);
        hideLoading();
        elements.transformBtn.disabled = false;
        showToast('Transformation Complete', 'Your cinematic image is ready', 'success');
        return;
      }
      
      if (status.videoUrl && !state.generatedVideoUrl) {
        stopPolling();
        state.generatedVideoUrl = status.videoUrl;
        state.currentOperation = null;
        await saveState();
        
        elements.resultVideo.src = status.videoUrl;
        elements.videoPreview.classList.remove('hidden');
        hideLoading();
        elements.videoBtn.disabled = false;
        showToast('Video Generated', 'Your cinematic video is ready', 'success');
        return;
      }
      
      // Check for errors
      if (status.error) {
        stopPolling();
        state.currentOperation = null;
        await saveState();
        hideLoading();
        elements.transformBtn.disabled = false;
        elements.videoBtn.disabled = false;
        showToast('Operation Failed', status.error, 'error');
        return;
      }
      
      // If operation is no longer in progress but we don't have result, clear state
      if (!status.operation) {
        stopPolling();
        state.currentOperation = null;
        await saveState();
        hideLoading();
        elements.transformBtn.disabled = false;
        elements.videoBtn.disabled = false;
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 2000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

/**
 * Cancel current operation and hide loading
 */
async function cancelOperation() {
  console.log('[Earth Cinema] Cancelling operation');
  stopPolling();
  state.currentOperation = null;
  
  // Clear operation in storage
  await chrome.storage.local.set({
    [STORAGE_KEYS.OPERATION]: null,
    [STORAGE_KEYS.OPERATION_ERROR]: null
  });
  
  hideLoading();
  elements.transformBtn.disabled = false;
  elements.videoBtn.disabled = false;
  showToast('Cancelled', 'Operation cancelled', 'info');
}

/**
 * Reset all state and start fresh
 */
async function resetState() {
  state.capturedImageBase64 = null;
  state.transformedImageUrl = null;
  state.generatedVideoUrl = null;
  state.currentOperation = null;
  state.transformPrompt = '';
  state.videoPrompt = '';
  
  await saveState();
  
  // Reset UI
  elements.previewImage.src = '';
  elements.capturePreview.classList.add('hidden');
  elements.transformSection.classList.add('hidden');
  elements.transformPrompt.value = '';
  elements.transformedImage.src = '';
  elements.transformPreview.classList.add('hidden');
  elements.videoSection.classList.add('hidden');
  elements.videoPrompt.value = '';
  elements.resultVideo.src = '';
  elements.videoPreview.classList.add('hidden');
  elements.resetBtn?.classList.add('hidden');
  
  updateStep(1);
  hideLoading();
  
  showToast('Reset Complete', 'Ready to capture a new view', 'success');
}

async function checkApiKey() {
  try {
    // First check if config.json has a key
    const configResponse = await chrome.runtime.sendMessage({ action: 'checkConfig' });
    if (configResponse?.hasConfigKey) {
      state.hasApiKey = true;
      state.hasConfigKey = true;
      updateApiStatus(true);
      elements.captureBtn.disabled = false;
      // Hide API section entirely when using config
      elements.apiCard.style.display = 'none';
      console.log('[Earth Cinema] Using API key from config.json');
      return;
    }
    
    // Fall back to stored key
    const { falApiKey } = await chrome.storage.local.get('falApiKey');
    if (falApiKey) {
      state.hasApiKey = true;
      elements.apiKeyInput.value = '••••••••••••••••••••';
      elements.apiKeyInput.dataset.saved = 'true';
      updateApiStatus(true);
      elements.captureBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error checking API key:', error);
  }
}

async function checkGoogleEarthTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url?.includes('earth.google.com')) {
      // Only disable capture if we don't already have a captured image
      if (!state.capturedImageBase64) {
        showToast('Navigate to Google Earth', 'Open earth.google.com to capture views', 'info');
        elements.captureBtn.disabled = true;
      }
    }
  } catch (error) {
    console.error('Error checking tab:', error);
  }
}

function setupEventListeners() {
  // API Section
  elements.apiToggle.addEventListener('click', toggleApiSection);
  elements.toggleVisibility.addEventListener('click', toggleKeyVisibility);
  elements.saveKeyBtn.addEventListener('click', saveApiKey);
  elements.apiKeyInput.addEventListener('focus', handleApiKeyFocus);
  
  // Main Actions
  elements.captureBtn.addEventListener('click', captureView);
  elements.transformBtn.addEventListener('click', transformImage);
  elements.videoBtn.addEventListener('click', generateVideo);
  
  // Reset button
  elements.resetBtn?.addEventListener('click', resetState);
  
  // Cancel button (in loading overlay)
  document.getElementById('cancel-btn')?.addEventListener('click', cancelOperation);
  
  // Save prompts on change
  elements.transformPrompt.addEventListener('input', () => {
    state.transformPrompt = elements.transformPrompt.value;
    saveState();
  });
  elements.videoPrompt.addEventListener('input', () => {
    state.videoPrompt = elements.videoPrompt.value;
    saveState();
  });
  
  // Downloads
  elements.downloadImageBtn.addEventListener('click', () => downloadFile(state.transformedImageUrl, 'earth-cinema-image.png'));
  elements.downloadVideoBtn.addEventListener('click', () => downloadFile(state.generatedVideoUrl, 'earth-cinema-video.mp4'));
  
  // Open in new tab for fullscreen viewing
  document.getElementById('open-image-tab')?.addEventListener('click', () => {
    if (state.transformedImageUrl) {
      window.open(state.transformedImageUrl, '_blank');
    }
  });
  document.getElementById('open-video-tab')?.addEventListener('click', () => {
    if (state.generatedVideoUrl) {
      window.open(state.generatedVideoUrl, '_blank');
    }
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

/**
 * Handle messages from background script (for async operation results)
 */
function handleBackgroundMessage(message, sender, sendResponse) {
  console.log('[Earth Cinema] Received message from background:', message);
  
  if (message.action === 'transformComplete') {
    stopPolling();
    state.currentOperation = null;
    
    if (message.success) {
      state.transformedImageUrl = message.imageUrl;
      // Must also show transform section (parent container)
      elements.transformSection.classList.remove('hidden');
      elements.transformedImage.src = message.imageUrl;
      elements.transformPreview.classList.remove('hidden');
      elements.videoSection.classList.remove('hidden');
      updateStep(3);
      showToast('Transformation Complete', 'Your cinematic image is ready', 'success');
    } else {
      showToast('Transform Failed', message.error, 'error');
    }
    
    saveState();
    hideLoading();
    elements.transformBtn.disabled = false;
  }
  
  if (message.action === 'videoComplete') {
    stopPolling();
    state.currentOperation = null;
    
    if (message.success) {
      state.generatedVideoUrl = message.videoUrl;
      elements.resultVideo.src = message.videoUrl;
      elements.videoPreview.classList.remove('hidden');
      showToast('Video Generated', 'Your cinematic video is ready', 'success');
    } else {
      showToast('Video Failed', message.error, 'error');
    }
    
    saveState();
    hideLoading();
    elements.videoBtn.disabled = false;
  }
  
  // Always send a response to avoid errors
  if (sendResponse) {
    sendResponse({ received: true });
  }
}

// ============================================
// API Key Management
// ============================================

function toggleApiSection() {
  const isExpanded = elements.apiCard.classList.toggle('expanded');
  elements.apiContent.classList.toggle('collapsed', !isExpanded);
}

function toggleKeyVisibility() {
  state.isApiKeyVisible = !state.isApiKeyVisible;
  
  if (elements.apiKeyInput.dataset.saved === 'true') {
    return;
  }
  
  elements.apiKeyInput.type = state.isApiKeyVisible ? 'text' : 'password';
}

function handleApiKeyFocus() {
  if (elements.apiKeyInput.dataset.saved === 'true') {
    elements.apiKeyInput.value = '';
    elements.apiKeyInput.dataset.saved = 'false';
    elements.apiKeyInput.type = 'password';
  }
}

async function saveApiKey() {
  const key = elements.apiKeyInput.value.trim();
  
  if (!key || key === '••••••••••••••••••••') {
    showToast('Invalid Key', 'Please enter a valid API key', 'error');
    return;
  }
  
  try {
    await chrome.storage.local.set({ falApiKey: key });
    state.hasApiKey = true;
    elements.apiKeyInput.value = '••••••••••••••••••••';
    elements.apiKeyInput.dataset.saved = 'true';
    elements.apiKeyInput.type = 'password';
    updateApiStatus(true);
    elements.captureBtn.disabled = false;
    
    elements.apiCard.classList.remove('expanded');
    elements.apiContent.classList.add('collapsed');
    
    showToast('API Key Saved', 'Your key is stored securely', 'success');
  } catch (error) {
    showToast('Save Failed', error.message, 'error');
  }
}

function updateApiStatus(configured) {
  const badge = elements.apiStatusBadge;
  const statusText = badge.querySelector('.status-text');
  
  if (configured) {
    badge.classList.add('configured');
    statusText.textContent = state.hasConfigKey ? 'From config' : 'Configured';
  } else {
    badge.classList.remove('configured');
    statusText.textContent = 'Not configured';
  }
}

// ============================================
// Capture View
// ============================================

async function captureView() {
  if (!state.hasApiKey) {
    showToast('API Key Required', 'Please configure your fal.ai API key first', 'error');
    toggleApiSection();
    return;
  }
  
  showLoading('Capturing Google Earth view...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Capture the visible tab directly (UI removal handled by AI prompt)
    showLoading('Capturing screen...');
    const imageData = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    
    if (imageData) {
      state.capturedImageBase64 = imageData;
      await saveState();
      
      elements.previewImage.src = imageData;
      elements.capturePreview.classList.remove('hidden');
      elements.transformSection.classList.remove('hidden');
      elements.resetBtn?.classList.remove('hidden');
      
      updateStep(2);
      showToast('View Captured', 'Now add a transformation prompt', 'success');
    } else {
      throw new Error('No image data returned');
    }
  } catch (error) {
    console.error('Capture error:', error);
    showToast('Capture Failed', error.message || 'Make sure you\'re on Google Earth', 'error');
  }
  
  hideLoading();
}

// ============================================
// Transform Image
// ============================================

async function transformImage() {
  const prompt = elements.transformPrompt.value.trim();
  
  if (!prompt) {
    showToast('Prompt Required', 'Describe how you want to transform the image', 'error');
    elements.transformPrompt.focus();
    return;
  }
  
  state.transformPrompt = prompt;
  state.currentOperation = 'transforming';
  await saveState();
  
  showLoading('Transforming with Nano Banana Pro...');
  elements.transformBtn.disabled = true;
  
  try {
    let apiKey = null;
    if (!state.hasConfigKey) {
      const stored = await chrome.storage.local.get('falApiKey');
      apiKey = stored.falApiKey;
    }
    
    // Start the operation in background (won't wait for completion)
    await chrome.runtime.sendMessage({
      action: 'startTransform',
      imageData: state.capturedImageBase64,
      prompt: prompt,
      apiKey: apiKey
    });
    
    // Start polling for completion
    startPolling();
    
  } catch (error) {
    state.currentOperation = null;
    await saveState();
    console.error('Transform error:', error);
    showToast('Transform Failed', error.message, 'error');
    hideLoading();
    elements.transformBtn.disabled = false;
  }
}

// ============================================
// Generate Video
// ============================================

async function generateVideo() {
  const prompt = elements.videoPrompt.value.trim() || 'slow cinematic camera movement';
  const duration = document.getElementById('video-duration').value;
  const generateAudio = document.getElementById('video-audio').checked;
  
  state.videoPrompt = prompt;
  state.currentOperation = 'generating_video';
  await saveState();
  
  showLoading(`Generating ${duration} video with Veo 3.1...`);
  elements.videoBtn.disabled = true;
  
  try {
    let apiKey = null;
    if (!state.hasConfigKey) {
      const stored = await chrome.storage.local.get('falApiKey');
      apiKey = stored.falApiKey;
    }
    
    // Start the operation in background (won't wait for completion)
    await chrome.runtime.sendMessage({
      action: 'startVideo',
      imageUrl: state.transformedImageUrl,
      prompt: prompt,
      apiKey: apiKey,
      duration: duration,
      generateAudio: generateAudio
    });
    
    // Start polling for completion
    startPolling();
    
  } catch (error) {
    state.currentOperation = null;
    await saveState();
    console.error('Video error:', error);
    showToast('Video Failed', error.message, 'error');
    hideLoading();
    elements.videoBtn.disabled = false;
  }
}

// ============================================
// UI Helpers
// ============================================

function updateStep(activeStep) {
  elements.steps.forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNum < activeStep) {
      step.classList.add('completed');
    } else if (stepNum === activeStep) {
      step.classList.add('active');
    }
  });
}

function showToast(title, message, type = 'info') {
  elements.toast.className = `toast ${type}`;
  elements.toast.querySelector('.toast-title').textContent = title;
  elements.toast.querySelector('.toast-message').textContent = message;
  elements.toast.classList.remove('hidden');
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2500);
}

function showLoading(text) {
  elements.loadingText.textContent = text;
  elements.loading.classList.remove('hidden');
}

function hideLoading() {
  elements.loading.classList.add('hidden');
}

async function downloadFile(url, filename) {
  if (!url) {
    showToast('Nothing to Download', 'Generate content first', 'error');
    return;
  }
  
  showToast('Downloading...', filename, 'info');
  
  try {
    // Fetch the file to bypass cross-origin restrictions
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
    
    showToast('Download Complete', filename, 'success');
  } catch (error) {
    console.error('Download error:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
    showToast('Opened in New Tab', 'Right-click to save', 'info');
  }
}
