/**
 * Utility functions for Google Docs integration.
 */

/**
 * Extracts the Google Document ID from a standard Google Doc URL.
 * Matches formats:
 * - https://docs.google.com/document/d/DOC_ID/edit
 * - https://docs.google.com/document/d/DOC_ID/export?format=txt
 * - https://docs.google.com/document/d/DOC_ID/
 */
export function extractDocId(url: string): string | null {
    const docIdRegex = /\/document\/d\/([a-zA-Z0-9-_]{25,110})/;
    const match = url.match(docIdRegex);
    return match ? match[1] : null;
}

/**
 * Fetches the plain text of a Google Doc using a CORS proxy.
 * Google Doc must be shared publicly (Anyone with the link can view).
 */
export async function fetchGoogleDocText(docUrl: string): Promise<string> {
    const docId = extractDocId(docUrl);
    if (!docId) {
        throw new Error('Invalid Google Doc URL. Please check the link and try again.');
    }

    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt&cb=${Date.now()}`;
    
    // We use a CORS proxy to bypass standard browser origin blocks
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`;

    try {
        const response = await fetch(proxyUrl, { cache: 'no-store' });
        if (!response.ok) {
            if (response.status === 404 || response.status === 401 || response.status === 403) {
                throw new Error('Document access denied. Please verify your Google Doc is shared with "Anyone with the link" as a Viewer.');
            }
            throw new Error(`Google Doc fetch failed with status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text || text.trim().length === 0) {
            throw new Error('The retrieved document is empty.');
        }

        // Check if we received HTML (which usually happens if we get redirected to a login page instead of raw text)
        if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('<html')) {
            throw new Error('Failed to retrieve plain text. Please make sure the document is shared publicly (Anyone with the link -> Viewer).');
        }

        return text;
    } catch (error: any) {
        console.error('Error fetching Google Doc:', error);
        throw new Error(error.message || 'Network error. Please check your internet connection.');
    }
}
