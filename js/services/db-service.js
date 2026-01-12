/**
 * Database Service
 * Handles data operations with simulated async API calls
 * Currently uses LocalStorage with structure ready for Firebase migration
 */

class DatabaseService {
    constructor() {
        this.STORAGE_KEY = 'sp_reports_db';
        // Initialize storage if empty
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    }

    // --- Helpers ---
    _getReports() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch (e) {
            console.error('DB Corrupt, resetting', e);
            return [];
        }
    }

    _saveReports(reports) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                throw new Error('STORAGE_FULL');
            }
            throw e;
        }
    }

    _simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    }

    // --- Public API ---

    /**
     * Create a new report
     * @param {Object} reportData 
     */
    async createReport(reportData) {
        await this._simulateDelay();

        const reports = this._getReports();
        const newReport = {
            ...reportData,
            id: 'SP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000), // e.g., SP-2026-1234
            status: 'pending',
            createdAt: new Date().toISOString(),
            timeline: [
                {
                    status: 'pending',
                    message: 'ได้รับเรื่องร้องเรียนเรียบร้อยแล้ว',
                    timestamp: new Date().toISOString()
                }
            ],
            rating: null
        };

        // Compress images if handled in UI, but safety check here
        // In real Firebase, we would upload images to Storage and get URLs here

        reports.unshift(newReport);
        this._saveReports(reports);

        return newReport;
    }

    /**
     * Get report by tracking ID
     * @param {string} trackingId 
     */
    async getReportById(trackingId) {
        await this._simulateDelay();
        const reports = this._getReports();
        return reports.find(r => r.id === trackingId) || null;
    }

    /**
     * Get all reports (Admin only)
     * @param {Object} filters 
     */
    async getAllReports(filters = {}) {
        await this._simulateDelay();
        let reports = this._getReports();

        if (filters.status) {
            reports = reports.filter(r => r.status === filters.status);
        }

        if (filters.category) {
            reports = reports.filter(r => r.category === filters.category);
        }

        return reports;
    }

    /**
     * Update report status (Admin)
     * @param {string} id 
     * @param {string} newStatus 
     * @param {string} message 
     * @param {Object} extraData (after_images, etc)
     */
    async updateReportStatus(id, newStatus, message, extraData = {}) {
        await this._simulateDelay();
        const reports = this._getReports();
        const index = reports.findIndex(r => r.id === id);

        if (index === -1) throw new Error('REPORT_NOT_FOUND');

        const report = reports[index];
        report.status = newStatus;
        report.timeline.unshift({
            status: newStatus,
            message: message,
            timestamp: new Date().toISOString(),
            ...extraData
        });

        if (extraData.afterImages) {
            report.afterImages = extraData.afterImages;
        }

        this._saveReports(reports);
        return report;
    }

    /**
     * Add user rating
     * @param {string} id 
     * @param {number} score (1-5)
     * @param {string} comment 
     */
    async submitRating(id, score, comment) {
        await this._simulateDelay();
        const reports = this._getReports();
        const report = reports.find(r => r.id === id);

        if (!report) throw new Error('REPORT_NOT_FOUND');

        report.rating = {
            score,
            comment,
            timestamp: new Date().toISOString()
        };

        this._saveReports(reports);
        return true;
    }
}

// Export as global for simple usage without bundler
window.dbService = new DatabaseService();
