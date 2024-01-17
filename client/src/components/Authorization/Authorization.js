import { BASE_URL } from '../../utils/urls.js';
import { user } from '../../stores/userStore.js';
import { notificationStore } from '../../stores/notificationStore.js';
import { navigate } from 'svelte-navigator';

export async function checkSession() {
    console.log('Checking session...');
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
                await logoutUser();
                navigate('/login-signup');
                return false;
            }
        }

        console.error('Session validation failed');
    } catch (error) {
        console.error('There was a problem checking the session:', error);
    }

    return false;
}

async function logoutUser() {
    try {
        const response = await fetch(BASE_URL + '/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        if (response.ok) {
            user.set({ isLoggedIn: false, user: null, avatar: '' });
            sessionStorage.removeItem('userData');
            notificationStore.set({ message: 'Your session has expired. You have been logged out.', type: 'success' });
        } else {
            console.error('Logout failed');
            notificationStore.set({ message: 'Logout failed!', type: 'error' });
        }
    } catch (error) {
        console.error('Logout failed:', error);
        notificationStore.set({ message: 'Logout failed!', type: 'error' });
    }
}
