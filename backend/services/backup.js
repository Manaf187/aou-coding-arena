
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../arena.db');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    try {
        fs.mkdirSync(BACKUP_DIR);
    } catch (e) {
        console.error("[BACKUP] Failed to create backup directory:", e);
    }
}

/**
 * Starts the periodic backup service.
 * Interval: 5 minutes
 * Retention: Last 20 Backups
 */
const startBackupService = () => {
    console.log("[BACKUP] Service Initialized. Snapshots every 5 minutes.");
    
    // Run immediately on start
    performBackup();

    setInterval(() => {
        performBackup();
    }, 5 * 60 * 1000); // 5 minutes
};

const performBackup = () => {
    if (!fs.existsSync(DB_PATH)) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(BACKUP_DIR, `arena_backup_${timestamp}.db`);
    
    // Copy the file
    fs.copyFile(DB_PATH, dest, (err) => {
        if (err) {
            console.error("[BACKUP] Failed to create snapshot:", err);
            return;
        }
        console.log(`[BACKUP] Snapshot created: ${path.basename(dest)}`);
        
        // Cleanup old backups (Keep last 20)
        cleanupOldBackups();
    });
};

const cleanupOldBackups = () => {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return;
        
        const dbFiles = files.filter(f => f.startsWith('arena_backup_') && f.endsWith('.db'));
        
        if (dbFiles.length > 20) {
            // Sort by name (which includes timestamp) ascending
            const sorted = dbFiles.sort();
            
            // Delete the oldest ones
            const filesToDelete = sorted.slice(0, dbFiles.length - 20);
            
            filesToDelete.forEach(file => {
                fs.unlink(path.join(BACKUP_DIR, file), (err) => {
                    if (!err) console.log(`[BACKUP] Pruned old snapshot: ${file}`);
                });
            });
        }
    });
};

module.exports = startBackupService;
