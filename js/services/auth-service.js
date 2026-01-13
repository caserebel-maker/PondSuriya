/**
 * Authentication Service
 * Handles admin login/logout
 */

class AuthService {
    constructor() {
        this.SESSION_KEY = 'sp_admin_session';
    }

    async login(username, password) {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Hardcoded credentials for prototype
        if (username === 'pondsuriya' && password === 'Suriy@24') {
            const token = 'admin-token-' + Date.now();
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
                token: token,
                user: 'Admin',
                role: 'super_admin'
            }));
            return true;
        }

        throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        // Redirect to the home page URL as requested
        window.location.href = 'https://caserebel-maker.github.io/PondSuriya/';
    }

    isAuthenticated() {
        const session = sessionStorage.getItem(this.SESSION_KEY);
        return !!session;
    }

    getUser() {
        return JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
    }

    // Middleware check for admin pages
    checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
}

window.authService = new AuthService();
