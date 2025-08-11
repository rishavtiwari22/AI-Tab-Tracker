// Consistent AI domain list and normalization
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

function normalizeDomain(domain) {
  return domain.replace(/^www\./, "");
}

let isDetectorEnabled = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});

async function initializePopup() {
  // Get detector status
  const response = await chrome.runtime.sendMessage({ action: "getDetectorStatus" });
  isDetectorEnabled = response.enabled;
  
  updateToggleButton();
  await checkCurrentTab();
  
  // If detector is enabled, trigger a manual check in background script
  if (isDetectorEnabled) {
    chrome.runtime.sendMessage({ action: "checkCurrentTab" });
  }
}

function setupEventListeners() {
  document.getElementById('toggleBtn').addEventListener('click', toggleDetector);
}

async function toggleDetector() {
  isDetectorEnabled = !isDetectorEnabled;
  
  // Send message to background script
  const response = await chrome.runtime.sendMessage({
    action: "toggleDetector",
    enabled: isDetectorEnabled
  });
  
  if (response.success) {
    updateToggleButton();
    await checkCurrentTab();
    
    // Small delay then check again to ensure background script has processed
    setTimeout(async () => {
      await checkCurrentTab();
    }, 500);
  }
}

function updateToggleButton() {
  const button = document.getElementById('toggleBtn');
  const text = document.getElementById('toggleText');
  
  if (isDetectorEnabled) {
    button.className = 'toggle-button enabled';
    text.textContent = 'Detector ON';
  } else {
    button.className = 'toggle-button disabled';
    text.textContent = 'Detector OFF';
  }
}

async function checkCurrentTab() {
  const statusElement = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  
  if (!isDetectorEnabled) {
    statusElement.className = 'status checking';
    statusText.textContent = 'Detector is disabled';
    return;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const domain = url.hostname;
    const normalized = normalizeDomain(domain);
    const match = aiDomains.some(d => normalizeDomain(d) === normalized);
    
    if (match) {
      statusElement.className = 'status ai-detected';
      statusText.textContent = `AI DETECTED: ${domain}`;
    } else {
      statusElement.className = 'status safe-site';
      statusText.textContent = `Safe: ${domain}`;
    }
  } catch (error) {
    statusElement.className = 'status checking';
    statusText.textContent = 'Unable to check current tab';
  }
}
