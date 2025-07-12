// DOM Elements
const guestActions = document.getElementById('guestActions');
const userActions = document.getElementById('userActions');
const logoutBtn = document.getElementById('logoutBtn');

// Check login status on page load
// Now, use 'user' in localStorage to determine login state
function isUserLoggedIn() {
    return !!localStorage.getItem('user');
}

document.addEventListener('DOMContentLoaded', function() {
    updateHeaderVisibility();
    updateProfileSidebarVisibility();
    updateRequestSwapButtons();
});

function updateHeaderVisibility() {
    const loggedIn = isUserLoggedIn();
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');
    if (loggedIn) {
        guestActions.style.display = 'none';
        userActions.style.display = 'flex';
    } else {
        guestActions.style.display = 'flex';
        userActions.style.display = 'none';
    }
}

function updateProfileSidebarVisibility() {
    const loggedIn = isUserLoggedIn();
    const profileSidebar = document.getElementById('profileSidebar');
    if (profileSidebar) {
        profileSidebar.style.display = loggedIn ? 'block' : 'none';
    }
}

// Update request swap button logic to allow logged-in users
function updateRequestSwapButtons() {
    const requestButtons = document.querySelectorAll('.request-btn');
    requestButtons.forEach(button => {
        button.onclick = function(e) {
            e.stopPropagation();
            if (!isUserLoggedIn()) {
                // Show modal for guests
                const guestModal = document.getElementById('guestModal');
                if (guestModal) guestModal.style.display = 'block';
                return;
            }
            // Allow swap request for logged-in users
            const userCard = this.closest('.user-card');
            const userName = userCard.querySelector('.user-name').textContent;
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
        };
    });
}

// Modal close and register button logic
const guestModal = document.getElementById('guestModal');
if (guestModal) {
    document.getElementById('closeModalBtn').onclick = function() {
        guestModal.style.display = 'none';
    };
    document.getElementById('modalRegisterBtn').onclick = function() {
        window.location.href = 'signup.html';
    };
}

// User card click functionality
// Only allow full profile view for logged-in users
const userCards = document.querySelectorAll('.user-card');
userCards.forEach(card => {
    card.addEventListener('click', function(e) {
        if (e.target.closest('.request-btn')) return;
        if (!isUserLoggedIn()) {
            // Show modal for guests
            const guestModal = document.getElementById('guestModal');
            if (guestModal) guestModal.style.display = 'block';
            return;
        }
        const userName = this.querySelector('.user-name').textContent;
        showNotification(`Opening ${userName}'s profile...`, 'info');
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