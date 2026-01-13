/**
 * Database Service
 * Handles data operations with Firebase Firestore
 * Replaces LocalStorage for cross-device synchronization
 */

class DatabaseService {
    constructor() {
        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(window.firebaseConfig);
        }
        this.db = firebase.firestore();
        this.collectionName = 'reports';
    }

    // --- Public API ---

    /**
     * Create a new report
     * @param {Object} reportData 
     */
    async createReport(reportData) {
        const id = 'ST-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        const newReport = {
            ...reportData,
            id: id,
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

        // Save to Firestore using tracking ID as document name for easier retrieval
        await this.db.collection(this.collectionName).doc(id).set(newReport);
        return newReport;
    }

    /**
     * Get report by tracking ID
     * @param {string} trackingId 
     */
    async getReportById(trackingId) {
        try {
            const doc = await this.db.collection(this.collectionName).doc(trackingId).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.error('Firestore Error:', e);
            throw e;
        }
    }

    /**
     * Get all reports (Admin only)
     * @param {Object} filters 
     */
    async getAllReports(filters = {}) {
        try {
            let query = this.db.collection(this.collectionName).orderBy('createdAt', 'desc');

            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }

            const snapshot = await query.get();
            const reports = [];
            snapshot.forEach(doc => reports.push(doc.data()));
            return reports;
        } catch (e) {
            console.error('Firestore Error:', e);
            return [];
        }
    }

    /**
     * Update report status (Admin)
     * @param {string} id 
     * @param {string} newStatus 
     * @param {string} message 
     * @param {Object} extraData (after_images, etc)
     */
    async updateReportStatus(id, newStatus, message, extraData = {}) {
        const docRef = this.db.collection(this.collectionName).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) throw new Error('REPORT_NOT_FOUND');

        const report = doc.data();

        const updatedTimeline = [
            {
                status: newStatus,
                message: message,
                timestamp: new Date().toISOString(),
                ...extraData
            },
            ...report.timeline
        ];

        const updates = {
            status: newStatus,
            timeline: updatedTimeline
        };

        if (extraData.afterImages) {
            updates.afterImages = extraData.afterImages;
        }

        await docRef.update(updates);
        return { ...report, ...updates };
    }

    /**
     * Add user rating
     * @param {string} id 
     * @param {number} score (1-5)
     * @param {string} comment 
     */
    async submitRating(id, score, comment) {
        const docRef = this.db.collection(this.collectionName).doc(id);
        const rating = {
            score,
            comment,
            timestamp: new Date().toISOString()
        };

        await docRef.update({ rating: rating });
        return true;
    }
}

// Export as global for simple usage without bundler
window.dbService = new DatabaseService();
