// Tutorial System
class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.highlightElement = null;
        this.tutorialSteps = [
            {
                title: "Welcome to PTPal!",
                description: "PTPal is your intelligent Physical Therapy Assistant. This tutorial will guide you through the key features of the app.",
                element: null,
                position: 'center'
            },
            {
                title: "Camera Controls",
                description: "Start by clicking the 'Start Camera' button to activate your webcam. Once started, you can stop it anytime with 'Stop Camera'. The camera will track your pose in real-time.",
                element: '#start-btn',
                position: 'bottom'
            },
            {
                title: "Pose Type Selection",
                description: "Select the type of exercise you want to practice from the dropdown menu. PTPal supports multiple exercises like Partial Squat, Heel Raises, Single Leg Stance, and more.",
                element: '#pose-type-select',
                position: 'bottom'
            },
            {
                title: "Real-time Feedback",
                description: "Click 'Start Real-time Feedback' to begin receiving instant feedback on your pose. The system will analyze your form and provide suggestions to improve your technique.",
                element: '#start-feedback-btn',
                position: 'bottom'
            },
            {
                title: "Score and Status",
                description: "Your performance is rated in real-time with a 1-5 star system displayed here. You'll also see a PASS or FAIL indicator based on your pose quality.",
                element: '.score-section',
                position: 'top'
            },
            {
                title: "Feedback Messages",
                description: "Specific feedback messages appear here to help you improve your form. Pay attention to these suggestions to enhance your exercise technique.",
                element: '.feedback-section',
                position: 'top'
            },
            {
                title: "Raw Pose Data",
                description: "For developers and advanced users, you can view the raw pose estimation data here. This shows all the landmark coordinates detected by the system.",
                element: '.pose-data-container',
                position: 'top'
            },
            {
                title: "You're All Set!",
                description: "You're ready to start using PTPal! Remember to position yourself fully in the camera frame for best results. Happy exercising!",
                element: null,
                position: 'center'
            }
        ];
        
        this.initializeElements();
        this.setupEventListeners();
        this.checkFirstVisit();
    }
    
    initializeElements() {
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.tutorialTitle = document.getElementById('tutorial-title');
        this.tutorialDescription = document.getElementById('tutorial-description');
        this.tutorialProgress = document.getElementById('tutorial-progress');
        this.prevBtn = document.getElementById('prev-tutorial-btn');
        this.nextBtn = document.getElementById('next-tutorial-btn');
        this.finishBtn = document.getElementById('finish-tutorial-btn');
        this.closeBtn = document.getElementById('close-tutorial-btn');
        this.startTutorialBtn = document.getElementById('start-tutorial-btn');
        this.skipTutorialBtn = document.getElementById('skip-tutorial-btn');
        this.restartTutorialBtn = document.getElementById('restart-tutorial-btn');
        this.tutorialFooter = document.querySelector('.tutorial-footer');
    }
    
    setupEventListeners() {
        this.startTutorialBtn.addEventListener('click', () => {
            this.hideWelcomeScreen();
            this.startTutorial();
        });
        
        this.skipTutorialBtn.addEventListener('click', () => {
            this.skipTutorial();
        });
        
        if (this.restartTutorialBtn) {
            this.restartTutorialBtn.addEventListener('click', () => {
                this.restartTutorial();
            });
        }
        
        this.prevBtn.addEventListener('click', () => this.prevStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.finishBtn.addEventListener('click', () => this.finishTutorial());
        this.closeBtn.addEventListener('click', () => this.finishTutorial());
        
        // Close tutorial on backdrop click
        document.getElementById('tutorial-backdrop').addEventListener('click', (e) => {
            if (e.target.id === 'tutorial-backdrop') {
                this.finishTutorial();
            }
        });
    }
    
    checkFirstVisit() {
        const hasSeenTutorial = localStorage.getItem('ptpal_tutorial_seen');
        if (!hasSeenTutorial) {
            // Show welcome screen
            this.welcomeScreen.classList.remove('hidden');
        } else {
            // Hide welcome screen immediately
            this.welcomeScreen.classList.add('hidden');
        }
    }
    
    hideWelcomeScreen() {
        this.welcomeScreen.classList.add('hidden');
    }
    
    skipTutorial() {
        localStorage.setItem('ptpal_tutorial_seen', 'true');
        this.hideWelcomeScreen();
    }
    
    startTutorial() {
        this.currentStep = 0;
        this.showTutorial();
        this.updateTutorialStep();
    }
    
    showTutorial() {
        this.tutorialOverlay.style.display = 'block';
        setTimeout(() => {
            this.tutorialOverlay.classList.add('active');
        }, 10);
    }
    
    hideTutorial() {
        this.tutorialOverlay.classList.remove('active');
        setTimeout(() => {
            this.tutorialOverlay.style.display = 'none';
            this.removeHighlight();
        }, 300);
    }
    
    updateTutorialStep() {
        const step = this.tutorialSteps[this.currentStep];
        
        // Update content
        this.tutorialTitle.textContent = step.title;
        this.tutorialDescription.textContent = step.description;
        this.tutorialProgress.textContent = `${this.currentStep + 1} / ${this.tutorialSteps.length}`;
        
        // Update buttons
        this.prevBtn.disabled = this.currentStep === 0;
        
        // Show finish button on last step
        const isLastStep = this.currentStep === this.tutorialSteps.length - 1;
        if (isLastStep) {
            this.tutorialFooter.classList.add('show-finish');
        } else {
            this.tutorialFooter.classList.remove('show-finish');
        }
        
        // Highlight element
        if (step.element) {
            const element = document.querySelector(step.element);
            if (element) {
                this.highlightElement(element, step.position);
            } else {
                this.removeHighlight();
            }
        } else {
            this.removeHighlight();
        }
        
        // Position popup
        this.positionPopup(step.position, step.element);
    }
    
    highlightElement(element, position) {
        this.removeHighlight();
        
        // Scroll element into view first
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait a bit for scroll to complete, then highlight
        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.className = 'tutorial-highlight pulse';
            highlight.style.position = 'fixed';
            highlight.style.left = `${rect.left}px`;
            highlight.style.top = `${rect.top}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            
            document.body.appendChild(highlight);
            this.highlightElement = highlight;
            
            // Update highlight position on scroll/resize
            const updateHighlight = () => {
                if (this.highlightElement && document.body.contains(highlight)) {
                    const newRect = element.getBoundingClientRect();
                    highlight.style.left = `${newRect.left}px`;
                    highlight.style.top = `${newRect.top}px`;
                    highlight.style.width = `${newRect.width}px`;
                    highlight.style.height = `${newRect.height}px`;
                }
            };
            
            window.addEventListener('scroll', updateHighlight, true);
            window.addEventListener('resize', updateHighlight);
            
            // Store cleanup function
            highlight._cleanup = () => {
                window.removeEventListener('scroll', updateHighlight, true);
                window.removeEventListener('resize', updateHighlight);
            };
        }, 300);
    }
    
    removeHighlight() {
        if (this.highlightElement) {
            // Clean up event listeners
            if (this.highlightElement._cleanup) {
                this.highlightElement._cleanup();
            }
            this.highlightElement.remove();
            this.highlightElement = null;
        }
    }
    
    positionPopup(position, elementSelector) {
        const popup = document.getElementById('tutorial-popup');
        
        if (position === 'center' || !elementSelector) {
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const element = document.querySelector(elementSelector);
        if (!element) {
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        // Use setTimeout to ensure popup is rendered before getting dimensions
        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            const spacing = 20;
            
            let top, left;
            
            switch (position) {
                case 'top':
                    top = rect.top - popupRect.height - spacing;
                    left = rect.left + (rect.width / 2) - (popupRect.width / 2);
                    break;
                case 'bottom':
                    top = rect.bottom + spacing;
                    left = rect.left + (rect.width / 2) - (popupRect.width / 2);
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - (popupRect.height / 2);
                    left = rect.left - popupRect.width - spacing;
                    break;
                case 'right':
                    top = rect.top + (rect.height / 2) - (popupRect.height / 2);
                    left = rect.right + spacing;
                    break;
                default:
                    top = rect.bottom + spacing;
                    left = rect.left + (rect.width / 2) - (popupRect.width / 2);
            }
            
            // Ensure popup stays within viewport
            const maxLeft = window.innerWidth - popupRect.width - 20;
            const maxTop = window.innerHeight - popupRect.height - 20;
            left = Math.max(20, Math.min(left, maxLeft));
            top = Math.max(20, Math.min(top, maxTop));
            
            popup.style.top = `${top}px`;
            popup.style.left = `${left}px`;
            popup.style.transform = 'none';
        }, 50);
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateTutorialStep();
        }
    }
    
    nextStep() {
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.currentStep++;
            this.updateTutorialStep();
        }
    }
    
    finishTutorial() {
        localStorage.setItem('ptpal_tutorial_seen', 'true');
        this.hideTutorial();
    }
    
    restartTutorial() {
        // Don't clear localStorage - just restart the tutorial
        this.currentStep = 0;
        this.startTutorial();
    }
}

function resolveApiBaseUrl() {
    if (window.__PTPAL_BACKEND__) {
        return window.__PTPAL_BACKEND__;
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//localhost:8001`;
}

// Eleven Labs Text-to-Speech Service with Queue Management
class TextToSpeechService {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl || resolveApiBaseUrl();
        this.audioQueue = [];
        this.isPlaying = false;
        this.currentAudio = null;
        this.enabled = true; // Can be toggled on/off
        this.lastSpokenTexts = new Map(); // Track recently spoken texts with timestamps to avoid duplicates
        this.deduplicationWindow = 2000; // Don't repeat same text within 2 seconds (reduced for real-time feedback)
        this.allAudioElements = []; // Track all audio elements we create
        this.abortController = null; // For canceling fetch requests
        this.speakingLock = false; // Lock to prevent overlapping speakImmediately calls
        this.pendingSpeech = null; // Store pending speech if one is already playing
    }
    
    /**
     * Enable or disable TTS
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearQueue();
        }
    }
    
    /**
     * Force stop all audio immediately - public method for external calls
     */
    forceStop() {
        console.log('[TTS] Force stop called');
        this.clearQueue();
    }
    
    /**
     * Speak text immediately without queue - waits for current audio to finish if playing
     * Used for time-sensitive feedback that shouldn't be delayed
     */
    async speakImmediately(text) {
        if (!this.enabled || !text || !text.trim()) {
            return;
        }
        
        // Clean up text - remove emojis and extra whitespace
        const cleanText = text.replace(/[💬👉💪⚠️🎯🔄]/g, '').trim();
        if (!cleanText) {
            return;
        }
        
        // Prevent overlapping calls - if already speaking, store this as pending
        if (this.speakingLock) {
            console.log('[TTS] Already speaking, storing as pending:', cleanText);
            this.pendingSpeech = cleanText; // Store the latest pending speech (overwrites previous)
            return;
        }
        
        console.log('[TTS] Speaking immediately (no queue):', cleanText);
        
        // Set lock to prevent overlapping calls
        this.speakingLock = true;
        
        try {
            // If audio is currently playing, wait for it to finish before starting new audio
            // This prevents cutting off audio mid-sentence
            if (this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended) {
                console.log('[TTS] Audio currently playing, waiting for it to finish...');
                try {
                    // Wait for current audio to finish using Promise
                    await new Promise((resolve) => {
                        // Set a timeout in case audio gets stuck
                        const timeout = setTimeout(() => {
                            console.warn('[TTS] Timeout waiting for audio to finish');
                            resolve(); // Continue anyway after 5 seconds
                        }, 5000);
                        
                        // Listen for ended event
                        if (this.currentAudio) {
                            const onEnded = () => {
                                clearTimeout(timeout);
                                resolve();
                            };
                            this.currentAudio.addEventListener('ended', onEnded, { once: true });
                            // Also check if it's already ended
                            if (this.currentAudio.ended) {
                                clearTimeout(timeout);
                                resolve();
                            }
                        } else {
                            clearTimeout(timeout);
                            resolve();
                        }
                    });
                    console.log('[TTS] Previous audio finished, starting new audio');
                } catch (error) {
                    console.error('[TTS] Error waiting for audio:', error);
                }
            }
            
            // Clear queue but don't stop current audio (it should have finished by now)
            this.audioQueue = [];
            // Don't clear lastSpokenTexts here - let deduplication work naturally
            
            // Set isPlaying to true so fetchAudio doesn't reject
            this.isPlaying = true;
            
            // Fetch and play immediately (allow fetch even if queue was cleared)
            const audioData = await this.fetchAudio(cleanText, true);
            
            if (audioData) {
                // Play audio immediately
                await this.playAudio(audioData);
            }
        } catch (error) {
            console.error('[TTS] Error in speakImmediately:', error);
        } finally {
            // Reset flags after audio finishes or errors
            this.isPlaying = false;
            this.speakingLock = false;
            console.log('[TTS] speakImmediately completed, lock released');
            
            // If there's pending speech, speak it now
            if (this.pendingSpeech) {
                const pending = this.pendingSpeech;
                this.pendingSpeech = null; // Clear before calling to avoid recursion
                console.log('[TTS] Processing pending speech:', pending);
                // Small delay to ensure current audio cleanup is complete
                setTimeout(() => {
                    this.speakImmediately(pending);
                }, 100);
            }
        }
    }
    
    /**
     * Clear the audio queue and stop current playback immediately
     */
    clearQueue() {
        console.log('[TTS] Clearing queue and stopping all audio');
        this.audioQueue = [];
        this.lastSpokenTexts.clear(); // Clear deduplication cache
        this.isPlaying = false; // Set flag first to prevent new audio from starting
        this.speakingLock = false; // Release lock to allow new speech
        this.pendingSpeech = null; // Clear any pending speech
        
        // Cancel any in-flight fetch requests
        if (this.abortController) {
            console.log('[TTS] Aborting in-flight fetch requests');
            this.abortController.abort();
            this.abortController = null;
        }
        
        // Stop all tracked audio elements
        this.allAudioElements.forEach(audio => {
            try {
                if (audio && !audio.paused) {
                    console.log('[TTS] Stopping tracked audio element');
                    audio.volume = 0;
                    audio.pause();
                    audio.currentTime = 0;
                    audio.src = '';
                    audio.load();
                }
            } catch (error) {
                console.error('[TTS] Error stopping tracked audio:', error);
            }
        });
        this.allAudioElements = [];
        
        // Aggressively stop current audio playback
        if (this.currentAudio) {
            try {
                const audio = this.currentAudio;
                console.log('[TTS] Stopping currentAudio, paused:', audio.paused, 'currentTime:', audio.currentTime);
                // Set volume to 0 first to mute immediately
                audio.volume = 0;
                // Pause the audio
                if (!audio.paused) {
                    audio.pause();
                }
                // Reset to beginning
                audio.currentTime = 0;
                // Clear source
                audio.src = '';
                audio.srcObject = null;
                // Load to stop buffering
                audio.load();
                // Remove from DOM if it was added
                if (audio.parentNode) {
                    audio.parentNode.removeChild(audio);
                }
            } catch (error) {
                console.error('[TTS] Error stopping audio:', error);
            }
            this.currentAudio = null;
        }
        
        // Also try to stop ANY audio elements that might be playing (nuclear option)
        // This is a fallback in case currentAudio reference is lost
        try {
            const allAudioElements = document.querySelectorAll('audio');
            allAudioElements.forEach(audio => {
                try {
                    if (!audio.paused || audio.src) {
                        console.log('[TTS] Force stopping audio element:', audio.src);
                        audio.volume = 0;
                        audio.pause();
                        audio.currentTime = 0;
                        if (audio.src && audio.src.startsWith('blob:')) {
                            URL.revokeObjectURL(audio.src);
                        }
                        audio.src = '';
                        audio.srcObject = null;
                        audio.load();
                    }
                } catch (err) {
                    // Ignore errors for individual elements
                }
            });
        } catch (error) {
            console.error('[TTS] Error stopping orphaned audio:', error);
        }
        
        console.log('[TTS] Queue cleared and audio stopped');
    }
    
    /**
     * Add text to the speech queue
     */
    async speak(text, priority = false) {
        if (!this.enabled || !text || !text.trim()) {
            console.log('[TTS] Skipping - service disabled or empty text');
            return;
        }
        
        // Clean up text - remove emojis and extra whitespace
        const cleanText = text.replace(/[💬👉💪⚠️🎯🔄]/g, '').trim();
        if (!cleanText) {
            console.log('[TTS] Skipping - text empty after cleaning');
            return;
        }
        
        // Check if we've spoken this text recently (deduplication)
        const now = Date.now();
        const lastSpokenTime = this.lastSpokenTexts.get(cleanText);
        
        if (lastSpokenTime && (now - lastSpokenTime) < this.deduplicationWindow) {
            const timeSinceLastSpoken = now - lastSpokenTime;
            console.log(`[TTS] Skipping duplicate text (spoken ${timeSinceLastSpoken}ms ago):`, cleanText);
            return; // Skip if already spoken recently
        }
        
        console.log('[TTS] Adding to queue:', cleanText, 'Priority:', priority);
        
        // Add to recently spoken map with timestamp
        this.lastSpokenTexts.set(cleanText, now);
        
        // Clean up old entries periodically
        for (const [text, timestamp] of this.lastSpokenTexts.entries()) {
            if (now - timestamp > this.deduplicationWindow * 2) {
                this.lastSpokenTexts.delete(text);
            }
        }
        
        if (priority) {
            // Add to front of queue for priority messages (like safety flags)
            this.audioQueue.unshift(cleanText);
        } else {
            this.audioQueue.push(cleanText);
        }
        
        // Start processing queue if not already playing
        if (!this.isPlaying) {
            this.processQueue();
        }
    }
    
    /**
     * Process the audio queue sequentially
     */
    async processQueue() {
        if (this.isPlaying || this.audioQueue.length === 0) {
            return;
        }
        
        this.isPlaying = true;
        console.log('[TTS] Starting to process queue, items:', this.audioQueue.length);
        
        while (this.audioQueue.length > 0 && this.isPlaying) {
            // Check if we should stop before processing next item
            if (!this.isPlaying) {
                console.log('[TTS] Stopping queue processing - isPlaying is false');
                break;
            }
            
            const text = this.audioQueue.shift();
            console.log('[TTS] Processing:', text);
            
            try {
                // Fetch audio from backend
                const audioData = await this.fetchAudio(text);
                
                // Check again after fetch (might have been cleared during fetch)
                if (!this.isPlaying) {
                    console.log('[TTS] Stopping - queue was cleared during fetch');
                    if (audioData) {
                        URL.revokeObjectURL(audioData);
                    }
                    break;
                }
                
                if (audioData) {
                    console.log('[TTS] Audio fetched, playing...');
                    // Play audio and wait for it to finish
                    await this.playAudio(audioData);
                    console.log('[TTS] Audio playback completed');
                } else {
                    console.warn('[TTS] No audio data returned for:', text);
                }
            } catch (error) {
                console.error('[TTS] Error processing audio:', error);
                // Continue with next item in queue even if one fails
            }
        }
        
        this.isPlaying = false;
        console.log('[TTS] Queue processing complete');
    }
    
    /**
     * Fetch audio from backend TTS endpoint
     */
    async fetchAudio(text, allowWhenNotPlaying = false) {
        // Check if we should stop before fetching (unless allowWhenNotPlaying is true for immediate speech)
        if (!this.isPlaying && !allowWhenNotPlaying) {
            console.log('[TTS] Not fetching - queue was cleared');
            return null;
        }
        
        // Create new abort controller for this request
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        
        try {
            console.log('[TTS] Fetching audio for text:', text.substring(0, 50) + '...');
            const response = await fetch(`${this.apiBaseUrl}/api/text-to-speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
                signal: signal // Add abort signal
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.message || `HTTP error! status: ${response.status}`;
                console.error('[TTS] API error:', errorMsg, errorData);
                throw new Error(errorMsg);
            }
            
            const data = await response.json();
            if (data.status === 'success' && data.audio) {
                console.log('[TTS] Successfully received audio data');
                // Convert base64 to blob
                const audioBlob = this.base64ToBlob(data.audio, data.format || 'audio/mpeg');
                return URL.createObjectURL(audioBlob);
            } else {
                const errorMsg = data.message || 'Failed to get audio';
                console.error('[TTS] Invalid response:', data);
                throw new Error(errorMsg);
            }
        } catch (error) {
            // Check if this was an abort
            if (error.name === 'AbortError') {
                console.log('[TTS] Fetch aborted - queue was cleared');
                return null;
            }
            console.error('[TTS] Error fetching TTS audio:', error);
            // Don't fail silently - log the full error
            if (error.message && error.message.includes('API key')) {
                console.error('[TTS] Eleven Labs API key may not be configured. Check backend/.env file');
            }
            return null;
        }
    }
    
    /**
     * Convert base64 string to Blob
     */
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }
    
    /**
     * Play audio and return a promise that resolves when playback completes
     */
    playAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            // Check if we should stop before starting new audio
            if (!this.isPlaying) {
                console.log('[TTS] Not playing - queue was cleared');
                URL.revokeObjectURL(audioUrl);
                resolve();
                return;
            }
            
            const audio = new Audio(audioUrl);
            this.currentAudio = audio;
            this.allAudioElements.push(audio); // Track this audio element
            
            // Store resolve/reject to handle cancellation
            audio._resolve = resolve;
            audio._reject = reject;
            audio._url = audioUrl;
            
            audio.onended = () => {
                console.log('[TTS] Audio playback ended');
                if (this.currentAudio === audio) {
                    URL.revokeObjectURL(audioUrl); // Clean up blob URL
                    this.currentAudio = null;
                }
                resolve();
            };
            
            audio.onerror = (error) => {
                // Don't log as error if we intentionally stopped it
                if (!this.isPlaying) {
                    console.log('[TTS] Audio error (expected - queue was cleared):', error);
                    URL.revokeObjectURL(audioUrl);
                    if (this.currentAudio === audio) {
                        this.currentAudio = null;
                    }
                    resolve(); // Resolve instead of reject since this is expected
                } else {
                    console.error('[TTS] Audio playback error:', error);
                    if (this.currentAudio === audio) {
                        URL.revokeObjectURL(audioUrl);
                        this.currentAudio = null;
                    }
                    reject(error);
                }
            };
            
            audio.onloadstart = () => {
                console.log('[TTS] Audio loading started');
            };
            
            audio.oncanplay = () => {
                console.log('[TTS] Audio ready to play');
            };
            
            audio.play().then(() => {
                console.log('[TTS] Audio play() called successfully');
            }).catch((playError) => {
                console.error('[TTS] Audio play() failed:', playError);
                // Common issue: browser autoplay policy - user interaction required
                if (playError.name === 'NotAllowedError') {
                    console.warn('[TTS] Browser blocked autoplay. User interaction may be required.');
                }
                reject(playError);
            });
        });
    }
    
    /**
     * Extract and speak feedback from LLM feedback object
     */
    speakFeedback(feedback) {
        if (!this.enabled || !feedback) {
            console.log('[TTS] Service disabled or no feedback provided');
            return;
        }
        
        console.log('[TTS] Processing feedback for speech:', feedback);
        
        const textsToSpeak = [];
        
        // Priority order: safety flags first, then summary, cues, encouragement
        if (feedback.safety_flags && feedback.safety_flags.length > 0) {
            feedback.safety_flags.forEach(flag => {
                if (flag && flag.trim()) {
                    textsToSpeak.push({ text: flag, priority: true });
                }
            });
        }
        
        if (feedback.summary && feedback.summary.trim()) {
            textsToSpeak.push({ text: feedback.summary, priority: false });
        }
        
        if (feedback.cues && feedback.cues.length > 0) {
            feedback.cues.forEach(cue => {
                // Try multiple possible fields
                const actionText = cue.action || cue.issue || (typeof cue === 'string' ? cue : null);
                if (actionText && actionText.trim()) {
                    textsToSpeak.push({ text: actionText, priority: false });
                }
            });
        }
        
        if (feedback.encouragement && feedback.encouragement.trim()) {
            textsToSpeak.push({ text: feedback.encouragement, priority: false });
        }
        
        // Fallback: if no structured feedback, try to extract any text
        if (textsToSpeak.length === 0) {
            // Try to find any string values in the feedback object
            for (const [key, value] of Object.entries(feedback)) {
                if (typeof value === 'string' && value.trim()) {
                    textsToSpeak.push({ text: value, priority: false });
                    break; // Just use the first string we find
                } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                    textsToSpeak.push({ text: value[0], priority: false });
                    break;
                }
            }
        }
        
        console.log('[TTS] Extracted texts to speak:', textsToSpeak);
        
        if (textsToSpeak.length === 0) {
            console.warn('[TTS] No text extracted from feedback object');
            return;
        }
        
        // Speak all texts in order
        textsToSpeak.forEach(({ text, priority }) => {
            this.speak(text, priority);
        });
    }
    
    /**
     * Speak basic feedback array
     */
    speakBasicFeedback(feedbackArray) {
        if (!this.enabled || !feedbackArray || feedbackArray.length === 0) {
            console.log('[TTS] Service disabled or no feedback array provided');
            return;
        }
        
        console.log('[TTS] Processing basic feedback array:', feedbackArray);
        
        feedbackArray.forEach(feedback => {
            this.speak(feedback);
        });
    }
}

// Enhanced REST approach with polling for real-time feedback
class RealTimeFeedbackREST {
    constructor(apiBaseUrl) {
        this.pollingInterval = null;
        this.isActive = false;
        this.currentPoseType = 'partial_squat';
        this.lastPoseData = null;
        this.backendUnavailable = false;
        this.backendWarningShown = false;
        this.apiBaseUrl = apiBaseUrl || resolveApiBaseUrl();
        this.lastFeedbackWasGood = null; // Track last feedback state for smart TTS
        
        // Initialize TTS service
        this.ttsService = new TextToSpeechService(this.apiBaseUrl);
        console.log('[TTS] TTS service initialized with API base URL:', this.apiBaseUrl);
        
        // UI elements
        this.poseTypeSelect = document.getElementById('pose-type-select');
        this.startFeedbackBtn = document.getElementById('start-feedback-btn');
        this.stopFeedbackBtn = document.getElementById('stop-feedback-btn');
        this.scoreValue = document.getElementById('score-value');
        this.passStatus = document.getElementById('pass-status');
        this.headerTitleArea = document.getElementById('header-title-area');
        this.headerFeedbackArea = document.getElementById('header-feedback-area');
        this.feedbackList = document.getElementById('feedback-list');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        if (this.poseTypeSelect) {
        this.poseTypeSelect.addEventListener('change', (e) => {
            this.currentPoseType = e.target.value;
        });
        }
        
        if (this.startFeedbackBtn) {
        this.startFeedbackBtn.addEventListener('click', () => {
            this.startRealTimeFeedback();
        });
        }
        
        if (this.stopFeedbackBtn) {
        this.stopFeedbackBtn.addEventListener('click', () => {
            this.stopRealTimeFeedback();
        });
        }
    }
    
    setLastPoseData(poseData) {
        this.lastPoseData = poseData;
    }
    
    startRealTimeFeedback() {
        if (this.isActive) return;
        
        this.isActive = true;
        if (this.poseTypeSelect) {
        this.currentPoseType = this.poseTypeSelect.value;
        }
        
        // Update UI
        if (this.startFeedbackBtn) this.startFeedbackBtn.disabled = true;
        if (this.stopFeedbackBtn) this.stopFeedbackBtn.disabled = false;
        if (this.poseTypeSelect) this.poseTypeSelect.disabled = true;
        
        // Clear previous feedback
        this.clearFeedback();
        
        // Reset feedback state tracking
        this.lastFeedbackWasGood = null;
        
        // Poll immediately for instant feedback, then continue with interval
        const pollForFeedback = async () => {
            // Check if we're still active before processing
            if (!this.isActive) {
                console.log('[Feedback] Polling stopped - feedback system is inactive');
                return;
            }
            
            if (this.lastPoseData && this.lastPoseData.poseLandmarks) {
                try {
                    const feedback = await this.validatePose(this.currentPoseType, this.lastPoseData);
                    // Double-check we're still active before displaying (race condition protection)
                    if (this.isActive) {
                        this.displayFeedback(feedback);
                    } else {
                        console.log('[Feedback] Skipping feedback display - system is inactive');
                    }
                } catch (error) {
                    if (this.backendUnavailable) {
                        this.showError('Real-time feedback is offline. Enable the PT backend and press Start again.');
                        this.stopRealTimeFeedback(true);
                    } else {
                    console.error('Error getting feedback:', error);
                    this.showError('Error getting feedback: ' + error.message);
                    }
                }
            }
        };
        
        // Make immediate call for instant feedback
        pollForFeedback();
        
        // Then start polling every 1 second for subsequent feedback
        this.pollingInterval = setInterval(pollForFeedback, 1000);
        
        console.log(`Started real-time feedback for ${this.currentPoseType} (immediate + interval)`);
    }
    
    stopRealTimeFeedback(preserveDisplay = false) {
        if (!this.isActive) {
            console.log('[Feedback] Already stopped, ignoring stopRealTimeFeedback call');
            return;
        }
        
        console.log('[Feedback] Stopping real-time feedback');
        
        // Set inactive flag FIRST to prevent new feedback from being processed
        this.isActive = false;
        
        // Reset feedback state tracking
        this.lastFeedbackWasGood = null;
        
        // Clear polling interval IMMEDIATELY to stop new requests
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('[Feedback] Polling interval cleared');
        }
        
        // Clear TTS queue AFTER stopping polling - use forceStop for maximum effect
        if (this.ttsService) {
            console.log('[TTS] Force stopping TTS in stopRealTimeFeedback');
            this.ttsService.forceStop();
        }
        
        // Update UI
        if (this.startFeedbackBtn) this.startFeedbackBtn.disabled = false;
        if (this.stopFeedbackBtn) this.stopFeedbackBtn.disabled = true;
        if (this.poseTypeSelect) this.poseTypeSelect.disabled = false;
        
        if (!preserveDisplay) {
        this.clearFeedback();
        }
        
        console.log('Stopped real-time feedback');
    }

    setPoseType(poseType) {
        this.currentPoseType = poseType;
        if (this.poseTypeSelect) {
            this.poseTypeSelect.value = poseType;
        }
    }
    
    async validatePose(poseType, results) {
        if (this.backendUnavailable) {
            throw new Error('PT backend unavailable');
        }
        
        try {
            // Get session ID from localStorage
            const sessionId = localStorage.getItem('ptpal_session_id') || null;
            
            const response = await fetch(`${this.apiBaseUrl}/api/validate-pose`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pose_type: poseType,
                landmarks: results.poseLandmarks,
                session_id: sessionId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
            
            if (this.backendUnavailable) {
                this.backendUnavailable = false;
                this.backendWarningShown = false;
            }
        
        return await response.json();
        } catch (error) {
            if (!this.backendWarningShown) {
                console.warn('Unable to reach PT backend for feedback:', error.message);
                this.backendWarningShown = true;
            }
            this.backendUnavailable = true;
            throw error;
        }
    }
    
    displayFeedback(feedback) {
        // Check if feedback system is still active before processing
        if (!this.isActive) {
            console.log('[Feedback] Skipping displayFeedback - system is inactive');
            return;
        }
        
        // Update score with star rating (1-5 scale)
        if (feedback.score) {
            const stars = '★'.repeat(feedback.score) + '☆'.repeat(5 - feedback.score);
            this.scoreValue.textContent = stars;
        } else {
            this.scoreValue.textContent = '--';
        }
        
        // Update pass/fail status
        this.updatePassStatus(feedback.pass);
        
        // Display LLM feedback in Tips section if available, otherwise show basic feedback
        console.log('Feedback received:', feedback);
        console.log('LLM Feedback:', feedback.llm_feedback);
        
        // Double-check we're still active before speaking (race condition protection)
        if (!this.isActive) {
            console.log('[Feedback] Skipping TTS - system became inactive');
            return;
        }
        
        if (feedback.llm_feedback) {
            console.log('Displaying LLM feedback');
            this.updateLLMFeedbackDisplay(feedback.llm_feedback);
            
            // Smart TTS logic based on feedback state transitions
            // Determine if current feedback is good (pass = true and score >= 4)
            const currentFeedbackIsGood = feedback.pass && feedback.score >= 4;
            
            // Smart TTS logic:
            // 1. If feedback is bad → speak corrections (cues from purple bubbles)
            // 2. If feedback is good → speak encouragement (always, regardless of previous state)
            let shouldSpeak = false;
            let textToSpeak = null;
            
            if (!currentFeedbackIsGood) {
                // Bad feedback - speak corrections (cues from purple bubbles)
                shouldSpeak = true;
                if (feedback.llm_feedback.cues && feedback.llm_feedback.cues.length > 0) {
                    // Only speak the first cue (action text from purple bubble)
                    const firstCue = feedback.llm_feedback.cues[0];
                    textToSpeak = firstCue.action || firstCue.issue || null;
                }
            } else if (currentFeedbackIsGood) {
                // Good feedback - always speak encouragement
                shouldSpeak = true;
                textToSpeak = feedback.llm_feedback.encouragement || 'Great job!';
            }
            
            // Update last feedback state
            this.lastFeedbackWasGood = currentFeedbackIsGood;
            
            // Speak immediately if needed (no queue to avoid delays)
            if (shouldSpeak && textToSpeak && this.isActive && this.ttsService) {
                console.log('[TTS] Speaking immediately:', textToSpeak, 'Reason: bad feedback =', !currentFeedbackIsGood, 'good feedback =', currentFeedbackIsGood);
                // Don't clear queue here - speakImmediately will handle waiting for current audio
                // This prevents cutting off audio that's currently playing
                this.ttsService.speakImmediately(textToSpeak);
            } else {
                console.log('[TTS] Skipping TTS - shouldSpeak:', shouldSpeak, 'textToSpeak:', textToSpeak, 'currentGood:', currentFeedbackIsGood, 'lastGood:', this.lastFeedbackWasGood);
            }
        } else {
            console.log('No LLM feedback, showing basic feedback');
            this.updateFeedbackList(feedback.feedback || []);
            // DO NOT speak basic feedback - only speak LLM/OpenAI feedback
            // Basic feedback contains numbers and technical details that shouldn't be spoken
            console.log('[TTS] Skipping basic feedback - only LLM feedback is spoken');
        }
        
        // Add visual feedback based on score
        this.updateScoreIndicator(feedback.score);
    }
    
    updatePassStatus(pass) {
        this.passStatus.textContent = pass ? 'PASS' : 'FAIL';
        this.passStatus.className = 'pass-indicator-badge ' + (pass ? 'pass' : 'fail');
    }
    
    updateFeedbackList(feedbackArray) {
        if (!this.feedbackList) return; // Guard against missing element
        
        if (feedbackArray.length === 0) {
            this.feedbackList.innerHTML = '<li>No specific feedback available</li>';
            return;
        }
        
        this.feedbackList.innerHTML = feedbackArray.map(f => `<li>${f}</li>`).join('');
    }
    
    updateMetricsDisplay(metrics) {
        if (!this.metricsDisplay) return;
        if (Object.keys(metrics).length === 0) {
            this.metricsDisplay.innerHTML = '<p>No metrics available yet</p>';
            return;
        }
        
        const metricsHtml = Object.entries(metrics)
            .map(([key, value]) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
                return `<div><strong>${formattedKey}:</strong> ${formattedValue}</div>`;
            })
            .join('');
        
        this.metricsDisplay.innerHTML = metricsHtml;
    }
    
    updateLLMFeedbackDisplay(llmFeedback) {
        if (!this.headerFeedbackArea || !this.headerTitleArea) return;
        
        if (!llmFeedback) {
            // Show title, hide feedback
            this.headerTitleArea.style.display = 'block';
            this.headerFeedbackArea.style.display = 'none';
            return;
        }
        
        // Hide title, show feedback
        this.headerTitleArea.style.display = 'none';
        this.headerFeedbackArea.style.display = 'block';
        
        let html = '';
        
        // Summary - keep it super short
        if (llmFeedback.summary) {
            html += `<p class="feedback-summary">💬 ${llmFeedback.summary}</p>`;
        }
        
        // Cues (actionable feedback) - simplified, inline
        if (llmFeedback.cues && llmFeedback.cues.length > 0) {
            html += '<div class="feedback-cues">';
            llmFeedback.cues.forEach(cue => {
                html += `<span class="feedback-cue">👉 ${cue.action}</span>`;
            });
            html += '</div>';
        }
        
        // Encouragement - simplified
        if (llmFeedback.encouragement) {
            html += `<p class="feedback-encouragement">💪 ${llmFeedback.encouragement}</p>`;
        }
        
        // Safety flags (if any) - simplified
        if (llmFeedback.safety_flags && llmFeedback.safety_flags.length > 0) {
            html += '<div class="feedback-safety">';
            llmFeedback.safety_flags.forEach(flag => {
                html += `<span class="feedback-warning">⚠️ ${flag}</span>`;
            });
            html += '</div>';
        }
        
        this.headerFeedbackArea.innerHTML = html;
    }
    
    updateScoreIndicator(score) {
        // No visual indicator needed - stars speak for themselves!
        // Score circle background has been removed
    }
    
    clearFeedback() {
        this.scoreValue.textContent = '--';
        this.passStatus.textContent = '--';
        this.passStatus.className = 'pass-indicator-badge neutral';
        
        // Restore title, hide feedback
        if (this.headerTitleArea && this.headerFeedbackArea) {
            this.headerTitleArea.style.display = 'block';
            this.headerFeedbackArea.style.display = 'none';
        }
    }
    
    showError(message) {
        if (!this.feedbackList) {
            console.error('Feedback list element not found:', message);
            return;
        }
        this.feedbackList.innerHTML = `<li style="color: #E53E3E; border-left-color: #E53E3E;">${message}</li>`;
    }
    
    // Method to enable/disable feedback based on camera status
    setCameraStatus(isStreaming) {
        if (this.startFeedbackBtn) {
        this.startFeedbackBtn.disabled = !isStreaming;
        }
        if (!isStreaming) {
            this.stopRealTimeFeedback();
        }
    }
}

class WebcamManager {
    constructor() {
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('output-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.statusText = document.getElementById('status-text');
        this.sessionStateLabel = document.getElementById('session-state-label');
        this.poseDataOutput = document.getElementById('pose-data-output');
        this.lastUpdate = document.getElementById('last-update');
        this.nextUpdate = document.getElementById('next-update');
        
        this.stream = null;
        this.isStreaming = false;
        this.pose = null;
        this.camera = null;
        this.permissionGranted = false;
        
        // Video mode support
        this.isVideoMode = false;
        this.videoFile = null;
        this.videoAnimationFrame = null;
        this.videoProcessingPending = false; // Track if we're waiting for pose results
        this.lastPoseResultTime = 0; // Track when we last got pose results
        this.videoFrameTimeout = null; // Timeout for video frame processing
        
        // Timer for 10-second updates
        this.updateTimer = null;
        this.nextUpdateTime = null;
        this.lastPoseData = null;
        
        // API / backend configuration
        this.apiBaseUrl = resolveApiBaseUrl();
        this.backendUnavailable = false;
        this.backendWarningShown = false;
        
        // Initialize real-time feedback system
        this.feedbackSystem = new RealTimeFeedbackREST(this.apiBaseUrl);
        
        // Out-of-frame detection variables
        this.lostFrames = 0;
        this.recentCenters = [];
        this.sideCounts = { left: 0, right: 0, top: 0, bottom: 0 };
        this.isOutOfFrame = false;
        this.isPartiallyOut = false;
        this.frameStatusMessage = null; // Store specific frame status message
        this.webcamContainer = document.querySelector('.webcam-container');
        this.stage = document.querySelector('.webcam-stage');
        this.resizeObserver = null;
        
        // Detection parameters (adapted from Python script)
        this.EDGE_MARGIN = 60;        // outer guide box
        this.SAFE_MARGIN = 40;       // inner safe zone
        this.PARTIAL_FRAMES = 2;     // delay to prevent flickering
        this.VIS_THRESH = 0.85;      // visibility threshold
        this.LOST_FRAMES_LIMIT = 10; // frames before declaring out of frame
        this.ENABLE_FRAME_DEBUG = false;
        
        this.initializeEventListeners();
        this.initializePose();
    }
    
    initializeEventListeners() {
        // Handle page unload to stop camera
        window.addEventListener('beforeunload', () => this.stopWebcam());
    }
    
    setupVideoMode() {
        // Add file input to session overlay
        const sessionConfig = document.getElementById('session-exercise-config');
        if (sessionConfig) {
            const fileInputContainer = document.createElement('div');
            fileInputContainer.className = 'video-upload-container';
            fileInputContainer.innerHTML = `
                <label for="video-file-input">Upload Video File</label>
                <input type="file" id="video-file-input" accept="video/*" style="margin-top: 0.5rem; width: 100%; padding: 0.5rem;">
                <p style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">Select a video file to analyze</p>
            `;
            sessionConfig.insertBefore(fileInputContainer, sessionConfig.firstChild);
            
            const fileInput = document.getElementById('video-file-input');
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.videoFile = file;
                    this.loadVideoFile(file);
                }
            });
        }
    }
    
    loadVideoFile(file) {
        const url = URL.createObjectURL(file);
        this.video.src = url;
        this.video.loop = true; // Loop video for demo mode
        this.video.muted = true; // Mute audio for demo mode
        this.video.onloadedmetadata = () => {
            // Only create new session if one doesn't exist
            let sessionId = localStorage.getItem('ptpal_session_id');
            if (!sessionId) {
                const newSessionId = this.createNewSession();
                this.notifyNewSession(newSessionId);
            }
            
            // Setup canvas first
            this.setupCanvas();
            
            // Wait a bit for video to be fully ready, then play and start processing
            setTimeout(() => {
                this.video.play().then(() => {
                    // Wait one more frame to ensure video is rendering
                    requestAnimationFrame(() => {
                        this.isStreaming = true;
                        this.updateStatus('Video loaded - BlazePose running', 'success');
                        this.feedbackSystem.setCameraStatus(true);
                        this.startVideoProcessing();
                        this.startUpdateTimer();
                        console.log('[Video] Video loaded and processing started', {
                            width: this.video.videoWidth,
                            height: this.video.videoHeight,
                            readyState: this.video.readyState
                        });
                    });
                }).catch(err => {
                    console.error('[Video] Error playing video:', err);
                    this.updateStatus('Error playing video: ' + err.message, 'error');
                });
            }, 100); // Small delay to ensure video metadata is fully loaded
        };
        
        // Handle video errors
        this.video.onerror = (e) => {
            console.error('[Video] Video error:', e);
            this.updateStatus('Error loading video file', 'error');
        };
    }
    
    startVideoProcessing() {
        // Stop any existing processing
        if (this.videoAnimationFrame) {
            cancelAnimationFrame(this.videoAnimationFrame);
        }
        if (this.videoFrameTimeout) {
            clearTimeout(this.videoFrameTimeout);
        }
        
        // Process video frames at a very slow rate to avoid memory issues
        // We'll only send the next frame after receiving results from the previous one
        const MIN_FRAME_INTERVAL = 100; // Minimum 100ms between frames (10 FPS max)
        let lastFrameSentTime = 0;
        let consecutiveErrors = 0;
        
        const sendNextFrame = () => {
            if (!this.isStreaming || !this.pose || !this.video) {
                return;
            }
            
            // Don't send if we're still waiting for results from previous frame
            if (this.videoProcessingPending) {
                // Check if we've been waiting too long (timeout after 2 seconds)
                const waitTime = Date.now() - this.lastPoseResultTime;
                if (waitTime > 2000 && this.lastPoseResultTime > 0) {
                    console.warn('[Video] Pose processing timeout, resetting');
                    this.videoProcessingPending = false;
                } else {
                    // Try again in a bit
                    this.videoFrameTimeout = setTimeout(sendNextFrame, 50);
                    return;
                }
            }
            
            // Ensure enough time has passed since last frame
            const timeSinceLastFrame = Date.now() - lastFrameSentTime;
            if (timeSinceLastFrame < MIN_FRAME_INTERVAL) {
                this.videoFrameTimeout = setTimeout(sendNextFrame, MIN_FRAME_INTERVAL - timeSinceLastFrame);
                return;
            }
            
            // Ensure video is ready and has valid dimensions
            const isVideoReady = this.video.readyState >= 4 && // HAVE_ENOUGH_DATA
                               this.video.videoWidth > 0 &&
                               this.video.videoHeight > 0 &&
                               !this.video.ended;
            
            if (isVideoReady) {
                // Ensure video is playing
                if (this.video.paused) {
                    this.video.play().catch(err => {
                        console.warn('[Video] Play failed:', err);
                    });
                }
                
                // Send frame for pose detection with error handling
                try {
                    this.videoProcessingPending = true;
                    this.pose.send({ image: this.video });
                    lastFrameSentTime = Date.now();
                    consecutiveErrors = 0; // Reset error count on success
                    
                    // Schedule next frame after a delay
                    this.videoFrameTimeout = setTimeout(sendNextFrame, MIN_FRAME_INTERVAL);
                } catch (err) {
                    console.error('[Video] Error in pose.send:', err);
                    consecutiveErrors++;
                    this.videoProcessingPending = false;
                    
                    // If we get errors, wait longer before retrying
                    const retryDelay = Math.min(500, 100 * consecutiveErrors);
                    this.videoFrameTimeout = setTimeout(sendNextFrame, retryDelay);
                    
                    if (consecutiveErrors >= 5) {
                        console.error('[Video] Too many consecutive errors, stopping video processing');
                        this.updateStatus('Video processing error - too many failures', 'error');
                        this.isStreaming = false;
                    }
                }
            } else {
                // Video not ready, try again soon
                this.videoFrameTimeout = setTimeout(sendNextFrame, 100);
            }
        };
        
        // Start processing after a short delay
        this.videoFrameTimeout = setTimeout(sendNextFrame, 200);
    }
    
    async initializePose() {
        try {
            this.updateStatus('Loading BlazePose model...', 'loading');
            
            // Wait for MediaPipe to be available
            await this.waitForMediaPipe();
            
            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`;
                }
            });
        
            
            // BlazePose configuration settings for best accuracy
            this.pose.setOptions({
                modelComplexity: 2, // BlazePose Heavy
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.pose.onResults((results) => this.onPoseResults(results));
            
            console.log('BlazePose initialized successfully');
            this.updateStatus('BlazePose ready - follow the session prompts to begin.', 'success');
        } catch (error) {
            console.error('Error initializing BlazePose:', error);
            this.updateStatus('Error loading BlazePose: ' + error.message, 'error');
        }
    }
    
waitForMediaPipe() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 200;
    const check = () => {
      attempts++;
      const hasPose = typeof window.Pose   !== 'undefined';
      const hasCamera = typeof window.Camera !== 'undefined';
      if (hasPose && hasCamera) {
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('Pose defined?', hasPose, 'Camera defined?', hasCamera);
        reject(new Error('MediaPipe failed to load after 20 seconds.'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

    async requestCameraPermission() {
        if (this.permissionGranted) {
            return true;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.updateStatus('Camera not supported in this browser.', 'error');
            throw new Error('Media devices unavailable');
        }
        
        try {
            this.updateStatus('Requesting camera permission...', 'loading');
            const tempStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            tempStream.getTracks().forEach(track => track.stop());
            this.permissionGranted = true;
            this.updateStatus('Camera permission granted. Click Start Session to begin.', 'success');
            return true;
        } catch (error) {
            this.handleCameraError(error);
            throw error;
        }
    }
    
    async ensureCameraStarted() {
        if (this.isStreaming) {
            return;
        }
        if (this.isVideoMode) {
            // In video mode, wait for user to select a video file
            this.updateStatus('Please select a video file to begin', 'info');
            return Promise.resolve();
        }
        await this.startWebcam();
}

    
    async startWebcam() {
        if (this.isStreaming) {
            return Promise.resolve();
        }
        
        // If in video mode and video file is already loaded, just start processing
        if (this.isVideoMode && this.videoFile && this.video.src) {
            // Ensure video is playing
            if (this.video.paused || this.video.ended) {
                this.video.currentTime = 0; // Reset to start
                this.video.play().catch(err => {
                    console.warn('Video play failed:', err);
                });
            }
            this.isStreaming = true;
            this.feedbackSystem.setCameraStatus(true);
            this.startVideoProcessing();
            return Promise.resolve();
        }
        
        return new Promise(async (resolve, reject) => {
        try {
                this.updateStatus('Starting camera...', 'loading');
            
            // Only create new session if one doesn't exist
            // (Session creation is now handled by GuidedSessionModal when starting exercise)
            let sessionId = localStorage.getItem('ptpal_session_id');
            if (!sessionId) {
                const newSessionId = this.createNewSession();
                this.notifyNewSession(newSessionId);
            }
            
                if (!this.permissionGranted) {
                    await this.requestCameraPermission();
                }
                
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            this.video.srcObject = this.stream;
            
            this.video.onloadedmetadata = () => {
                this.video.play();
                this.setupCanvas();
                this.isStreaming = true;
                this.updateStatus('Camera active - BlazePose running', 'success');
                
                this.feedbackSystem.setCameraStatus(true);
                this.initializeCamera();
                this.startUpdateTimer();
                    resolve();
            };
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.handleCameraError(error);
                reject(error);
        }
        });
    }
    
    initializeCamera() {
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                if (this.isStreaming && this.pose) {
                    await this.pose.send({ image: this.video });
                }
            },
            width: 640,
            height: 480
        });
        this.camera.start();
    }
    
    onPoseResults(results) {
        if (!this.isStreaming) return;
        
        // For video mode, mark that we've received results and can process next frame
        if (this.isVideoMode) {
            this.videoProcessingPending = false;
            this.lastPoseResultTime = Date.now();
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pose landmarks and connections
        if (results.poseLandmarks) {
            // Pose overlay disabled for cleaner view
            // this.drawPoseLandmarks(results.poseLandmarks);
            // this.drawPoseConnections(results.poseLandmarks);
            // this.drawPoseAvatar(results.poseLandmarks);
            // Check for out-of-frame detection
            this.checkOutOfFrame(results.poseLandmarks);
        } else {
            // No pose detected - increment lost frames
            this.lostFrames++;
            this.handleNoPoseDetected();
        }
        
        // Store the latest pose data - EXACT BlazePose format
        this.lastPoseData = results;

        // Update feedback system with latest pose data
        this.feedbackSystem.setLastPoseData(results);

        // Send data to Python backend for storage and processing
        this.sendPoseDataToBackend(results);
    }
    
    drawPoseLandmarks(landmarks) {
        this.ctx.fillStyle = '#7ED321';
        this.ctx.strokeStyle = '#7ED321';
        this.ctx.lineWidth = 0.75;
        
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Add landmark index for debugging
            this.ctx.fillStyle = '#4A90E2';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(index.toString(), x + 6, y - 6);
            this.ctx.fillStyle = '#7ED321';
        });
    }
    drawPoseAvatar(landmarks) {
        this.ctx.fillStyle = '#4A90E2';
        const x = landmarks[0].x * this.canvas.width;
        const y = landmarks[0].y * this.canvas.height;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.canvas.width/8, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
    }
    
    drawPoseConnections(landmarks) {
        const connections = [
            // Face
            [0, 1], [1, 2], [2, 3], [3, 7],
            [0, 4], [4, 5], [5, 6], [6, 8],
            // Torso
            [9, 10], [11, 12], [11, 13], [13, 15],
            [12, 14], [14, 16], [11, 23], [12, 24],
            [23, 24],
            // Left arm
            [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
            [17, 19], [19, 21],
            // Right arm
            [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
            [18, 20], [20, 22],
            // Left leg
            [23, 25], [25, 27], [27, 29], [27, 31],
            [29, 31],
            // Right leg
            [24, 26], [26, 28], [28, 30], [28, 32],
            [30, 32]
        ];
        
        this.ctx.strokeStyle = '#4A90E2';
        this.ctx.lineWidth = Math.max(2, this.canvas.width / 140);
        
        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    landmarks[start].x * this.canvas.width,
                    landmarks[start].y * this.canvas.height
                );
                this.ctx.lineTo(
                    landmarks[end].x * this.canvas.width,
                    landmarks[end].y * this.canvas.height
                );
                this.ctx.stroke();
            }
        });
    }
    
    startUpdateTimer() {
        if (!this.poseDataOutput) return;
        // Clear any existing timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        // Set next update time
        this.nextUpdateTime = new Date(Date.now() + 10000);
        this.updateNextUpdateDisplay();
        
        // Start the 10-second timer
        this.updateTimer = setInterval(() => {
            this.updatePoseDataDisplay();
            this.nextUpdateTime = new Date(Date.now() + 10000);
            this.updateNextUpdateDisplay();
        }, 10000);
        
        // Update immediately
        this.updatePoseDataDisplay();
    }
    
    updatePoseDataDisplay() {
        if (!this.poseDataOutput || !this.lastUpdate) return;
        if (this.lastPoseData) {
            const timestamp = new Date().toLocaleTimeString();
            this.lastUpdate.textContent = timestamp;
            
            // Format the pose data for display
            const formattedData = this.formatPoseData(this.lastPoseData);
            this.poseDataOutput.textContent = formattedData;
        } else {
            this.poseDataOutput.textContent = 'No pose data available. Make sure you are visible in the camera.';
        }
    }
    
    formatPoseData(results) {
        let output = `=== BLAZEPOSE RAW OUTPUT ===\n`;
        output += `Timestamp: ${new Date().toLocaleTimeString()}\n`;
        output += `Pose Detected: ${results.poseLandmarks ? 'YES' : 'NO'}\n`;
        output += `World Landmarks: ${results.poseWorldLandmarks ? 'YES' : 'NO'}\n`;
        output += `Segmentation Mask: ${results.segmentationMask ? 'YES' : 'NO'}\n\n`;
        
        if (results.poseLandmarks) {
            output += `=== POSE LANDMARKS (${results.poseLandmarks.length} points) ===\n`;
            output += `Format: [index] x, y, z, visibility\n\n`;
            
            results.poseLandmarks.forEach((landmark, index) => {
                output += `[${index.toString().padStart(2, '0')}] `;
                output += `x: ${landmark.x.toFixed(6).padStart(10)} `;
                output += `y: ${landmark.y.toFixed(6).padStart(10)} `;
                output += `z: ${landmark.z.toFixed(6).padStart(10)} `;
                output += `visibility: ${landmark.visibility.toFixed(6)}\n`;
            });
            
            output += `\n=== WORLD LANDMARKS (${results.poseWorldLandmarks ? results.poseWorldLandmarks.length : 0} points) ===\n`;
            if (results.poseWorldLandmarks) {
                results.poseWorldLandmarks.forEach((landmark, index) => {
                    output += `[${index.toString().padStart(2, '0')}] `;
                    output += `x: ${landmark.x.toFixed(6).padStart(10)} `;
                    output += `y: ${landmark.y.toFixed(6).padStart(10)} `;
                    output += `z: ${landmark.z.toFixed(6).padStart(10)} `;
                    output += `visibility: ${landmark.visibility.toFixed(6)}\n`;
                });
            } else {
                output += `No world landmarks available\n`;
            }
            
            output += `\n=== LANDMARK NAMES ===\n`;
            const landmarkNames = [
                'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
                'right_eye_inner', 'right_eye', 'right_eye_outer',
                'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
                'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
                'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
                'left_index', 'right_index', 'left_thumb', 'right_thumb',
                'left_hip', 'right_hip', 'left_knee', 'right_knee',
                'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
                'left_foot_index', 'right_foot_index'
            ];
            
            landmarkNames.forEach((name, index) => {
                if (index < results.poseLandmarks.length) {
                    const landmark = results.poseLandmarks[index];
                    output += `[${index.toString().padStart(2, '0')}] ${name.padEnd(20)} `;
                    output += `(${landmark.x.toFixed(6)}, ${landmark.y.toFixed(6)}, ${landmark.z.toFixed(6)}) `;
                    output += `vis: ${landmark.visibility.toFixed(6)}\n`;
                }
            });
            
            output += `\n=== RAW JSON OUTPUT ===\n`;
            output += JSON.stringify(results, null, 2);
        } else {
            output += `No pose landmarks detected. Make sure you are visible in the camera frame.`;
        }
        
        return output;
    }
    
    updateNextUpdateDisplay() {
        if (this.nextUpdateTime && this.nextUpdate) {
            const now = new Date();
            const timeUntilUpdate = Math.max(0, this.nextUpdateTime - now);
            const seconds = Math.ceil(timeUntilUpdate / 1000);
            this.nextUpdate.textContent = `${seconds}s`;
        }
    }
    
    stopWebcam() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        
        // Stop video animation frame if running
        if (this.videoAnimationFrame) {
            cancelAnimationFrame(this.videoAnimationFrame);
            this.videoAnimationFrame = null;
        }
        
        // Stop video frame timeout if running
        if (this.videoFrameTimeout) {
            clearTimeout(this.videoFrameTimeout);
            this.videoFrameTimeout = null;
        }
        
        // Reset video processing state
        this.videoProcessingPending = false;
        
        // Clear update timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        
        if (this.isVideoMode) {
            // In video mode, pause video and clear src
            if (this.video) {
                this.video.pause();
                if (this.video.src && this.video.src.startsWith('blob:')) {
                    URL.revokeObjectURL(this.video.src);
                }
                this.video.src = '';
            }
        } else {
            this.video.srcObject = null;
        }
        this.isStreaming = false;
        
        // Disable feedback system
        this.feedbackSystem.setCameraStatus(false);
        
        // Clear current session data from localStorage (but keep in SQLite)
        localStorage.removeItem('ptpal_session_id');
        console.log('Session ended - data collection stopped');
        
        this.updateStatus('Camera stopped', 'info');
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset pose data display
        if (this.poseDataOutput) {
        this.poseDataOutput.textContent = 'No pose data available yet. Start the camera to begin pose estimation.';
        }
        if (this.lastUpdate) {
        this.lastUpdate.textContent = 'Never';
        }
        if (this.nextUpdate) {
        this.nextUpdate.textContent = '--';
        }
        this.lastPoseData = null;
        
        // Reset frame detection state
        this.lostFrames = 0;
        this.recentCenters = [];
        this.sideCounts = { left: 0, right: 0, top: 0, bottom: 0 };
        this.isOutOfFrame = false;
        this.isPartiallyOut = false;
        
        // Reset webcam container border
        this.webcamContainer.classList.remove('in-frame', 'partially-out', 'out-of-frame');

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

    }
    
    setupCanvas() {
        if (!this.video.videoWidth || !this.video.videoHeight) {
            return;
        }

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Stage keeps fixed 16:9 aspect ratio via CSS

        this.matchCanvasToStage();
        this.observeStageResize();
    }

    matchCanvasToStage() {
        if (!this.stage) {
            return;
        }

        const rect = this.stage.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        const needResize =
            Math.round(this.canvas.width / scale) !== Math.round(rect.width) ||
            Math.round(this.canvas.height / scale) !== Math.round(rect.height);

        if (needResize) {
            this.canvas.width = rect.width * scale;
            this.canvas.height = rect.height * scale;
        }

        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.video.style.width = rect.width + 'px';
        this.video.style.height = rect.height + 'px';
    }

    observeStageResize() {
        if (!window.ResizeObserver || !this.stage || this.resizeObserver) {
            return;
        }

        this.resizeObserver = new ResizeObserver(() => this.matchCanvasToStage());
        this.resizeObserver.observe(this.stage);
    }
    
    updateStatus(message, type = 'info') {
        if (this.statusText) {
            this.statusText.textContent = message;
            this.statusText.className = '';
        }
        if (this.sessionStateLabel) {
            this.sessionStateLabel.textContent = message;
        }
        
        switch (type) {
            case 'loading':
                if (this.statusText) {
                    this.statusText.innerHTML = `<span class="loading"></span>${message}`;
                }
                break;
            case 'success':
                if (this.statusText) this.statusText.style.color = '#7ED321';
                break;
            case 'error':
                if (this.statusText) this.statusText.style.color = '#E53E3E';
                break;
            case 'warning':
                if (this.statusText) this.statusText.style.color = '#FFA500';
                break;
            case 'info':
                if (this.statusText) this.statusText.style.color = '#4A90E2';
                break;
        }
    }
    
    handleCameraError(error) {
        let errorMessage = 'Camera access failed. ';
        
        switch (error.name) {
            case 'NotAllowedError':
                errorMessage += 'Please allow camera access and refresh the page.';
                break;
            case 'NotFoundError':
                errorMessage += 'No camera found. Please connect a camera.';
                break;
            case 'NotReadableError':
                errorMessage += 'Camera is already in use by another application.';
                break;
            default:
                errorMessage += 'Unknown error occurred. Please try again.';
        }
        
        this.updateStatus(errorMessage, 'error');
        this.updateButtons(false);
    }
    
    // Out-of-frame detection methods
    checkOutOfFrame(landmarks) {
        this.lostFrames = 0; // Reset lost frames since we have a pose
        
        // First, check if head-to-waist landmarks are visible and in frame
        const headToWaistStatus = this.checkHeadToWaistInFrame(landmarks);
        if (!headToWaistStatus.isValid) {
            // Head-to-waist not fully visible - show partially out
            this.isPartiallyOut = true;
            this.isOutOfFrame = false;
            this.frameStatusMessage = headToWaistStatus.message; // Store specific message
            this.updateFrameStatus();
            return;
        }
        
        // Clear frame status message if head-to-waist is valid
        this.frameStatusMessage = null;
        
        // Calculate bounding box from pose landmarks
        const bounds = this.calculatePoseBounds(landmarks);
        if (!bounds) {
            this.isPartiallyOut = true;
            this.isOutOfFrame = false;
            this.frameStatusMessage = 'PARTIALLY OUT OF FRAME - Lower camera or step back';
            this.updateFrameStatus();
            return;
        }
        
        const { x, y, width, height, centerX, centerY } = bounds;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Store recent center for tracking
        this.recentCenters.push({ x: centerX, y: centerY });
        if (this.recentCenters.length > 15) {
            this.recentCenters.shift();
        }
        
        // Check if pose is partially out of safe zone
        const sidesCrossed = this.checkSidesCrossed(x, y, width, height, canvasWidth, canvasHeight);
        
        // Update side counts with smoothing - reset if no sides crossed
        if (sidesCrossed.length === 0) {
            // If no sides crossed, reset all counts
            for (const side of ['left', 'right', 'top', 'bottom']) {
                this.sideCounts[side] = 0;
            }
        } else {
            // If sides are crossed, increment those sides
            for (const side of sidesCrossed) {
                this.sideCounts[side] += 2;
            }
            // Decrement non-crossed sides
            for (const side of ['left', 'right', 'top', 'bottom']) {
                if (!sidesCrossed.includes(side)) {
                    this.sideCounts[side] = Math.max(0, this.sideCounts[side] - 1);
                }
            }
        }
        
        const hasSideIssues = ['left', 'right', 'top', 'bottom'].some(
            (side) => this.sideCounts[side] >= this.PARTIAL_FRAMES * 2
        );
        
        // Check visibility ratio
        const visibilityRatio = this.calculateVisibilityRatio(x, y, width, height, canvasWidth, canvasHeight);
        if (this.ENABLE_FRAME_DEBUG) {
        console.log('Visibility ratio:', visibilityRatio, 'Threshold:', this.VIS_THRESH);
        }
        
        const visibilityIssue = visibilityRatio < this.VIS_THRESH;
        this.isPartiallyOut = hasSideIssues || visibilityIssue;
        
        // Clear frame status message if all checks pass
        if (!this.isPartiallyOut) {
            this.frameStatusMessage = null;
        }
        
        if (this.ENABLE_FRAME_DEBUG && visibilityIssue) {
            console.log('Partially out due to low visibility ratio');
        }
        
        if (this.ENABLE_FRAME_DEBUG) {
        console.log('Final frame status:', {
            isPartiallyOut: this.isPartiallyOut,
            sidesCrossed: sidesCrossed,
            sideCounts: this.sideCounts,
            visibilityRatio: visibilityRatio
        });
        }
        
        this.isOutOfFrame = false;
        this.updateFrameStatus();
    }
    
    // Check if head-to-waist landmarks are visible and within frame
    checkHeadToWaistInFrame(landmarks) {
        if (!landmarks || landmarks.length < 33) {
            return { 
                isValid: false, 
                reason: 'Not enough landmarks',
                message: 'PARTIALLY OUT OF FRAME - Please center yourself'
            };
        }
        
        // BlazePose landmark indices for head-to-waist
        const REQUIRED_LANDMARKS = {
            nose: 0,
            leftShoulder: 11,
            rightShoulder: 12,
            leftHip: 23,
            rightHip: 24
        };
        
        const MIN_VISIBILITY = 0.5; // Minimum visibility threshold
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Track which landmarks are missing
        const missingUpperBody = []; // nose, shoulders
        const missingLowerBody = []; // hips
        const outOfBoundsUpperBody = [];
        const outOfBoundsLowerBody = [];
        
        // Check each required landmark
        for (const [name, index] of Object.entries(REQUIRED_LANDMARKS)) {
            const landmark = landmarks[index];
            const isUpperBody = name === 'nose' || name === 'leftShoulder' || name === 'rightShoulder';
            
            // Check if landmark exists and is visible
            if (!landmark || landmark.visibility < MIN_VISIBILITY) {
                if (this.ENABLE_FRAME_DEBUG) {
                    console.log(`Head-to-waist check failed: ${name} not visible (visibility: ${landmark?.visibility || 0})`);
                }
                if (isUpperBody) {
                    missingUpperBody.push(name);
                } else {
                    missingLowerBody.push(name);
                }
                continue;
            }
            
            // Convert normalized coordinates to pixel coordinates
            const x = landmark.x * canvasWidth;
            const y = landmark.y * canvasHeight;
            
            // Check if landmark is within safe frame boundaries
            const isOutOfBounds = x < this.SAFE_MARGIN || x > canvasWidth - this.SAFE_MARGIN ||
                y < this.SAFE_MARGIN || y > canvasHeight - this.SAFE_MARGIN;
            
            if (isOutOfBounds) {
                if (this.ENABLE_FRAME_DEBUG) {
                    console.log(`Head-to-waist check failed: ${name} out of bounds (x: ${x.toFixed(1)}, y: ${y.toFixed(1)})`);
                }
                // Check if it's out of bounds at the bottom (likely need to lower camera)
                if (y > canvasHeight - this.SAFE_MARGIN) {
                    if (isUpperBody) {
                        outOfBoundsUpperBody.push(name);
                    } else {
                        outOfBoundsLowerBody.push(name);
                    }
                } else {
                    // Out of bounds on other sides
                    if (isUpperBody) {
                        outOfBoundsUpperBody.push(name);
                    } else {
                        outOfBoundsLowerBody.push(name);
                    }
                }
            }
        }
        
        // Determine the appropriate message based on what's missing
        if (missingLowerBody.length > 0 || outOfBoundsLowerBody.length > 0) {
            // Hips are missing or out of bounds - need to lower camera or step back
            return { 
                isValid: false, 
                reason: 'Hips not visible or out of bounds',
                message: 'PARTIALLY OUT OF FRAME - Lower camera or step back'
            };
        } else if (missingUpperBody.length > 0 || outOfBoundsUpperBody.length > 0) {
            // Head/shoulders are missing or out of bounds
            return { 
                isValid: false, 
                reason: 'Head/shoulders not visible or out of bounds',
                message: 'PARTIALLY OUT OF FRAME - Move back or adjust camera'
            };
        }
        
        // All required landmarks are visible and within frame
        return { isValid: true };
    }
    
    calculatePoseBounds(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let validLandmarks = 0;
        
        landmarks.forEach(landmark => {
            if (landmark.visibility > 0.5) { // Only consider visible landmarks
                const x = landmark.x * this.canvas.width;
                const y = landmark.y * this.canvas.height;
                
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                validLandmarks++;
            }
        });
        
        if (validLandmarks < 5) return null; // Need at least 5 visible landmarks
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }
    
    checkSidesCrossed(x, y, width, height, canvasWidth, canvasHeight) {
        const sides = [];
        
        // Debug the bottom check specifically
        const bottomCheck = y + height > canvasHeight - this.SAFE_MARGIN;
        if (this.ENABLE_FRAME_DEBUG) {
        console.log('Bottom check debug:', {
            y: y,
            height: height,
            yPlusHeight: y + height,
            canvasHeight: canvasHeight,
            safeMargin: this.SAFE_MARGIN,
            threshold: canvasHeight - this.SAFE_MARGIN,
            bottomCrossed: bottomCheck
        });
        }
        
        if (x < this.SAFE_MARGIN) sides.push('left');
        if (x + width > canvasWidth - this.SAFE_MARGIN) sides.push('right');
        if (y < this.SAFE_MARGIN) sides.push('top');
        if (bottomCheck) sides.push('bottom');
        
        return sides;
    }
    
    calculateVisibilityRatio(x, y, width, height, canvasWidth, canvasHeight) {
        const clampedX = Math.max(0, x);
        const clampedY = Math.max(0, y);
        const clampedWidth = Math.min(canvasWidth, x + width) - clampedX;
        const clampedHeight = Math.min(canvasHeight, y + height) - clampedY;
        
        const visibleArea = Math.max(0, clampedWidth) * Math.max(0, clampedHeight);
        const totalArea = width * height;
        
        return totalArea > 0 ? visibleArea / totalArea : 0;
    }
    
    handleNoPoseDetected() {
        if (this.lostFrames >= this.LOST_FRAMES_LIMIT) {
            this.isOutOfFrame = true;
            this.isPartiallyOut = false;
        }
        this.updateFrameStatus();
    }
    
    updateFrameStatus() {
        // Remove all frame status classes
        this.webcamContainer.classList.remove('in-frame', 'partially-out', 'out-of-frame');
        
        // Update border color based on frame status
        if (this.isOutOfFrame) {
            this.webcamContainer.classList.add('out-of-frame');
            this.updateStatus('OUT OF FRAME - Please move back into view', 'error');
        } else if (this.isPartiallyOut) {
            this.webcamContainer.classList.add('partially-out');
            // Use specific message if available, otherwise use default
            const message = this.frameStatusMessage || 'PARTIALLY OUT OF FRAME - Please center yourself';
            this.updateStatus(message, 'warning');
        } else {
            this.webcamContainer.classList.add('in-frame');
            this.updateStatus('IN FRAME - Good position!', 'success');
        }
    }
    
    // Backend communication methods (data storage)
    async sendPoseDataToBackend(results) {
        if (!results.poseLandmarks) return;
        
        if (this.backendUnavailable) return;
        
        try {
            const poseData = {
                timestamp: new Date().toISOString(),
                landmarks: results.poseLandmarks,
                worldLandmarks: results.poseWorldLandmarks,
                sessionId: this.getSessionId()
            };
            
            const response = await fetch(`${this.apiBaseUrl}/api/pose-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(poseData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            if (!this.backendWarningShown) {
                console.warn('Could not send data to backend:', error.message);
                this.backendWarningShown = true;
            }
            this.backendUnavailable = true;
        }
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('ptpal_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ptpal_session_id', sessionId);
        }
        return sessionId;
    }
    
    createNewSession() {
        // Generate a new session ID when camera starts
        const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ptpal_session_id', newSessionId);
        return newSessionId;
    }
    
    async notifyNewSession(sessionId) {
        if (this.backendUnavailable) return;
        
        try {
            await fetch(`${this.apiBaseUrl}/api/new-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: sessionId })
            });
        } catch (error) {
            if (!this.backendWarningShown) {
                console.warn('Could not notify backend of new session:', error.message);
                this.backendWarningShown = true;
            }
            this.backendUnavailable = true;
        }
    }
}

class GuidedSessionModal {
    constructor(webcamManager) {
        this.webcamManager = webcamManager;
        this.feedbackSystem = webcamManager.feedbackSystem;
        
        this.overlay = document.getElementById('session-overlay');
        if (!this.overlay) return;
        
        this.body = document.body;
        this.titleEl = document.getElementById('session-modal-title');
        this.descriptionEl = document.getElementById('session-modal-description');
        this.errorEl = document.getElementById('session-modal-error');
        this.primaryBtn = document.getElementById('session-primary-action');
        this.secondaryBtn = document.getElementById('session-secondary-action');
        this.homeBtn = document.getElementById('session-home-action');
        this.exerciseConfig = document.getElementById('session-exercise-config');
        this.livePanel = document.getElementById('session-live-panel');
        this.exerciseSelect = document.getElementById('pose-type-select');
        this.instructionText = document.getElementById('exercise-instruction');
        this.timerDisplay = document.getElementById('exercise-timer');
        this.floatingPanel = document.getElementById('session-floating-panel');
        this.headerTimer = document.getElementById('header-timer');
        this.floatingExercise = document.getElementById('floating-exercise-name');
        this.floatingPauseBtn = document.getElementById('floating-pause-btn');
        this.floatingStopBtn = document.getElementById('floating-stop-btn');
        
        this.exerciseDuration = 30;
        this.state = 'permission';
        this.currentExercise = this.exerciseSelect ? this.exerciseSelect.value : 'partial_squat';
        this.remainingSeconds = this.exerciseDuration;
        this.timerInterval = null;
        this.homeTarget = '/account.html';
        
        this.exerciseInstructions = {
            partial_squat: 'Do a partial squat for 30 seconds.',
            heel_raises: 'Rise onto your toes for 30 seconds.',
            single_leg_stance: 'Hold a single-leg stance for 30 seconds.',
            tandem_stance: 'Stand heel-to-toe for 30 seconds.',
            functional_reach: 'Reach forward in a controlled motion for 30 seconds.',
            tree_pose: 'Hold a steady tree pose for 30 seconds.'
        };
        
        // Exercise to video file mapping
        this.exerciseVideos = {
            partial_squat: '/avatar_poses/leg_lift.mp4',
            heel_raises: '/avatar_poses/leg_lift.mp4',
            single_leg_stance: '/avatar_poses/leg_lift.mp4',
            tandem_stance: '/avatar_poses/tandem.mp4',
            functional_reach: '/avatar_poses/leg_lift.mp4',
            tree_pose: '/avatar_poses/tree.mp4'
        };
        
        // Detailed pose descriptions for the popup
        this.poseDescriptions = {
            partial_squat: 'Stand with your feet shoulder-width apart. Slowly bend your knees and lower your body as if sitting back into a chair. Keep your back straight and go down about halfway, then return to standing position.',
            heel_raises: 'Stand with your feet hip-width apart. Slowly rise up onto your toes, lifting your heels off the ground. Hold briefly, then lower your heels back down with control.',
            single_leg_stance: 'Stand on one leg while keeping your balance. You can hold your arms out to the sides for balance. Keep your standing leg slightly bent and your core engaged.',
            tandem_stance: 'Stand with one foot directly in front of the other, heel to toe. Keep your arms out to the sides for balance and maintain this position.',
            functional_reach: 'Stand with your feet shoulder-width apart. Reach forward with one arm while keeping your balance. Move slowly and with control.',
            tree_pose: 'Stand on one leg and place the sole of your other foot on your inner thigh or calf (avoid the knee). Bring your hands together at your chest or raise them overhead.'
        };
        
        // Initialize pose demo popup elements
        this.poseDemoPopup = document.getElementById('pose-demo-popup');
        this.poseDemoVideo = document.getElementById('pose-demo-video');
        this.poseDemoTitle = document.getElementById('pose-demo-title');
        this.poseDemoText = document.getElementById('pose-demo-text');
        this.poseDemoNextBtn = document.getElementById('pose-demo-next-btn');
        this.avatarOverlay = document.getElementById('avatar-overlay');
        this.avatarOverlayVideo = document.getElementById('avatar-overlay-video');
        
        // Set up pose demo next button handler
        if (this.poseDemoNextBtn) {
            this.poseDemoNextBtn.addEventListener('click', () => this.hidePoseDemoAndContinue());
        }
        
        if (this.exerciseSelect) {
            this.exerciseSelect.addEventListener('change', (event) => {
                this.currentExercise = event.target.value;
                this.updateInstructionCopy();
                if (this.feedbackSystem && typeof this.feedbackSystem.setPoseType === 'function') {
                    this.feedbackSystem.setPoseType(this.currentExercise);
                }
            });
        }
        
        if (this.primaryBtn) {
            this.primaryBtn.addEventListener('click', () => this.handlePrimaryAction());
        }
        
        if (this.secondaryBtn) {
            this.secondaryBtn.addEventListener('click', () => this.handleSecondaryAction());
        }
        
        if (this.homeBtn) {
            this.homeBtn.addEventListener('click', () => {
                window.location.href = this.homeTarget;
            });
        }
        
        if (this.floatingPauseBtn) {
            this.floatingPauseBtn.addEventListener('click', () => this.handleFloatingPause());
        }
        
        if (this.floatingStopBtn) {
            this.floatingStopBtn.addEventListener('click', () => this.handleFloatingStop());
        }
        
        this.showPermissionStep();
    }
    
    showPermissionStep() {
        this.state = 'permission';
        this.hideFloatingPanel();
        this.showOverlay();
        this.setError('');
        if (this.webcamManager.isVideoMode) {
            this.setTitle('Let\'s set up your session', 'Select a video file to analyze your pose.');
        } else {
            this.setTitle('Let\'s set up your session', 'PTPal needs access to your camera so we can guide you safely.');
        }
        this.toggleConfig(false);
        this.toggleLivePanel(false);
        this.setActions({
            primaryText: 'Start Session',
            secondaryHidden: true,
            homeVisible: true
        });
    }
    
    showExerciseSetup() {
        this.state = 'exercise';
        this.hideFloatingPanel();
        this.showOverlay();
        this.setError('');
        if (this.webcamManager.isVideoMode) {
            this.setTitle('Choose your exercise', 'Select what you\'d like to analyze, then upload a video and start.');
        } else {
            this.setTitle('Choose your exercise', 'Select what you\'d like to practice, then start when ready.');
        }
        this.toggleConfig(true);
        this.toggleLivePanel(false);
        this.updateInstructionCopy();
        this.setActions({
            primaryText: 'Start Session',
            secondaryText: 'Back',
            homeVisible: true
        });
    }
    
    async startExerciseSession() {
        if (this.state === 'running') return;
        
        this.setError('');
        if (this.primaryBtn) {
            this.primaryBtn.disabled = true;
        }
        try {
            // Create a new session ID for this exercise session
            // This ensures each exercise gets its own separate session and summary
            const newSessionId = this.webcamManager.createNewSession();
            console.log('[Session] Created new session ID for exercise:', newSessionId);
            await this.webcamManager.notifyNewSession(newSessionId);
            
            // In video mode, check if video is loaded
            if (this.webcamManager.isVideoMode) {
                if (!this.webcamManager.videoFile || !this.webcamManager.isStreaming) {
                    this.setError('Please select a video file first.');
                    this.showOverlay();
                    if (this.primaryBtn) {
                        this.primaryBtn.disabled = false;
                    }
                    return;
                }
            } else {
                // Start camera first (only for webcam mode)
                await this.webcamManager.requestCameraPermission();
                await this.webcamManager.ensureCameraStarted();
            }
            
            // Hide modal immediately so user can see video/camera
            this.hideOverlay();
            this.toggleConfig(false);
            this.toggleLivePanel(false);
            
            // Small delay to ensure video/camera feed is visible
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Show pose demonstration popup first
            await this.showPoseDemo();
            
            // Wait for user to click "Next" (handled in hidePoseDemoAndContinue)
            // The countdown and exercise start will be handled from hidePoseDemoAndContinue
        } catch (error) {
            console.error('Unable to start exercise session:', error);
            if (this.webcamManager.isVideoMode) {
                this.setError('Could not load video. Please try again.');
            } else {
                this.setError('We could not access the camera. Please allow permissions and try again.');
            }
            this.showOverlay(); // Show modal again on error
            this.setActions({
                primaryText: 'Start Session',
                secondaryText: 'Back',
                homeVisible: true
            });
        } finally {
            if (this.primaryBtn) {
                this.primaryBtn.disabled = false;
            }
        }
    }
    
    async showPoseDemo() {
        return new Promise((resolve) => {
            if (!this.poseDemoPopup || !this.poseDemoVideo || !this.poseDemoTitle || !this.poseDemoText) {
                console.log('Pose demo elements not found');
                resolve();
                return;
            }
            
            // Get video path for current exercise
            const videoPath = this.exerciseVideos[this.currentExercise] || this.exerciseVideos.single_leg_stance;
            
            // Set up the popup content
            this.poseDemoTitle.textContent = this.formatExerciseName(this.currentExercise);
            this.poseDemoText.textContent = this.poseDescriptions[this.currentExercise] || this.getInstructionForExercise(this.currentExercise);
            
            // Set video source
            this.poseDemoVideo.src = videoPath;
            this.poseDemoVideo.load();
            
            // Ensure video plays when loaded
            this.poseDemoVideo.addEventListener('loadeddata', () => {
                this.poseDemoVideo.play().catch(err => console.log('Video autoplay prevented:', err));
            }, { once: true });
            
            // Show popup
            this.poseDemoPopup.classList.remove('hidden');
            
            // Store resolve function to be called when user clicks Next
            this.poseDemoResolve = resolve;
        });
    }
    
    async hidePoseDemoAndContinue() {
        if (!this.poseDemoPopup) return;
        
        // Hide popup
        this.poseDemoPopup.classList.add('hidden');
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Set up overlay video for during exercise
        const videoPath = this.exerciseVideos[this.currentExercise] || this.exerciseVideos.single_leg_stance;
        if (this.avatarOverlayVideo) {
            this.avatarOverlayVideo.src = videoPath;
            this.avatarOverlayVideo.load();
            // Ensure video plays when loaded
            this.avatarOverlayVideo.addEventListener('loadeddata', () => {
                this.avatarOverlayVideo.play().catch(err => console.log('Overlay video autoplay prevented:', err));
            }, { once: true });
        }
        
        // Show countdown on top of camera view
        await this.showCountdown();
        
        // Show overlay video during exercise (after countdown)
        if (this.avatarOverlay) {
            this.avatarOverlay.classList.remove('hidden');
        }
        
        // Continue with exercise start
        this.continueExerciseAfterDemo();
        
        // Resolve the promise from showPoseDemo
        if (this.poseDemoResolve) {
            this.poseDemoResolve();
            this.poseDemoResolve = null;
        }
    }
    
    continueExerciseAfterDemo() {
        // Now start the actual session
        if (this.feedbackSystem) {
            if (typeof this.feedbackSystem.setPoseType === 'function') {
                this.feedbackSystem.setPoseType(this.currentExercise);
            }
            this.feedbackSystem.startRealTimeFeedback();
        }
        
        this.remainingSeconds = this.exerciseDuration;
        this.updateInstructionCopy();
        this.updateTimerDisplay();
        this.toggleLivePanel(true);
        this.state = 'running';
        this.showFloatingPanel(false);
        this.setActions({
            primaryText: 'Pause',
            secondaryText: 'Stop Session'
        });
        this.setTitle('Session in progress', this.getInstructionForExercise(this.currentExercise));
        this.startTimer();
    }
    
    async showCountdown() {
        return new Promise((resolve) => {
            const countdownOverlay = document.getElementById('countdown-overlay');
            const countdownNumber = document.getElementById('countdown-number');
            
            if (!countdownOverlay || !countdownNumber) {
                console.log('Countdown elements not found');
                resolve();
                return;
            }
            
            console.log('Starting countdown...');
            
            // Show overlay
            countdownOverlay.classList.remove('hidden');
            
            let count = 3;
            countdownNumber.textContent = count;
            countdownNumber.classList.remove('go');
            
            // Trigger animation by forcing reflow
            countdownNumber.style.animation = 'none';
            countdownNumber.offsetHeight; // Force reflow
            countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
            
            const countdownInterval = setInterval(() => {
                count--;
                
                if (count > 0) {
                    countdownNumber.textContent = count;
                    // Restart animation
                    countdownNumber.style.animation = 'none';
                    countdownNumber.offsetHeight; // Force reflow
                    countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
                } else if (count === 0) {
                    countdownNumber.textContent = 'GO!';
                    countdownNumber.classList.add('go');
                    // Restart animation for GO
                    countdownNumber.style.animation = 'none';
                    countdownNumber.offsetHeight; // Force reflow
                    countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
                } else {
                    clearInterval(countdownInterval);
                    console.log('Countdown complete!');
                    countdownOverlay.classList.add('hidden');
                    resolve();
                }
            }, 1000);
        });
    }
    
    pauseSession() {
        console.log('[Session] Pause button clicked');
        this.state = 'paused';
        this.clearTimer();
        if (this.feedbackSystem) {
            // Stop TTS IMMEDIATELY before stopping feedback - use forceStop for maximum effect
            if (this.feedbackSystem.ttsService) {
                console.log('[Session] Force stopping TTS on pause');
                this.feedbackSystem.ttsService.forceStop();
            }
            this.feedbackSystem.stopRealTimeFeedback(true);
        }
        // Hide overlay video when paused
        if (this.avatarOverlay) {
            this.avatarOverlay.classList.add('hidden');
        }
        this.hideFloatingPanel();
        this.showOverlay();
        this.setTitle('Session paused', 'Take a breather. Resume when you are ready.');
        this.setActions({
            primaryText: 'Resume',
            secondaryText: 'Stop Session',
            homeVisible: true
        });
    }
    
    resumeSession() {
        this.state = 'running';
        if (this.feedbackSystem) {
            if (typeof this.feedbackSystem.setPoseType === 'function') {
                this.feedbackSystem.setPoseType(this.currentExercise);
            }
            this.feedbackSystem.startRealTimeFeedback();
        }
        // Show overlay video again when resuming
        if (this.avatarOverlay) {
            this.avatarOverlay.classList.remove('hidden');
        }
        this.hideOverlay();
        this.showFloatingPanel(false);
        this.setTitle('Back to it', this.getInstructionForExercise(this.currentExercise));
        this.setActions({
            primaryText: 'Pause',
            secondaryText: 'Stop Session',
            homeVisible: false
        });
        this.startTimer();
    }
    
    stopSession() {
        console.log('[Session] Stop button clicked');
        this.clearTimer();
        if (this.feedbackSystem) {
            // Stop TTS IMMEDIATELY before stopping feedback - use forceStop for maximum effect
            if (this.feedbackSystem.ttsService) {
                console.log('[Session] Force stopping TTS on stop');
                this.feedbackSystem.ttsService.forceStop();
            }
            this.feedbackSystem.stopRealTimeFeedback();
        }
        // Hide overlay video when stopped
        if (this.avatarOverlay) {
            this.avatarOverlay.classList.add('hidden');
        }
        this.toggleLivePanel(false);
        this.hideFloatingPanel();
        this.showExerciseSetup();
    }
    
    async completeExercise() {
        console.log('[Session] Exercise completed - timer reached 0');
        this.state = 'finished';
        this.clearTimer();
        if (this.feedbackSystem) {
            // Stop TTS IMMEDIATELY when exercise completes, before stopping feedback - use forceStop
            if (this.feedbackSystem.ttsService) {
                console.log('[Session] Force stopping TTS on exercise completion');
                this.feedbackSystem.ttsService.forceStop();
            }
            this.feedbackSystem.stopRealTimeFeedback(true);
        }
        // Hide overlay video when exercise completes
        if (this.avatarOverlay) {
            this.avatarOverlay.classList.add('hidden');
        }
        this.toggleConfig(false);
        this.toggleLivePanel(true);
        this.hideFloatingPanel();
        this.showOverlay();
        
        // Show loading state while fetching summary
        this.setTitle('Great job!', 'Analyzing your performance...');
        this.setActions({
            primaryText: 'Repeat Exercise',
            secondaryText: 'New Exercise',
            homeVisible: true
        });
        
        // Fetch and display session summary
        try {
            const sessionId = this.webcamManager.getSessionId();
            const summary = await this.fetchSessionSummary(sessionId);
            this.displaySummary(summary);
        } catch (error) {
            console.error('Error fetching session summary:', error);
            // Fallback to simple message if summary fails
            this.setTitle('Great job!', 'Would you like to repeat this exercise or choose a new one?');
            this.hideSummary();
        }
    }
    
    async fetchSessionSummary(sessionId) {
        const apiBaseUrl = this.webcamManager.apiBaseUrl || resolveApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/session-summary/${sessionId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    
    displaySummary(summary) {
        // Calculate star rating from average score
        let starsHtml = '';
        if (summary.average_score) {
            const score = Math.round(summary.average_score); // Round to nearest integer for star display
            const filledStars = '★'.repeat(score);
            const emptyStars = '☆'.repeat(5 - score);
            starsHtml = `<div class="summary-stars">${filledStars}${emptyStars}</div>`;
        }
        
        // Update title with score info
        const scoreText = summary.average_score ? ` (Average Score: ${summary.average_score.toFixed(1)}/5)` : '';
        this.setTitle(`Great job!${scoreText}`, 'Here\'s how you did:');
        
        // Show summary in the live panel
        const livePanel = document.getElementById('session-live-panel');
        if (livePanel) {
            // Hide the timer when showing summary
            const timerElement = livePanel.querySelector('.session-timer');
            if (timerElement) {
                timerElement.style.display = 'none';
            }
            
            // Hide the instruction text
            const instructionText = document.getElementById('exercise-instruction');
            if (instructionText) {
                instructionText.style.display = 'none';
            }
            
            // Create or update summary HTML
            let summaryHtml = `
                <div class="session-summary">
                    ${starsHtml}
                    <div class="summary-section summary-positive">
                        <h4 class="summary-title">What You Did Well:</h4>
                        <ul class="summary-list" id="summary-what-went-well"></ul>
                    </div>
                    <div class="summary-section summary-improvement">
                        <h4 class="summary-title">Areas to Improve:</h4>
                        <ul class="summary-list" id="summary-needs-improvement"></ul>
                    </div>
                </div>
            `;
            
            // Check if summary already exists, if not add it
            let summaryContainer = livePanel.querySelector('.session-summary');
            if (!summaryContainer) {
                livePanel.insertAdjacentHTML('beforeend', summaryHtml);
                summaryContainer = livePanel.querySelector('.session-summary');
            } else {
                // Update existing summary with stars if they don't exist
                if (summary.average_score && !summaryContainer.querySelector('.summary-stars')) {
                    const starsHtml = (() => {
                        const score = Math.round(summary.average_score);
                        const filledStars = '★'.repeat(score);
                        const emptyStars = '☆'.repeat(5 - score);
                        return `<div class="summary-stars">${filledStars}${emptyStars}</div>`;
                    })();
                    summaryContainer.insertAdjacentHTML('afterbegin', starsHtml);
                } else if (summary.average_score) {
                    // Update existing stars
                    const starsElement = summaryContainer.querySelector('.summary-stars');
                    if (starsElement) {
                        const score = Math.round(summary.average_score);
                        const filledStars = '★'.repeat(score);
                        const emptyStars = '☆'.repeat(5 - score);
                        starsElement.textContent = filledStars + emptyStars;
                    }
                }
            }
            
            // Add parents summary button (summary will be loaded on-demand)
            let parentsContainer = livePanel.querySelector('.parents-summary-container');
            if (!parentsContainer) {
                const parentsHtml = `
                    <div class="parents-summary-container">
                        <button id="parents-summary-btn" class="btn-secondary-small">Parents Summary</button>
                        <div id="parents-summary-content" class="parents-summary-content hidden">
                            <div class="parents-summary-loading" id="parents-summary-loading" style="display: none;">
                                <p>Loading detailed summary...</p>
                            </div>
                            <div id="parents-summary-loaded" style="display: none;">
                                <div class="parents-summary-section">
                                    <h4 class="parents-summary-title">Overall Assessment</h4>
                                    <p id="parents-overall-assessment"></p>
                                </div>
                                <div class="parents-summary-section">
                                    <h4 class="parents-summary-title">Strengths</h4>
                                    <ul id="parents-strengths" class="parents-summary-list"></ul>
                                </div>
                                <div class="parents-summary-section">
                                    <h4 class="parents-summary-title">Areas for Improvement</h4>
                                    <ul id="parents-improvements" class="parents-summary-list"></ul>
                                </div>
                                <div class="parents-summary-section">
                                    <h4 class="parents-summary-title">Technical Notes</h4>
                                    <p id="parents-technical-notes"></p>
                                </div>
                                <div class="parents-summary-section">
                                    <h4 class="parents-summary-title">Recommendations</h4>
                                    <ul id="parents-recommendations" class="parents-summary-list"></ul>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                livePanel.insertAdjacentHTML('beforeend', parentsHtml);
            }
            
            // Populate what went well
            const whatWentWellList = document.getElementById('summary-what-went-well');
            if (whatWentWellList) {
                whatWentWellList.innerHTML = '';
                if (summary.what_went_well && summary.what_went_well.length > 0) {
                    summary.what_went_well.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        whatWentWellList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'You completed the exercise!';
                    whatWentWellList.appendChild(li);
                }
            }
            
            // Populate needs improvement
            const needsImprovementList = document.getElementById('summary-needs-improvement');
            if (needsImprovementList) {
                needsImprovementList.innerHTML = '';
                if (summary.needs_improvement && summary.needs_improvement.length > 0) {
                    summary.needs_improvement.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        needsImprovementList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'Keep practicing to improve';
                    needsImprovementList.appendChild(li);
                }
            }
            
            // Add click handler for parents summary button (loads on-demand)
            const parentsSummaryBtn = document.getElementById('parents-summary-btn');
            if (parentsSummaryBtn) {
                // Remove existing listeners by cloning
                const newBtn = parentsSummaryBtn.cloneNode(true);
                parentsSummaryBtn.parentNode.replaceChild(newBtn, parentsSummaryBtn);
                newBtn.addEventListener('click', () => {
                    this.handleParentSummaryClick();
                });
            }
        }
    }
    
    populateParentSummary(parentSummary) {
        // Overall assessment
        const overallAssessment = document.getElementById('parents-overall-assessment');
        if (overallAssessment && parentSummary.overall_assessment) {
            overallAssessment.textContent = parentSummary.overall_assessment;
        }
        
        // Strengths
        const strengthsList = document.getElementById('parents-strengths');
        if (strengthsList && parentSummary.strengths) {
            strengthsList.innerHTML = '';
            parentSummary.strengths.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                strengthsList.appendChild(li);
            });
        }
        
        // Improvements needed
        const improvementsList = document.getElementById('parents-improvements');
        if (improvementsList && parentSummary.improvements_needed) {
            improvementsList.innerHTML = '';
            parentSummary.improvements_needed.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                improvementsList.appendChild(li);
            });
        }
        
        // Technical notes
        const technicalNotes = document.getElementById('parents-technical-notes');
        if (technicalNotes && parentSummary.technical_notes) {
            technicalNotes.textContent = parentSummary.technical_notes;
        }
        
        // Recommendations
        const recommendationsList = document.getElementById('parents-recommendations');
        if (recommendationsList && parentSummary.recommendations) {
            recommendationsList.innerHTML = '';
            parentSummary.recommendations.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                recommendationsList.appendChild(li);
            });
        }
    }
    
    async handleParentSummaryClick() {
        const parentsSummaryContent = document.getElementById('parents-summary-content');
        const parentsSummaryBtn = document.getElementById('parents-summary-btn');
        const parentsSummaryLoading = document.getElementById('parents-summary-loading');
        const parentsSummaryLoaded = document.getElementById('parents-summary-loaded');
        
        if (!parentsSummaryContent || !parentsSummaryBtn) return;
        
        const isHidden = parentsSummaryContent.classList.contains('hidden');
        
        if (isHidden) {
            // Show the content and load parent summary
            parentsSummaryContent.classList.remove('hidden');
            parentsSummaryBtn.disabled = true;
            parentsSummaryBtn.textContent = 'Loading...';
            
            // Show loading state
            if (parentsSummaryLoading) {
                parentsSummaryLoading.style.display = 'block';
            }
            if (parentsSummaryLoaded) {
                parentsSummaryLoaded.style.display = 'none';
            }
            
            try {
                const sessionId = this.webcamManager.getSessionId();
                const apiBaseUrl = this.webcamManager.apiBaseUrl || resolveApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/parent-summary/${sessionId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success' && data.parent_summary) {
                    this.populateParentSummary(data.parent_summary);
                    
                    // Hide loading, show content
                    if (parentsSummaryLoading) {
                        parentsSummaryLoading.style.display = 'none';
                    }
                    if (parentsSummaryLoaded) {
                        parentsSummaryLoaded.style.display = 'block';
                    }
                    
                    parentsSummaryBtn.textContent = 'Hide Parents Summary';
                } else {
                    throw new Error(data.message || 'Failed to load parent summary');
                }
            } catch (error) {
                console.error('Error fetching parent summary:', error);
                if (parentsSummaryLoading) {
                    parentsSummaryLoading.innerHTML = `<p style="color: #E53E3E;">Error loading summary: ${error.message}</p>`;
                }
                parentsSummaryBtn.textContent = 'Parents Summary';
            } finally {
                parentsSummaryBtn.disabled = false;
            }
        } else {
            // Hide the content
            parentsSummaryContent.classList.add('hidden');
            parentsSummaryBtn.textContent = 'Parents Summary';
        }
    }
    
    hideSummary() {
        const livePanel = document.getElementById('session-live-panel');
        if (livePanel) {
            const summaryContainer = livePanel.querySelector('.session-summary');
            if (summaryContainer) {
                summaryContainer.remove();
            }
            
            const parentsContainer = livePanel.querySelector('.parents-summary-container');
            if (parentsContainer) {
                parentsContainer.remove();
            }
            
            // Show the timer again
            const timerElement = livePanel.querySelector('.session-timer');
            if (timerElement) {
                timerElement.style.display = '';
            }
            
            // Show the instruction text again
            const instructionText = document.getElementById('exercise-instruction');
            if (instructionText) {
                instructionText.style.display = '';
            }
        }
    }
    
    repeatExercise() {
        this.hideSummary();
        this.remainingSeconds = this.exerciseDuration;
        // Clear the current session ID so a new one will be created for the repeat
        localStorage.removeItem('ptpal_session_id');
        console.log('[Session] Cleared session ID - new one will be created for repeat exercise');
        this.startExerciseSession();
    }
    
    chooseNewExercise() {
        this.hideSummary();
        this.toggleLivePanel(false);
        // Clear the current session ID so a new one will be created for the next exercise
        localStorage.removeItem('ptpal_session_id');
        console.log('[Session] Cleared session ID - new one will be created for next exercise');
        this.showExerciseSetup();
    }
    
    handlePrimaryAction() {
        console.log('[Session] Primary button clicked, state:', this.state);
        switch (this.state) {
            case 'permission':
                this.requestPermissionFlow();
                break;
            case 'exercise':
                this.startExerciseSession();
                break;
            case 'running':
                console.log('[Session] Primary button - pausing session');
                this.pauseSession();
                break;
            case 'paused':
                this.resumeSession();
                break;
            case 'finished':
                this.repeatExercise();
                break;
            default:
                this.showPermissionStep();
        }
    }
    
    handleSecondaryAction() {
        console.log('[Session] Secondary button clicked, state:', this.state);
        switch (this.state) {
            case 'exercise':
                this.showPermissionStep();
                break;
            case 'running':
            case 'paused':
                console.log('[Session] Secondary button - stopping session');
                this.stopSession();
                break;
            case 'finished':
                this.chooseNewExercise();
                break;
            default:
                this.showPermissionStep();
        }
    }
    
    async requestPermissionFlow() {
        this.setError('');
        if (this.primaryBtn) {
            this.primaryBtn.disabled = true;
        }
        try {
            await this.webcamManager.requestCameraPermission();
            this.showExerciseSetup();
        } catch (error) {
            console.error('Camera permission flow failed:', error);
            this.setError('We need camera access to continue. Please allow permission.');
        } finally {
            if (this.primaryBtn) {
                this.primaryBtn.disabled = false;
            }
        }
    }
    
    startTimer() {
        this.clearTimer();
        this.timerInterval = setInterval(() => {
            if (this.state !== 'running') return;
            this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
            this.updateTimerDisplay();
            if (this.remainingSeconds === 0) {
                this.completeExercise();
            }
        }, 1000);
        this.updateTimerDisplay();
    }
    
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimerDisplay() {
        const formatted = this.formatTime(this.remainingSeconds);
        if (this.timerDisplay) {
            this.timerDisplay.textContent = formatted;
        }
        if (this.headerTimer) {
            this.headerTimer.textContent = formatted;
        }
    }
    
    updateInstructionCopy() {
        const instruction = this.getInstructionForExercise(this.currentExercise);
        if (this.instructionText) {
            this.instructionText.textContent = instruction;
        }
        if (this.floatingExercise) {
            this.floatingExercise.textContent = this.formatExerciseName(this.currentExercise);
        }
    }
    
    getInstructionForExercise(exerciseKey) {
        return this.exerciseInstructions[exerciseKey] || `Hold the ${this.formatExerciseName(exerciseKey)} for ${this.exerciseDuration} seconds.`;
    }
    
    formatExerciseName(value) {
        return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    formatTime(totalSeconds = 0) {
        const safeSeconds = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
        const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
        const seconds = String(Math.floor(safeSeconds % 60)).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }
    
    setTitle(title, description) {
        if (this.titleEl) this.titleEl.textContent = title;
        if (this.descriptionEl) this.descriptionEl.textContent = description;
    }
    
    setActions({ primaryText, primaryDisabled = false, secondaryText, secondaryHidden = false, homeVisible = false, homeText = 'Return Home' }) {
        if (this.primaryBtn) {
            this.primaryBtn.textContent = primaryText || 'Continue';
            this.primaryBtn.disabled = !!primaryDisabled;
        }
        if (this.secondaryBtn) {
            this.secondaryBtn.textContent = secondaryText || '';
            this.secondaryBtn.classList.toggle('hidden', secondaryHidden || !secondaryText);
        }
        if (this.homeBtn) {
            this.homeBtn.textContent = homeText;
            this.homeBtn.classList.toggle('hidden', !homeVisible);
        }
    }
    
    setError(message) {
        if (!this.errorEl) return;
        if (!message) {
            this.errorEl.textContent = '';
            this.errorEl.classList.remove('visible');
        } else {
            this.errorEl.textContent = message;
            this.errorEl.classList.add('visible');
        }
    }
    
    toggleConfig(show) {
        if (!this.exerciseConfig) return;
        this.exerciseConfig.classList.toggle('hidden', !show);
    }
    
    toggleLivePanel(show) {
        if (!this.livePanel) return;
        this.livePanel.classList.toggle('hidden', !show);
    }
    
    showOverlay() {
        if (!this.overlay) return;
        this.overlay.classList.remove('floating');
        this.overlay.classList.add('visible');
        this.blockPage(true);
    }
    
    hideOverlay() {
        if (!this.overlay) return;
        this.overlay.classList.remove('visible');
        this.overlay.classList.remove('floating');
        this.blockPage(false);
    }
    
    blockPage(shouldBlock) {
        if (this.body) {
            this.body.classList.toggle('session-blocked', !!shouldBlock);
        }
    }
    
    showFloatingPanel(isPaused = false) {
        if (!this.floatingPanel) return;
        this.floatingPanel.classList.remove('hidden');
        if (this.floatingPauseBtn) {
            this.floatingPauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
        }
        this.updateFloatingDisplay();
    }
    
    hideFloatingPanel() {
        if (!this.floatingPanel) return;
        this.floatingPanel.classList.add('hidden');
    }
    
    updateFloatingDisplay() {
        if (this.floatingExercise) {
            this.floatingExercise.textContent = this.formatExerciseName(this.currentExercise);
        }
        if (this.headerTimer) {
            this.headerTimer.textContent = this.formatTime(this.remainingSeconds);
        }
    }
    
    handleFloatingPause() {
        console.log('[Session] Floating pause button clicked, state:', this.state);
        if (this.state === 'running') {
            this.pauseSession();
        } else if (this.state === 'paused') {
            this.resumeSession();
        }
    }
    
    handleFloatingStop() {
        console.log('[Session] Floating stop button clicked');
        this.stopSession();
    }
    
    showUnsupportedState() {
        this.hideFloatingPanel();
        this.showOverlay();
        this.setTitle('Camera not supported', 'Please use a modern browser that supports WebRTC to run PT sessions.');
        this.toggleConfig(false);
        this.toggleLivePanel(false);
        this.setError('');
        this.setActions({
            primaryText: 'Close',
            primaryDisabled: true,
            secondaryHidden: true,
            homeVisible: true
        });
    }
}

// Initialize the webcam manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tutorial system if onboarding UI is present
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        new TutorialSystem();
    }

    // Check for video mode in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isVideoMode = urlParams.get('mode') === 'video';

    // Initialize immediately - waitForMediaPipe will handle script loading
    const webcamManager = new WebcamManager();
    webcamManager.isVideoMode = isVideoMode;
    const guidedSession = new GuidedSessionModal(webcamManager);
    
    // If in video mode, add file input to session overlay
    if (isVideoMode) {
        webcamManager.setupVideoMode();
    }
    
    // Check if browser supports required APIs (only for webcam mode)
    if (!isVideoMode && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        webcamManager.updateStatus('Your browser does not support camera access. Please use a modern browser.', 'error');
        if (guidedSession && typeof guidedSession.showUnsupportedState === 'function') {
            guidedSession.showUnsupportedState();
        }
    }
    
    // Home button - redirect to account if logged in, otherwise to homepage
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', (event) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.email) {
                event.preventDefault();
                window.location.href = '/account';
            }
            // Otherwise let the anchor follow its default href to '/'
        });
    }
});