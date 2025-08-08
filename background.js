// TEXT & CODE GENERATIVE AI DOMAINS ONLY
const aiDomains = [
  // OpenAI - Text Generation
  "chat.openai.com",
  "chatgpt.com",
  "platform.openai.com",
  "beta.openai.com",
  "labs.openai.com",
  "playground.openai.com",
  
  // Anthropic Claude - Text Generation
  "claude.ai",
  "console.anthropic.com",
  
  // Google AI - Text Generation
  "bard.google.com",
  "gemini.google.com",
  "ai.google.dev",
  "makersuite.google.com",
  "aistudio.google.com",
  
  // Microsoft - Text/Code Generation
  "copilot.microsoft.com",
  "bing.com/chat",
  "chat.bing.com",
  
  // Perplexity - Text Generation & Search
  "perplexity.ai",
    "www.perplexity.ai",
  
    // BlackBox - Text Generation & Search
    "www.blackbox.ai",
    "blackbox.ai",

  // Meta AI - Text Generation
  "ai.meta.com",
  "www.meta.ai",
  "meta.ai",
  
  // DeepSeek - Text/Code Generation
  "chat.deepseek.com",
  "deepseek.com",
  "www.deepseek.com",
  "platform.deepseek.com",
  "coder.deepseek.com",
  "api.deepseek.com",
  
  // Mistral AI - Text Generation
  "chat.mistral.ai",
  "mistral.ai",
  "console.mistral.ai",
  "platform.mistral.ai",
  
  // xAI (Grok) - Text Generation
  "grok.x.ai",
  "x.ai",
  "chat.x.ai",
  
  // Character.ai - Text/Chat Generation
  "character.ai",
  "beta.character.ai",
  "plus.character.ai",
  
  // Hugging Face - Text/Code Models
  "huggingface.co",
  "hf.co",
  "chat.huggingface.co",
  
  // Code Generation AI
  "github.com/copilot",
  "copilot.github.com",
  "cursor.sh",
  "codeium.com",
  "tabnine.com",
  "aws.amazon.com/codewhisperer",
  "replit.com",
  "sourcegraph.com/cody",
  "cody.sourcegraph.com",
  "codex.openai.com",
  "blackbox.ai",
  "codegeex.cn",
  "www.codegeex.cn",
  "continue.dev",
  "www.continue.dev",
  
  // AI Language Models & APIs
  "cohere.ai",
  "dashboard.cohere.ai",
  "ai21.com",
  "studio.ai21.com",
  "openrouter.ai",
  "chat.openrouter.ai",
  "together.ai",
  "api.together.xyz",
  "replicate.com",
  "anyscale.com",
  "fireworks.ai",
  "console.fireworks.ai",
  "goose.ai",
  "beta.goose.ai",
  
  // Major Conversational AI Platforms (Core Only)
  "poe.com",
  "www.poe.com",
  "chat.lmsys.org",
  
  // AI Assistants (Core Only)
  "pi.ai",
  "heypi.com",
  "inflection.ai",
  "www.inflection.ai",
  
  // Additional Popular AI Platforms
  "you.com",
  "chat.you.com",
  "phind.com",
  "www.phind.com",
  "janitor.ai",
  "www.janitor.ai",
  "crushon.ai",
  "www.crushon.ai",
  "chai.ml",
  "www.chai.ml",
  "spicychat.ai",
  "www.spicychat.ai",
  "botify.ai",
  "www.botify.ai",
  "dopple.ai",
  "www.dopple.ai"
];

// Normalize domain (remove www.)
function normalizeDomain(domain) {
  return domain.replace(/^www\./, "");
}

let currentPlayingTabId = null;
let hasDetectedAI = false; // Track if AI has been detected
let isEnabled = true; // Track if the AI detector is enabled

// Initialize enabled state on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get('aiDetectorEnabled', (data) => {
    isEnabled = data.aiDetectorEnabled !== false; // Default to true
  });
});

chrome.runtime.onInstalled.addListener(() => {
  // Set default enabled state
  chrome.storage.sync.get('aiDetectorEnabled', (data) => {
    if (data.aiDetectorEnabled === undefined) {
      chrome.storage.sync.set({ aiDetectorEnabled: true });
      isEnabled = true;
    } else {
      isEnabled = data.aiDetectorEnabled;
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleDetector") {
    isEnabled = request.enabled;
    chrome.storage.sync.set({ aiDetectorEnabled: isEnabled });
    
    // If disabled, stop any current sounds
    if (!isEnabled) {
      stopAllSounds();
    }
    
    sendResponse({ success: true, enabled: isEnabled });
  } else if (request.action === "getDetectorStatus") {
    sendResponse({ enabled: isEnabled });
  }
  return true;
});

// Helper: check if a URL is injectable
function isInjectableUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http')) return false;
  if (url.includes('chrome://') || url.includes('chrome-extension://')) return false;
  return true;
}

// Inject content script on extension startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (tab.id && isInjectableUrl(tab.url)) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).catch(() => {});
      }
    }
  });
});

// Function to stop sound on previous tab
function stopPreviousSound() {
  if (currentPlayingTabId) {
    chrome.tabs.sendMessage(currentPlayingTabId, { action: "stopAlertSound" }, () => {
      if (chrome.runtime.lastError) {
        console.log("Previous tab not available to stop sound");
      }
    });
  }
}

// Function to play sound
function playSound(tabId) {
  // Stop sound on previous tab first
  stopPreviousSound();
  
  // Set new playing tab
  currentPlayingTabId = tabId;
  
  // Inject content script and play sound
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }).then(() => {
    chrome.tabs.sendMessage(tabId, { action: "playAlertSound" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Could not send play message:", chrome.runtime.lastError.message);
      } else {
        console.log("Alert sound started on tab:", tabId);
      }
    });
  }).catch(error => {
    console.warn("Could not inject content script:", error.message);
  });
}

// Listen when active tab changes
chrome.tabs.onActivated.addListener(activeInfo => {
  console.log("Tab activated:", activeInfo.tabId);
  chrome.tabs.get(activeInfo.tabId, tab => {
    checkDomain(tab, activeInfo.tabId);
  });
});

// Listen when a tab is updated (navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log("Tab updated:", tabId);
    checkDomain(tab, tabId);
  }
});

// Main function to check domain and play/stop sound
function checkDomain(tab, tabId) {
  // If detector is disabled, don't check anything
  if (!isEnabled) {
    return;
  }
  
  if (tab && tab.url && isInjectableUrl(tab.url)) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      const normalizedDomain = normalizeDomain(domain);
      
      console.log(`Checking tab domain: ${domain}`);
      
      // Check if current domain matches any AI domain
      const isAI = aiDomains.some(aiDomain => {
        return normalizedDomain === normalizeDomain(aiDomain);
      });
      
      // Check if this is the currently active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        const isActiveTab = activeTabs.length > 0 && activeTabs[0].id === tabId;
        
        if (isAI && isActiveTab) {
          console.log(`🚨 AI detected on ACTIVE tab: ${domain} - Playing sound`);
          playSound(tabId);
        } else if (!isAI && isActiveTab) {
          console.log(`✅ Not AI on ACTIVE tab: ${domain} - Stopping sound`);
          stopPreviousSound();
          currentPlayingTabId = null;
        } else if (isAI && !isActiveTab) {
          console.log(`🔍 AI detected on BACKGROUND tab: ${domain} - No action`);
        }
      });
      
    } catch (error) {
      console.error("Error checking domain:", error);
    }
  }
}

// Function to manually stop all sounds (can be called from popup or other triggers)
function stopAllSounds() {
  console.log("Manually stopping all sounds");
  stopPreviousSound();
  currentPlayingTabId = null;
  hasDetectedAI = false;
}
