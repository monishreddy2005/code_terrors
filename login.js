// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const loginSubmitBtn = document.getElementById('loginSubmit');
const forgotPasswordBtn = document.getElementById('forgotPassword');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeModalBtn = document.getElementById('closeModal');
const resetForm = document.getElementById('resetForm');
const resetEmailInput = document.getElementById('resetEmail');
const resetSubmitBtn = document.querySelector('.reset-submit-btn');
const signupLink = document.getElementById('signupLink');

// Password Toggle Functionality
passwordToggle.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
});

// Modal Functionality
forgotPasswordBtn.addEventListener('click', function(e) {
    e.preventDefault();
    forgotPasswordModal.classList.add('active');
    resetEmailInput.focus();
});

closeModalBtn.addEventListener('click', function() {
    forgotPasswordModal.classList.remove('active');
});

// Close modal when clicking outside
forgotPasswordModal.addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && forgotPasswordModal.classList.contains('active')) {
        forgotPasswordModal.classList.remove('active');
    }
});

// Login Form Submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const remember = document.getElementById('remember').checked;
    
    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Show loading state
    loginSubmitBtn.classList.add('loading');
    loginSubmitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Simulate successful login
        showNotification('Login successful! Redirecting...', 'success');
        
        // Store login state
        localStorage.setItem('isLoggedIn', 'true');
        if (remember) {
            localStorage.setItem('rememberLogin', 'true');
            localStorage.setItem('userEmail', email);
        }
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    }, 2000);
});

// Reset Password Form Submission
resetForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = resetEmailInput.value.trim();
    
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    resetSubmitBtn.classList.add('loading');
    resetSubmitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Password reset link sent to your email!', 'success');
        forgotPasswordModal.classList.remove('active');
        resetForm.reset();
        
        // Reset button state
        setTimeout(() => {
            resetSubmitBtn.classList.remove('loading');
            resetSubmitBtn.disabled = false;
        }, 1000);
        
    }, 2000);
});

// Social Login Buttons
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const provider = this.classList.contains('google-btn') ? 'Google' : 'Facebook';
        showNotification(`${provider} login coming soon!`, 'info');
    });
});

// Signup Link
signupLink.addEventListener('click', function(e) {
    e.preventDefault();
    showNotification('Sign up page coming soon!', 'info');
});

// Email Validation Function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Set background color based on type
    let backgroundColor = '#17a2b8';
    if (type === 'success') backgroundColor = '#28a745';
    if (type === 'error') backgroundColor = '#dc3545';
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add animation keyframes if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 50%;
                transition: background 0.2s ease;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Form Input Focus Effects
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// Auto-fill email if remembered
document.addEventListener('DOMContentLoaded', function() {
    const rememberedEmail = localStorage.getItem('userEmail');
    const rememberLogin = localStorage.getItem('rememberLogin');
    
    if (rememberedEmail && rememberLogin === 'true') {
        emailInput.value = rememberedEmail;
        document.getElementById('remember').checked = true;
    }
    
    // Add focus to email input on page load
    emailInput.focus();
});

// Enhanced form validation with real-time feedback
emailInput.addEventListener('input', function() {
    const email = this.value.trim();
    if (email && !isValidEmail(email)) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#e1e5e9';
    }
});

passwordInput.addEventListener('input', function() {
    const password = this.value;
    if (password && password.length < 6) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#e1e5e9';
    }
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement === passwordInput) {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

// Add loading animation for better UX
function addLoadingAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .form-input:focus {
            transform: scale(1.02);
        }
        
        .login-submit-btn:active {
            transform: scale(0.98);
        }
        
        .social-btn:active {
            transform: scale(0.98);
        }
    `;
    document.head.appendChild(style);
}

// Initialize loading animations
addLoadingAnimation(); 