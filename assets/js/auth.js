// Authentication Client-Side Handler
// Manages login, registration, and session management

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('billionairs_token');
        const storedUser = localStorage.getItem('billionairs_user');
        try {
            this.user = storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.warn('Corrupt user data in localStorage, resetting.');
            localStorage.removeItem('billionairs_user');
            localStorage.removeItem('billionairs_token');
            this.user = null;
            this.token = null;
        }
    }

    // Register new user
    async register(email, password, firstName = '', lastName = '') {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    email,
                    password,
                    firstName,
                    lastName
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Registration failed');
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
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            // Save token
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('billionairs_token', data.token);
            localStorage.setItem('billionairs_user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Verify current session
    async verifySession() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify',
                    token: this.token
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
            if (this.token) {
                await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'logout',
                        token: this.token
                    })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            this.user = null;
            localStorage.removeItem('billionairs_token');
            localStorage.removeItem('billionairs_user');
        }
    }

    // Update payment status after successful payment
    async updatePaymentStatus() {
        if (!this.token) {
            throw new Error('No active session');
        }

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_payment',
                    token: this.token
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Payment update failed');
            }

            this.user = data.user;
            localStorage.setItem('billionairs_user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Payment update error:', error);
            throw error;
        }
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.token && !!this.user;
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
