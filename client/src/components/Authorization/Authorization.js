import { navigate } from 'svelte-navigator';

import { BASE_URL } from '../../utils/urls.js';
import { user } from '../../stores/userStore.js';
import { notificationStore } from '../../stores/notificationStore.js';

export async function checkSession() {
    try {
        const response = await fetch(BASE_URL + '/auth/validateSession', {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            const responseData = await response.json();
            const { isValid } = responseData;

            if (isValid) {
                return true;
            } else {
                await logoutUser('Your session has expired. You have been logged out.');
                return false;
            }
        }
        console.error('Session validation failed');
    } catch (error) {
        console.error('There was a problem checking the session:', error);
    }

    return false;
}

export async function logoutUser(message) {
    try {
        const response = await fetch(BASE_URL + '/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        if (response.ok) {
            user.set({ isLoggedIn: false, user: null, avatar: '' });
            sessionStorage.removeItem('userData');
            notificationStore.set({ message: message, type: 'success' });
            navigate('/login-signup', { replace: true });
        }
    } catch (error) {
        notificationStore.set({ message: 'Logout failed!', type: 'error' });
    }
}
