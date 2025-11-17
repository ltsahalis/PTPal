// Typing Animation
const typingText = "AI Powered Physical Therapy you can trust";

let currentCharIndex = 0;
let typingSpeed = 100;
let isComplete = false;

const typingElement = document.getElementById('typing-text');

function typeText() {
    if (!isComplete && currentCharIndex < typingText.length) {
        // Type characters
        typingElement.textContent = typingText.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typingSpeed = 100; // Normal speed when typing
    } else if (!isComplete) {
        // Finished typing, stop
        isComplete = true;
        return;
    }
    
    if (!isComplete) {
        setTimeout(typeText, typingSpeed);
    }
}

// Start typing animation when page loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(typeText, 1000); // Start after 1 second
});

