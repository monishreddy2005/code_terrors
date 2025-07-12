// DOM Elements
const requestSwapBtn = document.querySelector('.request-swap-btn');
const messageBtn = document.querySelector('.message-btn');
const swapRequestsBtn = document.querySelector('.swap-requests-btn');
const modal = document.getElementById('swapModal');
const closeModal = document.getElementById('closeModal');
const cancelSwap = document.getElementById('cancelSwap');
const swapRequestForm = document.getElementById('swapRequestForm');

// Request Swap Button Functionality - Opens Modal
requestSwapBtn.addEventListener('click', function(e) {
    e.preventDefault();
    openModal();
});

// Modal Functions
function openModal() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus on first select element
    setTimeout(() => {
        document.getElementById('offeredSkill').focus();
    }, 100);
}

function closeModalFunction() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    
    // Reset form
    swapRequestForm.reset();
}

// Close modal when clicking close button
closeModal.addEventListener('click', closeModalFunction);

// Close modal when clicking cancel button
cancelSwap.addEventListener('click', closeModalFunction);

// Close modal when clicking outside the modal content
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModalFunction();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModalFunction();
    }
});

// Handle form submission
swapRequestForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const offeredSkill = document.getElementById('offeredSkill').value;
    const wantedSkill = document.getElementById('wantedSkill').value;
    const message = document.getElementById('message').value;
    
    if (!offeredSkill || !wantedSkill) {
        showNotification('Please select both offered and wanted skills.', 'error');
        return;
    }
    
    // Disable submit button and show loading state
    const submitBtn = this.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Show success notification
        showNotification(`Skill swap request sent! You're offering ${offeredSkill} for ${wantedSkill}.`, 'success');
        
        // Close modal
        closeModalFunction();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Message Button Functionality
messageBtn.addEventListener('click', function(e) {
    e.preventDefault();
    showNotification('Messaging feature coming soon!', 'info');
});

// Swap Requests Button Functionality - Now links to actual page
// No additional functionality needed as it's handled by the href

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

// Add hover effects for better UX
document.querySelectorAll('.skill-tag').forEach(tag => {
    tag.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });
    
    tag.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Add click effects for activity items
document.querySelectorAll('.activity-item').forEach(item => {
    item.addEventListener('click', function() {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close notification if open
        const notification = document.querySelector('.notification');
        if (notification) {
            notification.remove();
        }
        
        // Close modal if open
        if (modal.style.display === 'block') {
            closeModalFunction();
        }
    }
});

// Add smooth scrolling for better UX
document.documentElement.style.scrollBehavior = 'smooth';

// Add loading animation for page load
document.addEventListener('DOMContentLoaded', function() {
    // Animate profile header elements
    const profileElements = document.querySelectorAll('.profile-avatar, .profile-info, .profile-actions');
    profileElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Animate content sections
    const contentSections = document.querySelectorAll('.content-grid > div');
    contentSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 800 + (index * 200));
    });
});

// Add rating hover effects
document.querySelectorAll('.review-rating i').forEach(star => {
    star.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.2)';
        this.style.color = '#ffc107';
    });
    
    star.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.color = '#ffc107';
    });
});

// Add profile dropdown functionality
const profileMenu = document.querySelector('.profile-menu');
const profileDropdown = document.querySelector('.profile-dropdown');

if (profileMenu && profileDropdown) {
    profileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        if (profileDropdown) {
            profileDropdown.style.display = 'none';
        }
    });
}

// Add stats counter animation
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 50;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current);
        }, 30);
    });
}

// Trigger stats animation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateStats, 1000);
});

// Add skill tag click functionality
document.querySelectorAll('.skill-tag').forEach(tag => {
    tag.addEventListener('click', function() {
        const skill = this.textContent;
        showNotification(`Searching for users with "${skill}" skills...`, 'info');
    });
});

// Add review interaction
document.querySelectorAll('.review-item').forEach(review => {
    review.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
    });
    
    review.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    });
}); 