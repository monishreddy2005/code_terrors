// DOM Elements
const profileImage = document.getElementById('profileImage');
const imageUpload = document.getElementById('imageUpload');
const userName = document.getElementById('userName');
const editNameBtn = document.getElementById('editNameBtn');
const userLocation = document.getElementById('userLocation');
const userDescription = document.getElementById('userDescription');
const addOfferedSkill = document.getElementById('addOfferedSkill');
const addWantedSkill = document.getElementById('addWantedSkill');
const saveModal = document.getElementById('saveModal');
const closeSaveModal = document.getElementById('closeSaveModal');
const discardChanges = document.getElementById('discardChanges');
const saveChanges = document.getElementById('saveChanges');
const discardBtn = document.getElementById('discardBtn');
const saveBtn = document.getElementById('saveBtn');

// Track changes
let hasUnsavedChanges = false;
let originalData = {};

// Initialize original data
function initializeOriginalData() {
    originalData = {
        name: userName.textContent,
        location: userLocation.value,
        description: userDescription.value,
        offeredSkills: getSkillsList('offeredSkillsList'),
        wantedSkills: getSkillsList('wantedSkillsList'),
        availability: {
            weekdays: document.getElementById('weekdays').checked,
            weekends: document.getElementById('weekends').checked,
            evenings: document.getElementById('evenings').checked,
            flexible: document.getElementById('flexible').checked
        },
        privacy: {
            profilePublic: document.getElementById('profilePublic').checked,
            showLocation: document.getElementById('showLocation').checked,
            showEmail: document.getElementById('showEmail').checked
        }
    };
}

// Get skills from a list
function getSkillsList(listId) {
    const skillsList = document.getElementById(listId);
    const skills = [];
    skillsList.querySelectorAll('.skill-tag').forEach(tag => {
        skills.push(tag.dataset.skill);
    });
    return skills;
}

// Image upload functionality
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profileImage.src = e.target.result;
            markAsChanged();
        };
        reader.readAsDataURL(file);
    }
});

// Name editing functionality
editNameBtn.addEventListener('click', function() {
    userName.contentEditable = true;
    userName.focus();
    userName.style.background = 'rgba(255, 255, 255, 0.1)';
    userName.style.padding = '0.5rem 1rem';
    userName.style.borderRadius = '10px';
    userName.style.border = '2px solid rgba(255, 255, 255, 0.5)';
});

userName.addEventListener('blur', function() {
    userName.contentEditable = false;
    userName.style.background = 'transparent';
    userName.style.padding = '0';
    userName.style.borderRadius = '0';
    userName.style.border = 'none';
    
    if (userName.textContent !== originalData.name) {
        markAsChanged();
    }
});

userName.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        userName.blur();
    }
});

// Location editing
userLocation.addEventListener('input', function() {
    if (this.value !== originalData.location) {
        markAsChanged();
    }
});

// Description editing
userDescription.addEventListener('input', function() {
    if (this.value !== originalData.description) {
        markAsChanged();
    }
});

// Skills management
function addSkill(type) {
    const input = type === 'offered' ? addOfferedSkill : addWantedSkill;
    const listId = type === 'offered' ? 'offeredSkillsList' : 'wantedSkillsList';
    const skill = input.value.trim();
    
    if (skill) {
        const skillsList = document.getElementById(listId);
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.dataset.skill = skill;
        skillTag.innerHTML = `
            ${skill}
            <button class="remove-skill" onclick="removeSkill(this, '${type}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        skillsList.appendChild(skillTag);
        input.value = '';
        markAsChanged();
        
        // Add animation
        skillTag.style.opacity = '0';
        skillTag.style.transform = 'scale(0.8)';
        setTimeout(() => {
            skillTag.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            skillTag.style.opacity = '1';
            skillTag.style.transform = 'scale(1)';
        }, 10);
    }
}

function removeSkill(button, type) {
    const skillTag = button.closest('.skill-tag');
    skillTag.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    skillTag.style.opacity = '0';
    skillTag.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        skillTag.remove();
        markAsChanged();
    }, 300);
}

// Add skill on Enter key
addOfferedSkill.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkill('offered');
    }
});

addWantedSkill.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkill('wanted');
    }
});

// Availability checkboxes
document.querySelectorAll('#weekdays, #weekends, #evenings, #flexible').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const currentAvailability = {
            weekdays: document.getElementById('weekdays').checked,
            weekends: document.getElementById('weekends').checked,
            evenings: document.getElementById('evenings').checked,
            flexible: document.getElementById('flexible').checked
        };
        
        if (JSON.stringify(currentAvailability) !== JSON.stringify(originalData.availability)) {
            markAsChanged();
        }
    });
});

// Privacy toggles
document.querySelectorAll('#profilePublic, #showLocation, #showEmail').forEach(toggle => {
    toggle.addEventListener('change', function() {
        const currentPrivacy = {
            profilePublic: document.getElementById('profilePublic').checked,
            showLocation: document.getElementById('showLocation').checked,
            showEmail: document.getElementById('showEmail').checked
        };
        
        if (JSON.stringify(currentPrivacy) !== JSON.stringify(originalData.privacy)) {
            markAsChanged();
        }
    });
});

// Mark as changed
function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveButton();
    
    // Add unsaved changes indicator
    const contentContainer = document.querySelector('.content-single-column');
    contentContainer.classList.add('has-unsaved-changes');
}

// Update save button visibility
function updateSaveButton() {
    if (hasUnsavedChanges) {
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        saveBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    } else {
        saveBtn.style.opacity = '0.5';
        saveBtn.style.cursor = 'not-allowed';
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> All Changes Saved';
        saveBtn.style.background = '#6c757d';
    }
}

// Save changes
function saveAllChanges() {
    // Simulate API call
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving Changes...';
    saveBtn.disabled = true;
    saveBtn.style.background = 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)';
    
    setTimeout(() => {
        // Update original data
        originalData = {
            name: userName.textContent,
            location: userLocation.value,
            description: userDescription.value,
            offeredSkills: getSkillsList('offeredSkillsList'),
            wantedSkills: getSkillsList('wantedSkillsList'),
            availability: {
                weekdays: document.getElementById('weekdays').checked,
                weekends: document.getElementById('weekends').checked,
                evenings: document.getElementById('evenings').checked,
                flexible: document.getElementById('flexible').checked
            },
            privacy: {
                profilePublic: document.getElementById('profilePublic').checked,
                showLocation: document.getElementById('showLocation').checked,
                showEmail: document.getElementById('showEmail').checked
            }
        };
        
        hasUnsavedChanges = false;
        
        // Remove unsaved changes indicator
        const contentContainer = document.querySelector('.content-single-column');
        contentContainer.classList.remove('has-unsaved-changes');
        
        // Show success state briefly
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved Successfully!';
        saveBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(() => {
            updateSaveButton();
        }, 1500);
        
        // Show success notification
        showNotification('Profile updated successfully!', 'success');
    }, 2000);
}

// Discard changes
function discardAllChanges() {
    // Reset name
    userName.textContent = originalData.name;
    
    // Reset location
    userLocation.value = originalData.location;
    
    // Reset description
    userDescription.value = originalData.description;
    
    // Reset skills
    resetSkills('offeredSkillsList', originalData.offeredSkills);
    resetSkills('wantedSkillsList', originalData.wantedSkills);
    
    // Reset availability
    document.getElementById('weekdays').checked = originalData.availability.weekdays;
    document.getElementById('weekends').checked = originalData.availability.weekends;
    document.getElementById('evenings').checked = originalData.availability.evenings;
    document.getElementById('flexible').checked = originalData.availability.flexible;
    
    // Reset privacy
    document.getElementById('profilePublic').checked = originalData.privacy.profilePublic;
    document.getElementById('showLocation').checked = originalData.privacy.showLocation;
    document.getElementById('showEmail').checked = originalData.privacy.showEmail;
    
    hasUnsavedChanges = false;
    updateSaveButton();
    
    // Remove unsaved changes indicator
    const contentContainer = document.querySelector('.content-single-column');
    contentContainer.classList.remove('has-unsaved-changes');
    
    showNotification('Changes discarded.', 'info');
}

function resetSkills(listId, skills) {
    const skillsList = document.getElementById(listId);
    skillsList.innerHTML = '';
    
    skills.forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.dataset.skill = skill;
        skillTag.innerHTML = `
            ${skill}
            <button class="remove-skill" onclick="removeSkill(this, '${listId.includes('offered') ? 'offered' : 'wanted'}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        skillsList.appendChild(skillTag);
    });
}

// Message button functionality
document.querySelector('.message-btn').addEventListener('click', function(e) {
    e.preventDefault();
    showNotification('Opening messaging feature...', 'info');
});

// Modal functionality
function openSaveModal() {
    saveModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSaveModal() {
    saveModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

closeSaveModal.addEventListener('click', closeSaveModal);
discardChanges.addEventListener('click', function() {
    closeSaveModal();
    discardAllChanges();
});

saveChanges.addEventListener('click', function() {
    closeSaveModal();
    saveAllChanges();
});

// Action buttons event listeners
discardBtn.addEventListener('click', function() {
    if (hasUnsavedChanges) {
        discardAllChanges();
    }
});

saveBtn.addEventListener('click', function() {
    if (hasUnsavedChanges) {
        saveAllChanges();
    }
});

// Close modal when clicking outside
saveModal.addEventListener('click', function(e) {
    if (e.target === saveModal) {
        closeSaveModal();
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
        
        // Close modal if open
        if (saveModal.style.display === 'block') {
            closeSaveModal();
        }
    }
    
    // Save with Ctrl+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !saveBtn.disabled) {
            saveAllChanges();
        }
    }
});

// Add smooth scrolling
document.documentElement.style.scrollBehavior = 'smooth';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize original data
    initializeOriginalData();
    
    // Set initial save button state
    updateSaveButton();
    
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
    const contentSections = document.querySelectorAll('.content-single-column > div');
    contentSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 800 + (index * 200));
    });
    
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
    setTimeout(animateStats, 1000);
});

// Warn before leaving if there are unsaved changes
window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
}); 