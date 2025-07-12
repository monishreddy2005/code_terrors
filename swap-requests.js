// DOM Elements
const filterTabs = document.querySelectorAll('.filter-tab');
const requestCards = document.querySelectorAll('.request-card');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumbers = document.querySelectorAll('.page-number');
const requestsGrid = document.getElementById('requestsGrid');

// Current page and items per page
let currentPage = 1;
const itemsPerPage = 6;
let filteredCards = [...requestCards];

// Filter functionality
filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        // Remove active class from all tabs
        filterTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        filterRequests(filter);
    });
});

function filterRequests(filter) {
    if (filter === 'all') {
        filteredCards = [...requestCards];
    } else {
        filteredCards = [...requestCards].filter(card => card.dataset.status === filter);
    }
    
    // Reset to first page when filtering
    currentPage = 1;
    displayCards();
    updatePagination();
}

// Pagination functionality
function displayCards() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const cardsToShow = filteredCards.slice(startIndex, endIndex);
    
    // Hide all cards
    requestCards.forEach(card => {
        card.style.display = 'none';
    });
    
    // Show only cards for current page
    cardsToShow.forEach(card => {
        card.style.display = 'block';
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    
    // Update page numbers
    pageNumbers.forEach((number, index) => {
        if (index < totalPages) {
            number.style.display = 'block';
            number.classList.toggle('active', index + 1 === currentPage);
        } else {
            number.style.display = 'none';
        }
    });
    
    // Update navigation buttons
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

// Page navigation
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayCards();
        updatePagination();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayCards();
        updatePagination();
    }
});

// Page number clicks
pageNumbers.forEach(number => {
    number.addEventListener('click', function() {
        currentPage = parseInt(this.dataset.page);
        displayCards();
        updatePagination();
    });
});

// Button actions
document.addEventListener('click', function(e) {
    // Accept button
    if (e.target.closest('.btn-accept')) {
        const card = e.target.closest('.request-card');
        const userName = card.querySelector('.user-name').textContent;
        
        // Show loading state
        const btn = e.target.closest('.btn-accept');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accepting...';
        btn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Update status badge
            const statusBadge = card.querySelector('.status-badge');
            statusBadge.className = 'status-badge accepted';
            statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Accepted';
            
            // Update actions
            const actions = card.querySelector('.card-actions');
            actions.innerHTML = `
                <button class="btn-view-session">
                    <i class="fas fa-play"></i>
                    View Session
                </button>
                <button class="btn-message">
                    <i class="fas fa-envelope"></i>
                    Message
                </button>
            `;
            
            // Show success notification
            showNotification(`Accepted swap request from ${userName}!`, 'success');
        }, 1500);
    }
    
    // Reject button
    if (e.target.closest('.btn-reject')) {
        const card = e.target.closest('.request-card');
        const userName = card.querySelector('.user-name').textContent;
        
        // Show loading state
        const btn = e.target.closest('.btn-reject');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rejecting...';
        btn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Update status badge
            const statusBadge = card.querySelector('.status-badge');
            statusBadge.className = 'status-badge rejected';
            statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Rejected';
            
            // Update actions
            const actions = card.querySelector('.card-actions');
            actions.innerHTML = `
                <button class="btn-message">
                    <i class="fas fa-envelope"></i>
                    Message
                </button>
            `;
            
            // Show notification
            showNotification(`Rejected swap request from ${userName}.`, 'info');
        }, 1500);
    }
    
    // Message button
    if (e.target.closest('.btn-message')) {
        const card = e.target.closest('.request-card');
        const userName = card.querySelector('.user-name').textContent;
        showNotification(`Opening chat with ${userName}...`, 'info');
    }
    
    // View session button
    if (e.target.closest('.btn-view-session')) {
        const card = e.target.closest('.request-card');
        const userName = card.querySelector('.user-name').textContent;
        showNotification(`Opening session with ${userName}...`, 'info');
    }
});

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

// Profile dropdown functionality
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

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close notification if open
        const notification = document.querySelector('.notification');
        if (notification) {
            notification.remove();
        }
    }
});

// Add smooth scrolling
document.documentElement.style.scrollBehavior = 'smooth';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Animate page header
    const pageHeader = document.querySelector('.page-header');
    pageHeader.style.opacity = '0';
    pageHeader.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        pageHeader.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        pageHeader.style.opacity = '1';
        pageHeader.style.transform = 'translateY(0)';
    }, 100);
    
    // Animate request cards
    const cards = document.querySelectorAll('.request-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
    
    // Initialize pagination
    displayCards();
    updatePagination();
});

// Add hover effects for better UX
document.querySelectorAll('.request-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Add click functionality to user avatars to open user profile
document.querySelectorAll('.user-avatar').forEach(avatar => {
    avatar.addEventListener('click', function() {
        const userName = this.closest('.user-info').querySelector('.user-name').textContent;
        showNotification(`Opening ${userName}'s profile...`, 'info');
        
        // Simulate opening user profile page
        setTimeout(() => {
            window.location.href = 'user-profile.html';
        }, 1000);
    });
    
    // Add cursor pointer to indicate clickable
    avatar.style.cursor = 'pointer';
});

// Add click effects for buttons
document.querySelectorAll('.btn-accept, .btn-reject, .btn-message, .btn-view-session').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
}); 