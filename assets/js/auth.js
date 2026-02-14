// Authentication Client-Side Handler
// Manages login, registration, and session management
// Uses HttpOnly cookies for token storage (secure, XSS-proof)

class AuthManager {
    constructor() {
        // Token is now stored in HttpOnly cookie (not accessible via JS)
        // Only user display data remains in localStorage
        const storedUser = localStorage.getItem('billionairs_user');
        try {
            this.user = storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.warn('Corrupt user data in localStorage, resetting.');
            localStorage.removeItem('billionairs_user');
            this.user = null;
        }
        // Clean up legacy token from localStorage (migration)
        localStorage.removeItem('billionairs_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('authToken');
    }

    // Register new user
    async register(email, password, firstName = '', lastName = '') {
        try {
            const language = localStorage.getItem('billionairs_lang') || navigator.language?.split('-')[0] || 'en';
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'register',
                    email,
                    password,
                    firstName,
                    lastName,
                    language
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || data.message || 'Registration failed');
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const language = localStorage.getItem('billionairs_lang') || navigator.language?.split('-')[0] || 'en';
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password,
                    language
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || data.message || 'Login failed');
            }

            // Save user display data only (token is in HttpOnly cookie)
            this.user = data.user;
            localStorage.setItem('billionairs_user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Verify current session
    async verifySession() {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'verify'
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                this.logout();
                return false;
            }

            this.user = data.user;
            localStorage.setItem('billionairs_user', JSON.stringify(data.user));
            return true;
        } catch (error) {
            console.error('Session verification error:', error);
            this.logout();
            return false;
        }
    }

    // Logout user
    async logout() {
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'logout'
                })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.user = null;
            localStorage.removeItem('billionairs_user');
            localStorage.removeItem('billionairs_token');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user_data');
        }
    }

    // Update payment status after successful payment
    async updatePaymentStatus() {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'update_payment'
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || data.message || 'Payment update failed');
            }

            this.user = data.user;
            localStorage.setItem('billionairs_user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Payment update error:', error);
            throw error;
        }
    }

    // Check if user is logged in (based on cached user data)
    isLoggedIn() {
        return !!this.user;
    }

    // Check if user has paid
    hasPaid() {
        return this.user && this.user.paymentStatus === 'paid';
    }

    // Get current user
    getUser() {
        return this.user;
    }
}

// Initialize global auth manager
window.authManager = new AuthManager();
