class WebcamManager {
    constructor() {
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('output-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.statusText = document.getElementById('status-text');
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        
        this.stream = null;
        this.isStreaming = false;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startWebcam());
        this.stopBtn.addEventListener('click', () => this.stopWebcam());
        
        // Handle page unload to stop camera
        window.addEventListener('beforeunload', () => this.stopWebcam());
    }
    
    async startWebcam() {
        try {
            this.updateStatus('Requesting camera access...', 'loading');
            
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
                this.updateStatus('Camera active - Ready for pose estimation', 'success');
                this.updateButtons(true);
                
                // Start the video processing loop
                this.processVideo();
            };
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.handleCameraError(error);
        }
    }
    
    stopWebcam() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.isStreaming = false;
        this.updateStatus('Camera stopped', 'info');
        this.updateButtons(false);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
    
    processVideo() {
        if (!this.isStreaming) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // TODO: Add pose estimation here
        // For now, we'll just draw a simple overlay to show the canvas is working
        this.drawTestOverlay();
        
        // Continue processing
        requestAnimationFrame(() => this.processVideo());
    }
    
    drawTestOverlay() {
        // Simple test overlay - will be replaced with pose estimation
        this.ctx.strokeStyle = '#7ED321';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 50, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Add inner circle with blue color
        this.ctx.strokeStyle = '#4A90E2';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 35, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Add text with brand colors
        this.ctx.fillStyle = '#4A90E2';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Overlay area for pose tracking', this.canvas.width / 2, this.canvas.height / 2 - 50);
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
}

// Initialize the webcam manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const webcamManager = new WebcamManager();
    
    // Check if browser supports required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        webcamManager.updateStatus('Your browser does not support camera access. Please use a modern browser.', 'error');
        webcamManager.startBtn.disabled = true;
    }
});
