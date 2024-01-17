<script>
    import { closeModal } from 'svelte-modals';
    import { get } from 'svelte/store';

    import { user } from '../../stores/userStore.js';
    import { notificationStore } from '../../stores/notificationStore.js';
    import { BASE_URL } from '../../utils/urls.js';

    export let isOpen;
    export let title;

    async function checkAndChangePassword(event) {
        event.preventDefault();
        const username = get(user).user.username;
        const currentPassword = event.target.currentPassword.value;
        const newPassword = event.target.newPassword.value;
        const confirmNewPassword = event.target.confirmNewPassword.value;

        const currentPasswordInput = /** @type {HTMLInputElement} */ (document.getElementById('currentPassword'));
        const newPasswordInput = /** @type {HTMLInputElement} */ (document.getElementById('newPassword'));
        const confirmNewPasswordInput = /** @type {HTMLInputElement} */ (document.getElementById('confirmNewPassword'));
        const submitBtn = /** @type {HTMLInputElement} */ (document.getElementById('submit-btn'));

        if (currentPasswordInput && newPasswordInput && confirmNewPasswordInput) {
            currentPasswordInput.disabled = true;
            newPasswordInput.disabled = true;
            confirmNewPasswordInput.disabled = true;
            submitBtn.disabled = true;
        }

        const data = {
            username,
            currentPassword,
            newPassword,
        };

        if (newPassword !== confirmNewPassword) {
            notificationStore.set({ message: 'New passwords do not match!', type: 'error' });
            currentPasswordInput.disabled = false;
            newPasswordInput.disabled = false;
            confirmNewPasswordInput.disabled = false;
            submitBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch(BASE_URL + '/authorization/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
            if (response.ok) {
                notificationStore.set({ message: 'Password successfully changed!', type: 'success' });
                user.update(currentUser => {
                    currentUser.user.updatedAt = new Date().toISOString();
                    return currentUser;
                });
                closeModal();
            } else {
                currentPasswordInput.disabled = false;
                newPasswordInput.disabled = false;
                confirmNewPasswordInput.disabled = false;
                submitBtn.disabled = false;
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            currentPasswordInput.disabled = false;
            newPasswordInput.disabled = false;
            confirmNewPasswordInput.disabled = false;
            submitBtn.disabled = false;
            const errorMessage = JSON.parse(error.message);
            if (errorMessage && errorMessage.error) {
                notificationStore.set({ message: errorMessage.error, type: 'error' });
            } else {
                notificationStore.set({ message: 'An unknown error occurred', type: 'error' });
            }
        }
    }
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="profile-content form-container">
            <h2>{title}</h2>
            <form on:submit={checkAndChangePassword}>
                <div class="form-group">
                    <label for="currentPassword">Current Password:</label>
                    <input id="currentPassword" type="password" placeholder="Current Password" />
                </div>
                <div class="form-group">
                    <label for="newPassword">New Password:</label>
                    <input id="newPassword" type="password" placeholder="New Password" />
                </div>
                <div class="form-group">
                    <label for="confirmNewPassword">Confirm New Password:</label>
                    <input id="confirmNewPassword" type="password" placeholder="Confirm New Password" />
                </div>
                <div class="actions">
                    <button type="submit" id="submit-btn">Submit</button>
                    <button class="grey-btn" type="button" on:click={closeModal}>Cancel</button>
                </div>
            </form>
        </div>
    </div>
{/if}
