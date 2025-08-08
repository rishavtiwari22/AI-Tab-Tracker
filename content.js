// content.js - Simple AI Alert System
console.log("Content script loaded on:", window.location.hostname);

// Prevent multiple injections
if (window.aiAlertSystemLoaded) {
  console.log("AI Alert System already loaded, skipping");
} else {
  window.aiAlertSystemLoaded = true;

  let currentAudio = null;
  let volumeMonitor = null;
  
  // Create audio with user interaction bypass
  function createAlertAudio() {
    const audio = new Audio();
    audio.src = chrome.runtime.getURL("alert.mp3");
    audio.volume = 0.8;
    audio.loop = true;
    audio.controls = false;
    audio.muted = false;
    audio.preload = 'auto';
    
    // Make volume unchangeable
    Object.defineProperty(audio, 'volume', {
      value: 0.8,
      writable: false,
      configurable: false
    });
    
    Object.defineProperty(audio, 'muted', {
      value: false, 
      writable: false,
      configurable: false
    });
    
    // Force audio to play even without user interaction
    audio.addEventListener('canplay', () => {
      console.log("Audio ready to play");
    });
    
    return audio;
  }
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    
    if (request.action === "playAlertSound") {
      console.log("Starting alert sound...");
      
      // Stop any existing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        console.log("Stopped previous audio");
      }
      
      // Clear volume monitor
      if (volumeMonitor) {
        clearInterval(volumeMonitor);
        volumeMonitor = null;
      }
      
      // Create new audio
      currentAudio = createAlertAudio();
      
      // Try to play immediately
      const playAttempt = () => {
        const playPromise = currentAudio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("Audio playing successfully");
            
            // Monitor volume every 100ms
            volumeMonitor = setInterval(() => {
              if (currentAudio && !currentAudio.paused) {
                try {
                  currentAudio.volume = 0.8;
                  currentAudio.muted = false;
                } catch (e) {
                  console.log("Volume control blocked:", e);
                }
              }
            }, 100);
            
            sendResponse({success: true});
          }).catch(error => {
            console.log("Play failed, trying workaround:", error.message);
            
            // Workaround: Create audio context to bypass restrictions
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                  setTimeout(() => playAttempt(), 100);
                });
              } else {
                // Try playing with lower volume first
                currentAudio.volume = 0.1;
                setTimeout(() => {
                  currentAudio.volume = 0.8;
                  currentAudio.play();
                }, 100);
              }
            } catch (contextError) {
              console.error("AudioContext workaround failed:", contextError);
              
              // Final fallback: Use document click simulation
              const clickEvent = new MouseEvent('click', {bubbles: true});
              document.dispatchEvent(clickEvent);
              setTimeout(() => currentAudio.play(), 50);
            }
            
            sendResponse({success: false, error: error.message});
          });
        } else {
          sendResponse({success: false, error: "Play promise undefined"});
        }
      };
      
      playAttempt();
    }
    
    if (request.action === "stopAlertSound") {
      console.log("Stopping alert sound...");
      
      if (volumeMonitor) {
        clearInterval(volumeMonitor);
        volumeMonitor = null;
      }
      
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        console.log("Audio stopped");
      }
      
      sendResponse({success: true});
    }
    
    return true; // Keep message channel open
  });
  
  // Block volume control keys
  document.addEventListener('keydown', function(event) {
    if (currentAudio && !currentAudio.paused) {
      const volumeKeys = [121, 122, 123, 174, 175, 176, 177, 178, 179];
      if (volumeKeys.includes(event.keyCode)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.log("Volume key blocked:", event.keyCode);
        return false;
      }
    }
  }, true);
  
  // Prevent system audio controls
  setInterval(() => {
    if (currentAudio && !currentAudio.paused) {
      try {
        currentAudio.volume = 0.8;
        currentAudio.muted = false;
      } catch (e) {
        // Silent fail
      }
    }
  }, 200);
  
  console.log("AI Alert System initialized");
}
