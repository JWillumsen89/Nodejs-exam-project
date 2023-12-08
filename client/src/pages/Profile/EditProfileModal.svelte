<script>
    import { closeModal } from 'svelte-modals';
    import { user } from '../../stores/userStore.js';
    import { get, writable } from 'svelte/store';
    import { notificationStore } from '../../stores/notificationStore.js';
    import { BASE_URL } from '../../components/Urls.js';

    export let isOpen;
    export let title;

    let username = '';
    let email = '';

    $: username = $user.isLoggedIn ? $user.user.username : '';
    $: email = $user.isLoggedIn ? formatString($user.user.email) : '';

    function formatString(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    async function changeUsernameAndEmail(event) {
        event.preventDefault();
        const oldUsername = get(user).user.username;
        const newUsername = event.target.username.value;
        const oldEmail = get(user).user.email;
        const newEmail = event.target.email.value;

        const usernameInput = /** @type {HTMLInputElement} */ (document.getElementById('username'));
        const emailInput = /** @type {HTMLInputElement} */ (document.getElementById('email'));
        const submitBtn = /** @type {HTMLInputElement} */ (document.getElementById('submit-btn'));

        if (usernameInput && emailInput) {
            usernameInput.disabled = true;
            emailInput.disabled = true;
            submitBtn.disabled = true;
        }

        const data = {
            oldUsername,
            newUsername,
            oldEmail,
            newEmail,
        };

        try {
            const response = await fetch(BASE_URL + '/authorization/edit-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
            if (response.ok) {
                notificationStore.set({ message: 'Profile successfully edited!', type: 'success' });
                user.update(currentUser => {
                    currentUser.user.username = newUsername;
                    currentUser.user.email = formatString(newEmail);
                    currentUser.user.updatedAt = new Date().toISOString();
                    return currentUser;
                });
                closeModal();
            } else {
                usernameInput.disabled = false;
                emailInput.disabled = false;
                submitBtn.disabled = false;
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            usernameInput.disabled = false;
            emailInput.disabled = false;
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
            <form on:submit={changeUsernameAndEmail}>
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input id="username" type="text" placeholder="Username" value={username} />
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input id="email" type="mail" placeholder="Email" value={email} />
                </div>
                <div class="actions">
                    <button type="submit" id="submit-btn">Submit</button>
                    <button class="grey-btn" type="button" on:click={closeModal}>Cancel</button>
                </div>
            </form>
        </div>
    </div>
{/if}

