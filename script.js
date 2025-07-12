// DOM Elements
const guestActions = document.getElementById('guestActions');
const userActions = document.getElementById('userActions');
const logoutBtn = document.getElementById('logoutBtn');

// Check login status on page load
document.addEventListener('DOMContentLoaded', function() {
    updateHeaderVisibility();
    updateProfileSidebarVisibility();
});

// Function to update header visibility based on login status
function updateHeaderVisibility() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');
    
    if (isLoggedIn) {
        guestActions.style.display = 'none';
        userActions.style.display = 'flex';
    } else {
        guestActions.style.display = 'flex';
        userActions.style.display = 'none';
    }
}

// Function to update profile sidebar visibility
function updateProfileSidebarVisibility() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const profileSidebar = document.getElementById('profileSidebar');
    
    if (profileSidebar) {
        if (isLoggedIn) {
            profileSidebar.style.display = 'block';
        } else {
            profileSidebar.style.display = 'none';
        }
    }
}

// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            updateHeaderVisibility();
            updateProfileSidebarVisibility();
            
            // Redirect to login page or refresh current page
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.reload();
            } else {
                window.location.href = 'index.html';
            }
        });
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

// Request swap button functionality
document.addEventListener('DOMContentLoaded', function() {
    const requestButtons = document.querySelectorAll('.request-btn');
    
    requestButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click when button is clicked
            
            // Check if user is logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            
            if (!isLoggedIn) {
                alert('Please log in to request a skill swap.');
                window.location.href = 'login.html';
                return;
            }
            
            // Get user info from the card
            const userCard = this.closest('.user-card');
            const userName = userCard.querySelector('.user-name').textContent;
            
            // Show success message
            const originalText = this.textContent;
            this.textContent = 'Request Sent!';
            this.style.background = '#28a745';
            this.style.borderColor = '#28a745';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.style.borderColor = '';
            }, 2000);
            
            console.log(`Swap request sent to ${userName}`);
        });
    });
});

// User card click functionality
document.querySelectorAll('.user-card').forEach(card => {
    card.addEventListener('click', function(e) {
        // Don't navigate if clicking on request button
        if (e.target.closest('.request-btn')) {
            return;
        }
        
        const userName = this.querySelector('.user-name').textContent;
        showNotification(`Opening ${userName}'s profile...`, 'info');
        
        // Simulate opening profile page
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1000);
    });
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const userCards = document.querySelectorAll('.user-card');
            
            userCards.forEach(card => {
                const userName = card.querySelector('.user-name').textContent.toLowerCase();
                const skillsOffered = card.querySelector('.skills-offered p').textContent.toLowerCase();
                const skillsWanted = card.querySelector('.skills-wanted p').textContent.toLowerCase();
                
                const matches = userName.includes(searchTerm) || 
                              skillsOffered.includes(searchTerm) || 
                              skillsWanted.includes(searchTerm);
                
                card.style.display = matches ? 'block' : 'none';
            });
        });
    }
});

// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // Implement filter logic here
            console.log('Filter changed:', this.value);
        });
    });
});

// Pagination functionality
document.addEventListener('DOMContentLoaded', function() {
    const usersPerPage = 6;
    const userCards = document.querySelectorAll('.user-card');
    const totalUsers = userCards.length;
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    
    let currentPage = 1;
    
    function showPage(page) {
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        
        userCards.forEach((card, index) => {
            if (index >= startIndex && index < endIndex) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update pagination info
        const startRange = document.getElementById('startRange');
        const endRange = document.getElementById('endRange');
        const totalItems = document.getElementById('totalItems');
        
        if (startRange && endRange && totalItems) {
            startRange.textContent = startIndex + 1;
            endRange.textContent = Math.min(endIndex, totalUsers);
            totalItems.textContent = totalUsers;
        }
        
        // Update pagination buttons
        updatePaginationButtons(page);
    }
    
    function updatePaginationButtons(activePage) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const paginationNumbers = document.getElementById('paginationNumbers');
        
        if (prevBtn) prevBtn.disabled = activePage === 1;
        if (nextBtn) nextBtn.disabled = activePage === totalPages;
        
        if (paginationNumbers) {
            paginationNumbers.innerHTML = '';
            
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `page-number ${i === activePage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.dataset.page = i;
                pageBtn.addEventListener('click', () => goToPage(i));
                paginationNumbers.appendChild(pageBtn);
            }
        }
    }
    
    function goToPage(page) {
        currentPage = page;
        showPage(page);
    }
    
    // Initialize pagination
    if (totalPages > 1) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    goToPage(currentPage - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    goToPage(currentPage + 1);
                }
            });
        }
        
        showPage(1);
    }
});

// Add loading animation to cards
document.addEventListener('DOMContentLoaded', function() {
    const userCards = document.querySelectorAll('.user-card');
    
    userCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
});

// Add hover effects for better UX
document.querySelectorAll('.user-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Add click effects for buttons
document.querySelectorAll('.request-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
});

// Add smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Handle window resize for responsive design
window.addEventListener('resize', function() {
    // Add any responsive adjustments here
    console.log('Window resized');
});

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Escape key to close any open modals or dropdowns
    if (e.key === 'Escape') {
        // Close any open modals or dropdowns
        console.log('Escape key pressed');
    }
    
    // Enter key to submit forms
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('search-input')) {
            // Trigger search
            console.log('Search triggered by Enter key');
        }
    }
}); 