#!/usr/bin/env node

/**
 * Clear WhatsApp Session Script
 * Removes all WhatsApp authentication data to force re-login
 */

const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.join(__dirname, '../.wwebjs_auth');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

/**
 * Recursively delete directory
 */
function deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);

            if (fs.lstatSync(curPath).isDirectory()) {
                deleteDirectory(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(dirPath);
    }
}

/**
 * Main execution
 */
function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Clear WhatsApp Session & Temporary Files');
    console.log('═══════════════════════════════════════════════════════\n');

    let clearedItems = 0;

    // Clear WhatsApp session
    if (fs.existsSync(SESSION_DIR)) {
        console.log('🗑️  Removing WhatsApp session data...');
        try {
            deleteDirectory(SESSION_DIR);
            console.log('✅ WhatsApp session cleared');
            clearedItems++;
        } catch (err) {
            console.error('❌ Error clearing WhatsApp session:', err.message);
        }
    } else {
        console.log('ℹ️  No WhatsApp session found');
    }

    // Clear uploads directory
    if (fs.existsSync(UPLOADS_DIR)) {
        console.log('\n🗑️  Removing temporary uploads...');
        try {
            deleteDirectory(UPLOADS_DIR);
            console.log('✅ Uploads directory cleared');
            clearedItems++;
        } catch (err) {
            console.error('❌ Error clearing uploads:', err.message);
        }
    } else {
        console.log('ℹ️  No uploads directory found');
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    if (clearedItems > 0) {
        console.log(`✅ Cleanup complete! Cleared ${clearedItems} item(s).`);
        console.log('You will need to scan the QR code again on next launch.');
    } else {
        console.log('ℹ️  Nothing to clear.');
    }
    console.log('═══════════════════════════════════════════════════════\n');
}

// Run
main();
