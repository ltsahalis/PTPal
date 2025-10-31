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
                description: "Your performance is scored in real-time and displayed here. The score ranges from 0-100, and you'll see a PASS or FAIL indicator based on your pose quality.",
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

// Enhanced REST approach with polling for real-time feedback
class RealTimeFeedbackREST {
    constructor() {
        this.pollingInterval = null;
        this.isActive = false;
        this.currentPoseType = 'partial_squat';
        this.lastPoseData = null;
        
        // UI elements
        this.poseTypeSelect = document.getElementById('pose-type-select');
        this.startFeedbackBtn = document.getElementById('start-feedback-btn');
        this.stopFeedbackBtn = document.getElementById('stop-feedback-btn');
        this.scoreValue = document.getElementById('score-value');
        this.passStatus = document.getElementById('pass-status');
        this.feedbackList = document.getElementById('feedback-list');
        this.metricsDisplay = document.getElementById('metrics-display');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.poseTypeSelect.addEventListener('change', (e) => {
            this.currentPoseType = e.target.value;
        });
        
        this.startFeedbackBtn.addEventListener('click', () => {
            this.startRealTimeFeedback();
        });
        
        this.stopFeedbackBtn.addEventListener('click', () => {
            this.stopRealTimeFeedback();
        });
    }
    
    setLastPoseData(poseData) {
        this.lastPoseData = poseData;
    }
    
    startRealTimeFeedback() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentPoseType = this.poseTypeSelect.value;
        
        // Update UI
        this.startFeedbackBtn.disabled = true;
        this.stopFeedbackBtn.disabled = false;
        this.poseTypeSelect.disabled = true;
        
        // Clear previous feedback
        this.clearFeedback();
        
        // Start polling every 500ms for validation
        this.pollingInterval = setInterval(async () => {
            if (this.lastPoseData && this.lastPoseData.poseLandmarks) {
                try {
                    const feedback = await this.validatePose(this.currentPoseType, this.lastPoseData);
                    this.displayFeedback(feedback);
                } catch (error) {
                    console.error('Error getting feedback:', error);
                    this.showError('Error getting feedback: ' + error.message);
                }
            }
        }, 500);
        
        console.log(`Started real-time feedback for ${this.currentPoseType}`);
    }
    
    stopRealTimeFeedback() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Clear polling interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        // Update UI
        this.startFeedbackBtn.disabled = false;
        this.stopFeedbackBtn.disabled = true;
        this.poseTypeSelect.disabled = false;
        
        // Clear feedback
        this.clearFeedback();
        
        console.log('Stopped real-time feedback');
    }
    
    async validatePose(poseType, results) {
        const response = await fetch('https://localhost:8001/api/validate-pose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pose_type: poseType,
                landmarks: results.poseLandmarks
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    displayFeedback(feedback) {
        // Update score
        this.scoreValue.textContent = feedback.score || '--';
        
        // Update pass/fail status
        this.updatePassStatus(feedback.pass);
        
        // Update feedback list
        this.updateFeedbackList(feedback.feedback || []);
        
        // Update metrics display
        this.updateMetricsDisplay(feedback.metrics || {});
        
        // Add visual feedback based on score
        this.updateScoreIndicator(feedback.score);
    }
    
    updatePassStatus(pass) {
        this.passStatus.textContent = pass ? 'PASS' : 'FAIL';
        this.passStatus.className = 'pass-indicator ' + (pass ? 'pass' : 'fail');
    }
    
    updateFeedbackList(feedbackArray) {
        if (feedbackArray.length === 0) {
            this.feedbackList.innerHTML = '<li>No specific feedback available</li>';
            return;
        }
        
        this.feedbackList.innerHTML = feedbackArray.map(f => `<li>${f}</li>`).join('');
    }
    
    updateMetricsDisplay(metrics) {
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
    
    updateScoreIndicator(score) {
        const scoreCircle = document.querySelector('.score-circle');
        if (!scoreCircle) return;
        
        // Update color based on score
        if (score >= 80) {
            scoreCircle.style.background = 'linear-gradient(135deg, #48BB78, #38A169)'; // Green
        } else if (score >= 60) {
            scoreCircle.style.background = 'linear-gradient(135deg, #ED8936, #DD6B20)'; // Orange
        } else {
            scoreCircle.style.background = 'linear-gradient(135deg, #F56565, #E53E3E)'; // Red
        }
    }
    
    clearFeedback() {
        this.scoreValue.textContent = '--';
        this.passStatus.textContent = '--';
        this.passStatus.className = 'pass-indicator neutral';
        this.feedbackList.innerHTML = '<li>Select a pose type and start feedback to begin</li>';
        this.metricsDisplay.innerHTML = '<p>No metrics available yet</p>';
        
        // Reset score circle color
        const scoreCircle = document.querySelector('.score-circle');
        if (scoreCircle) {
            scoreCircle.style.background = 'linear-gradient(135deg, #4A90E2, #63B3ED)';
        }
    }
    
    showError(message) {
        this.feedbackList.innerHTML = `<li style="color: #E53E3E; border-left-color: #E53E3E;">${message}</li>`;
    }
    
    // Method to enable/disable feedback based on camera status
    setCameraStatus(isStreaming) {
        this.startFeedbackBtn.disabled = !isStreaming;
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
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.poseDataOutput = document.getElementById('pose-data-output');
        this.lastUpdate = document.getElementById('last-update');
        this.nextUpdate = document.getElementById('next-update');
        
        this.stream = null;
        this.isStreaming = false;
        this.pose = null;
        this.camera = null;
        
        // Timer for 10-second updates
        this.updateTimer = null;
        this.nextUpdateTime = null;
        this.lastPoseData = null;
        
        // Initialize real-time feedback system
        this.feedbackSystem = new RealTimeFeedbackREST();
        
        // Out-of-frame detection variables
        this.lostFrames = 0;
        this.recentCenters = [];
        this.sideCounts = { left: 0, right: 0, top: 0, bottom: 0 };
        this.isOutOfFrame = false;
        this.isPartiallyOut = false;
        this.webcamContainer = document.querySelector('.webcam-container');
        
        // Detection parameters (adapted from Python script)
        this.EDGE_MARGIN = 60;        // outer guide box
        this.SAFE_MARGIN = 80;       // inner safe zone
        this.PARTIAL_FRAMES = 2;     // delay to prevent flickering
        this.VIS_THRESH = 0.85;      // visibility threshold
        this.LOST_FRAMES_LIMIT = 10; // frames before declaring out of frame
        
        this.initializeEventListeners();
        this.initializePose();
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startWebcam());
        this.stopBtn.addEventListener('click', () => this.stopWebcam());
        
        // Handle page unload to stop camera
        window.addEventListener('beforeunload', () => this.stopWebcam());
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
            this.updateStatus('BlazePose ready - Click Start Camera', 'success');
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

    
    async startWebcam() {
        try {
            this.updateStatus('Requesting camera access...', 'loading');
            
            // Create new session when camera starts
            const newSessionId = this.createNewSession();
            console.log('New session started:', newSessionId);
            
            // Notify backend that new session has started (this will clear old data from display)
            this.notifyNewSession(newSessionId);
            
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            // Set video source
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            this.video.onloadedmetadata = () => {
                this.video.play();
                this.setupCanvas();
                this.isStreaming = true;
                this.updateStatus('Camera active - BlazePose running', 'success');
                this.updateButtons(true);
                
                // Enable feedback system
                this.feedbackSystem.setCameraStatus(true);
                
                // Initialize camera for pose estimation
                this.initializeCamera();
                
                // Start the 10-second update timer
                this.startUpdateTimer();
            };
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.handleCameraError(error);
        }
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
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pose landmarks and connections
        if (results.poseLandmarks) {
            this.drawPoseLandmarks(results.poseLandmarks);
            this.drawPoseConnections(results.poseLandmarks);
            this.drawPoseAvatar(results.poseLandmarks);
            // Check for out-of-frame detection
            this.checkOutOfFrame(results.poseLandmarks);
        } else {
            // No pose detected - increment lost frames
            this.lostFrames++;
            this.handleNoPoseDetected();
        }
        
        // Store the latest pose data - EXACT BlazePose format
        this.lastPoseData = results;
        this.pose.onResults((r) => { console.log('results', r); this.onPoseResults(r); });

        // Update feedback system with latest pose data
        this.feedbackSystem.setLastPoseData(results);

        // Send data to Python backend for storage and processing
        this.sendPoseDataToBackend(results);
    }
    
    drawPoseLandmarks(landmarks) {
        this.ctx.fillStyle = '#7ED321';
        this.ctx.strokeStyle = '#7ED321';
        this.ctx.lineWidth = 2;
        
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Add landmark index for debugging
            this.ctx.fillStyle = '#4A90E2';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(index.toString(), x + 6, y - 6);
            this.ctx.fillStyle = '#7ED321';
        });
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
        this.ctx.lineWidth = this.canvas.width/20;
        
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
    drawPoseAvatar(landmarks) {
        this.ctx.fillStyle = '#4A90E2';
        const x = landmarks[0].x * this.canvas.width;
        const y = landmarks[0].y * this.canvas.height;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.canvas.width/8, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
    }
    
    startUpdateTimer() {
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
        if (this.nextUpdateTime) {
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
        
        // Clear update timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        
        this.video.srcObject = null;
        this.isStreaming = false;
        
        // Disable feedback system
        this.feedbackSystem.setCameraStatus(false);
        
        // Clear current session data from localStorage (but keep in SQLite)
        localStorage.removeItem('ptpal_session_id');
        console.log('Session ended - data collection stopped');
        
        this.updateStatus('Camera stopped', 'info');
        this.updateButtons(false);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset pose data display
        this.poseDataOutput.textContent = 'No pose data available yet. Start the camera to begin pose estimation.';
        this.lastUpdate.textContent = 'Never';
        this.nextUpdate.textContent = '--';
        this.lastPoseData = null;
        
        // Reset frame detection state
        this.lostFrames = 0;
        this.recentCenters = [];
        this.sideCounts = { left: 0, right: 0, top: 0, bottom: 0 };
        this.isOutOfFrame = false;
        this.isPartiallyOut = false;
        
        // Reset webcam container border
        this.webcamContainer.classList.remove('in-frame', 'partially-out', 'out-of-frame');
    }
    
    setupCanvas() {
        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Position canvas over video
        const rect = this.video.getBoundingClientRect();
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    updateStatus(message, type = 'info') {
        this.statusText.textContent = message;
        this.statusText.className = '';
        
        switch (type) {
            case 'loading':
                this.statusText.innerHTML = `<span class="loading"></span>${message}`;
                break;
            case 'success':
                this.statusText.style.color = '#7ED321';
                break;
            case 'error':
                this.statusText.style.color = '#E53E3E';
                break;
            case 'warning':
                this.statusText.style.color = '#FFA500';
                break;
            case 'info':
                this.statusText.style.color = '#4A90E2';
                break;
        }
    }
    
    updateButtons(isStreaming) {
        this.startBtn.disabled = isStreaming;
        this.stopBtn.disabled = !isStreaming;
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
        
        // Calculate bounding box from pose landmarks
        const bounds = this.calculatePoseBounds(landmarks);
        if (!bounds) return;
        
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
        
        // Check if any side has been crossed for enough frames
        this.isPartiallyOut = false;
        for (const side of ['left', 'right', 'top', 'bottom']) {
            if (this.sideCounts[side] >= this.PARTIAL_FRAMES * 2) {
                this.isPartiallyOut = true;
                break;
            }
        }
        
        // Check visibility ratio
        const visibilityRatio = this.calculateVisibilityRatio(x, y, width, height, canvasWidth, canvasHeight);
        console.log('Visibility ratio:', visibilityRatio, 'Threshold:', this.VIS_THRESH);
        
        if (visibilityRatio < this.VIS_THRESH) {
            this.isPartiallyOut = true;
            console.log('Partially out due to low visibility ratio');
        }
        
        // Log final status before update
        console.log('Final frame status:', {
            isPartiallyOut: this.isPartiallyOut,
            sidesCrossed: sidesCrossed,
            sideCounts: this.sideCounts,
            visibilityRatio: visibilityRatio
        });
        
        this.isOutOfFrame = false;
        this.updateFrameStatus();
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
        console.log('Bottom check debug:', {
            y: y,
            height: height,
            yPlusHeight: y + height,
            canvasHeight: canvasHeight,
            safeMargin: this.SAFE_MARGIN,
            threshold: canvasHeight - this.SAFE_MARGIN,
            bottomCrossed: bottomCheck
        });
        
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
            this.updateStatus('PARTIALLY OUT OF FRAME - Please center yourself', 'warning');
        } else {
            this.webcamContainer.classList.add('in-frame');
            this.updateStatus('IN FRAME - Good position!', 'success');
        }
    }
    
    // Backend communication methods (data storage)
    async sendPoseDataToBackend(results) {
        if (!results.poseLandmarks) return;
        
        try {
            const poseData = {
                timestamp: new Date().toISOString(),
                landmarks: results.poseLandmarks,
                worldLandmarks: results.poseWorldLandmarks,
                sessionId: this.getSessionId()
            };
            
            const response = await fetch('https://localhost:8001/api/pose-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(poseData)
            });
            
            if (!response.ok) {
                console.log('Backend not running, pose data not saved');
            }
        } catch (error) {
            console.log('Could not send data to backend:', error.message);
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
        try {
            // Send notification to backend that new session started
            await fetch('https://localhost:8001/api/new-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: sessionId })
            });
            console.log('Backend notified of new session:', sessionId);
        } catch (error) {
            console.log('Could not notify backend of new session:', error.message);
        }
    }
}

// Initialize the webcam manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tutorial system
    const tutorialSystem = new TutorialSystem();
    
    // Initialize immediately - waitForMediaPipe will handle script loading
    const webcamManager = new WebcamManager();
    
    // Check if browser supports required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        webcamManager.updateStatus('Your browser does not support camera access. Please use a modern browser.', 'error');
        webcamManager.startBtn.disabled = true;
    }
});