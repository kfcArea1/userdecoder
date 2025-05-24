document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    });

    const loginForm = document.getElementById('loginForm');
    const showSignupLink = document.getElementById('showSignup');
    
    // Add floating label functionality
    document.querySelectorAll('.form-group input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.querySelector('label').classList.add('active');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentNode.querySelector('label').classList.remove('active');
            }
        });
        
        // Initialize labels for pre-filled values
        if (input.value) {
            input.parentNode.querySelector('label').classList.add('active');
        }
    });
    
    // Switch to signup form with animation
    showSignupLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Animate out login form
        loginForm.classList.add('form-transition');
        loginForm.style.opacity = '0';
        loginForm.style.pointerEvents = 'none';
        
        setTimeout(() => {
            loginForm.style.display = 'none';
            
            // Create and show signup form if it doesn't exist
            if (!document.getElementById('signupForm')) {
                createSignupForm();
            }
            
            const signupForm = document.getElementById('signupForm');
            signupForm.style.display = 'block';
            signupForm.style.opacity = '0';
            signupForm.classList.add('form-transition');
            
            setTimeout(() => {
                signupForm.style.opacity = '1';
            }, 50);
            
            // Change the toggle link
            document.querySelector('.toggle-text').innerHTML = 
                'Already have an account? <a href="#" id="showLogin">Login</a>';
            
            // Add event listener for the new login link
            document.getElementById('showLogin').addEventListener('click', showLoginForm);
        }, 300);
    });
    
    // Login form submission with loading state
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const storeId = document.getElementById('storeId').value;
        const password = document.getElementById('password').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        
        // Basic validation
        if (!storeId || !password) {
            showError(this, 'Please enter both Store ID and Password');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '';
        submitBtn.appendChild(spinner);
        spinner.style.display = 'block';
        
        try {
            
            const userCredential = await firebase.auth().signInWithEmailAndPassword(
                `${storeId}@storefeedback.com`, 
                password
            );
            
            // Get store data from Firestore
            const db = firebase.firestore();
            const storeDoc = await firebase.firestore().collection('stores').doc(storeId).get();
            if (!storeDoc.exists) {
                throw new Error('Store data not found!');
            }

            const storeData = storeDoc.data();
            
            // Store basic data in session
            sessionStorage.setItem('storeData', JSON.stringify({
                id: storeId,
                name: storeData.name,
                champsId: storeData.champsId,
                manager: storeData.manager,
                phone: storeData.phone,
                feedbackLinks: storeData.feedbackLinks || 0,
                totalResponses: storeData.totalResponses || 0,
                averageRating: storeData.averageRating || 0,
                status: storeData.status || 'active'
            }));

            // Show success and redirect
            submitBtn.innerHTML = 'Success!';
            submitBtn.style.backgroundColor = 'var(--success-color)';
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error("Login error:", error);
            
            // Custom error messages
            let errorMessage = error.message;
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Store ID not found';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Account temporarily locked due to many failed attempts';
            }
            
            showError(this, errorMessage);
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Login';
        }
    });
});

function showLoginForm(e) {
    if (e) e.preventDefault();
    
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    
    // Animate out signup form
    signupForm.classList.add('form-transition');
    signupForm.style.opacity = '0';
    signupForm.style.pointerEvents = 'none';
    
    setTimeout(() => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        loginForm.style.opacity = '0';
        loginForm.classList.add('form-transition');
        
        setTimeout(() => {
            loginForm.style.opacity = '1';
        }, 50);
        
        document.querySelector('.toggle-text').innerHTML = 
            'Don\'t have an account? <a href="#" id="showSignup">Sign up</a>';
        
        // Re-attach event listener for showSignup
        document.getElementById('showSignup').addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.add('form-transition');
            loginForm.style.opacity = '0';
            loginForm.style.pointerEvents = 'none';
            
            setTimeout(() => {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                signupForm.style.opacity = '0';
                signupForm.classList.add('form-transition');
                
                setTimeout(() => {
                    signupForm.style.opacity = '1';
                }, 50);
                
                document.querySelector('.toggle-text').innerHTML = 
                    'Already have an account? <a href="#" id="showLogin">Login</a>';
                
                document.getElementById('showLogin').addEventListener('click', showLoginForm);
            }, 300);
        });
    }, 300);
}

function createSignupForm() {
    const formContainer = document.querySelector('.form-container');
    const signupForm = document.createElement('form');
    signupForm.id = 'signupForm';
    signupForm.style.display = 'none';
    signupForm.innerHTML = `
        <h1>Create Account</h1>
        <div class="form-group">
            <input type="text" id="name" placeholder=" " required>
            <label for="name">Full Name</label>
        </div>
        <div class="form-group">
            <input type="tel" id="phone" placeholder=" " required>
            <label for="phone">Phone Number</label>
        </div>
        <div class="form-group">
            
            <input type="text" id="newStoreId" placeholder=" " required>
            
            <label for="newStoreId">Store ID(K123 :123)</label>
            <div class="store-id-check"></div>
        </div>
        <div class="form-group">
            <input type="text" id="champsId" placeholder=" " required>
            <label for="champsId">Champs ID</label>
        </div>
        <div class="form-group">
            <input type="text" id="storeName" placeholder=" " required>
            <label for="storeName">Store Name</label>
        </div>
        <div class="form-group">
            <input type="password" id="newPassword" placeholder=" " required>
            <label for="newPassword">Password</label>
        </div>
        <button type="submit" class="btn">Sign Up</button>
    `;
    
    formContainer.appendChild(signupForm);
    
    // Add floating label functionality to new inputs
    signupForm.querySelectorAll('.form-group input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.querySelector('label').classList.add('active');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentNode.querySelector('label').classList.remove('active');
            }
        });
    });

    // Add real-time Store ID availability check
    const storeIdInput = signupForm.querySelector('#newStoreId');
    storeIdInput.addEventListener('blur', async function() {
        const storeId = this.value;
        if (!storeId) return;
        
        const checkElement = this.parentNode.querySelector('.store-id-check');
        checkElement.textContent = 'Checking availability...';
        
        try {
            // Check if store exists in Firestore
            const storeDoc = await firebase.firestore().collection('stores').doc(storeId).get();
            
            // Check if auth account exists
            try {
                await firebase.auth().fetchSignInMethodsForEmail(`${storeId}@storefeedback.com`);
                checkElement.textContent = 'Store ID already exists';
                checkElement.style.color = 'var(--error-color)';
            } catch (error) {
                if (error.code === 'auth/invalid-email') {
                    checkElement.textContent = 'Store ID available';
                    checkElement.style.color = 'var(--success-color)';
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error("Check error:", error);
            checkElement.textContent = 'Error checking availability';
            checkElement.style.color = 'var(--error-color)';
        }
    });
    
    // Signup form submission with loading state
// In your createSignupForm() function, update the signup form submission handler:
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        storeId: document.getElementById('newStoreId').value.trim(),
        champsId: document.getElementById('champsId').value.trim(),
        storeName: document.getElementById('storeName').value.trim(),
        password: document.getElementById('newPassword').value
    };

    // Validate all fields
    if (!Object.values(formData).every(field => field)) {
        showError(this, 'Please fill in all fields');
        return;
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div>';

    try {
        // 1. Create Firebase Auth account
        const userCredential = await firebase.auth()
            .createUserWithEmailAndPassword(
                `${formData.storeId}@storefeedback.com`,
                formData.password
            );

        // 2. Prepare Firestore data
        const storeData = {
            storeId: formData.storeId,
            name: formData.storeName,
            champsId: formData.champsId,
            manager: formData.name,
            phone: formData.phone,
            email: `${formData.storeId}@storefeedback.com`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "active",
            feedbackLinks: 0,
            totalResponses: 0,
            averageRating: 0
        };

        // 3. Save to Firestore
        await db.collection('stores').doc(formData.storeId).set(storeData);

        // Success - redirect to login
        submitBtn.innerHTML = 'Success! Redirecting...';
        

    } catch (error) {
        console.error("Signup error:", error);
        
        // Handle specific errors
        let errorMsg = "Signup failed. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = "Store ID already exists";
        } else if (error.code === 'auth/weak-password') {
            errorMsg = "Password must be 6+ characters";
        } else if (error.code === 'permission-denied') {
            errorMsg = "Database error. Check Firestore rules";
        }

        showError(this, errorMsg);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign Up';
    }
});
}
// Updated error handling function
function showError(form, message) {
    let errorElement = form.querySelector('.error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        form.insertBefore(errorElement, form.querySelector('button[type="submit"]'));
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Add shake animation to form
    form.classList.add('shake');
    setTimeout(() => {
        form.classList.remove('shake');
    }, 500);
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});