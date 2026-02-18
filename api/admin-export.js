/**
 * Admin Export API
 * Exports data in various formats (CSV, JSON, PDF)
 */

import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const url = new URL(req.url);
        const type = url.searchParams.get('type');
        const format = url.searchParams.get('format') || 'csv';

        const sql = neon(process.env.DATABASE_URL);

        let data, filename, contentType;

        switch (type) {
            case 'users':
                data = await sql`SELECT * FROM users ORDER BY created_at DESC`;
                filename = `users-${new Date().toISOString().split('T')[0]}`;
                break;

            case 'payments':
                data = await sql`SELECT * FROM payments ORDER BY created_at DESC`;
                filename = `payments-${new Date().toISOString().split('T')[0]}`;
                break;

            case 'chat':
                data = await sql`SELECT * FROM chat_messages ORDER BY created_at DESC`;
                filename = `chat-${new Date().toISOString().split('T')[0]}`;
                break;

            case 'audit-logs':
                data = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC`;
                filename = `audit-logs-${new Date().toISOString().split('T')[0]}`;
                break;

            case 'refunds':
                data = await sql`SELECT * FROM refunds ORDER BY created_at DESC`;
                filename = `refunds-${new Date().toISOString().split('T')[0]}`;
                break;

            default:
                return new Response(JSON.stringify({ error: 'Invalid type' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        // Format data
        let exportContent;

        switch (format) {
            case 'csv':
                exportContent = convertToCSV(data);
                contentType = 'text/csv';
                filename += '.csv';
                break;

            case 'json':
                exportContent = JSON.stringify(data, null, 2);
                contentType = 'application/json';
                filename += '.json';
                break;

            case 'txt':
                exportContent = convertToText(data);
                contentType = 'text/plain';
                filename += '.txt';
                break;

            default:
                exportContent = convertToCSV(data);
                contentType = 'text/csv';
                filename += '.csv';
        }

        return new Response(exportContent, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return new Response(JSON.stringify({ 
            error: 'Export failed',
            message: 'Internal server error' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            
            // Handle special characters
            if (value === null || value === undefined) {
                return '';
            }
            
            // Escape quotes and wrap in quotes if contains comma/newline
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            
            return stringValue;
        });
        
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Convert data to plain text format
 */
function convertToText(data) {
    if (!data || data.length === 0) {
        return 'No data';
    }

    let text = '';

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        text += `=== Entry ${i + 1} ===\n`;
        
        for (const [key, value] of Object.entries(row)) {
            text += `${key}: ${value}\n`;
        }
        
        text += '\n';
    }

    return text;
}
