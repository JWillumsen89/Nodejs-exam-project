import { BASE_URL } from '../../utils/urls.js';
import { user } from '../../stores/userStore.js';

export async function checkSession() {
    try {
        const response = await fetch(BASE_URL + '/user/profile', {
            credentials: 'include',
        });

        if (response.ok) {
            const responseData = await response.json();
            const { id, username, email, role, created_at, updated_at } = responseData.data;

            user.set({ isLoggedIn: true, user: { id, username, email, role, created_at, updated_at }, avatar: '' });
        } else if (response.status === 401) {
            user.set({ isLoggedIn: false, user: null, avatar: '' });
        } else {
            console.error('Error fetching profile data');
        }
    } catch (error) {
        console.error('There was a problem checking the session:', error);
    }
}
