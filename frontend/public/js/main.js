// Main JavaScript file

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to navbar
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards and steps
document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    const steps = document.querySelectorAll('.step');
    
    [...featureCards, ...steps].forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Button click handlers
document.querySelectorAll('.btn-primary, .nav-cta').forEach(button => {
    button.addEventListener('click', (e) => {
        // Skip if button has onclick handler (let it handle navigation)
        if (button.getAttribute('onclick')) {
            return;
        }
        if (button.textContent.includes('Get Started') || button.textContent.includes('Start')) {
            e.preventDefault();
            // Navigate to exercises page or start session
            window.location.href = '/exercises';
        }
    });
});

// Hide navigation menu items when user is logged in (but only on non-public pages)
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navMenu) return;
    
    // Public pages where nav should always be visible
    const publicPages = ['/', '/index.html', '/exercises', '/exercises.html', '/about', '/about.html', '/contact', '/contact.html', '/auth', '/auth.html'];
    const currentPath = window.location.pathname;
    
    // If user is logged in AND not on a public page, hide the nav menu items
    if (user.email && !publicPages.includes(currentPath)) {
        navMenu.style.display = 'none';
    } else {
        // Make sure nav is visible on public pages
        navMenu.style.display = '';
    }
});


