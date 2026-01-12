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
        if (username === 'admin' && password === 'admin1234') {
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
        window.location.href = '../admin/login.html';
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
