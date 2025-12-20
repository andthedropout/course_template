// Get project name from environment (for unique cookie names per project)
const PROJECT_NAME = import.meta.env.VITE_PROJECT_NAME || 'django';

// Get the actual cookie name used by Django based on project name
export function getCookieName(baseName: 'csrftoken' | 'sessionid'): string {
    return `${PROJECT_NAME}_${baseName}`;
}

export function getCookie(name: string): string | null {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Helper to get CSRF token with correct cookie name
export function getCSRFToken(): string | null {
    return getCookie(getCookieName('csrftoken'));
}

// Helper to get session ID with correct cookie name
export function getSessionId(): string | null {
    return getCookie(getCookieName('sessionid'));
} 