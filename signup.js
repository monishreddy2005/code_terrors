const backendUrl = 'http://localhost:5000';
let signupEmail = '';

// Step 1: Send code
document.getElementById('gmail-form').onsubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('signup-gmail').value.trim();
    document.getElementById('gmail-msg').textContent = '';
    if (!email.endsWith('@gmail.com')) {
        document.getElementById('gmail-msg').textContent = 'Please enter a valid Gmail address.';
        return;
    }
    const res = await fetch(`${backendUrl}/send_code`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email})
    });
    const data = await res.json();
    if (data.success) {
        signupEmail = email;
        document.getElementById('gmail-form').style.display = 'none';
        document.getElementById('code-form').style.display = 'block';
    } else {
        document.getElementById('gmail-msg').textContent = data.message;
    }
};

// Step 2: Verify code
document.getElementById('code-form').onsubmit = async function(e) {
    e.preventDefault();
    const code = document.getElementById('signup-code').value.trim();
    document.getElementById('code-msg').textContent = '';
    const res = await fetch(`${backendUrl}/verify_code`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: signupEmail, code})
    });
    const data = await res.json();
    if (data.success) {
        document.getElementById('code-form').style.display = 'none';
        document.getElementById('profile-form').style.display = 'block';
    } else {
        document.getElementById('code-msg').textContent = data.message;
    }
};

// Step 3: Register profile
document.getElementById('profile-form').onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const about = document.getElementById('signup-about').value.trim();
    const skills_offered = document.getElementById('signup-skills-offered').value.trim();
    const skills_wanted = document.getElementById('signup-skills-wanted').value.trim();
    const country = document.getElementById('signup-country').value.trim();
    const availability = document.getElementById('signup-availability').value.trim();
    const photoInput = document.getElementById('signup-photo');
    if (!photoInput.files[0]) {
        document.getElementById('profile-msg').textContent = 'Please upload a photo.';
        return;
    }
    // Convert photo to base64
    const reader = new FileReader();
    reader.onload = async function() {
        const photo = reader.result;
        const userData = {
            email: signupEmail,
            name,
            about,
            skills_offered,
            skills_wanted,
            country,
            availability,
            photo
        };
        const res = await fetch(`${backendUrl}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (data.success) {
            // Save user info to localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            window.location.href = 'login.html';
        } else {
            document.getElementById('profile-msg').textContent = data.message;
        }
    };
    reader.readAsDataURL(photoInput.files[0]);
}; 