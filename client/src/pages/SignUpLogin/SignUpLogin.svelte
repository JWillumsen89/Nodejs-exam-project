<script>
    import { BASE_URL } from '../../components/Urls.js';
    import { writable, get } from 'svelte/store';
    import { user } from '../../stores/userStore.js';
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { navigate } from 'svelte-navigator';
    import { notificationStore } from '../../stores/notificationStore.js';

    $: pageTitle.set($isLogin ? 'Login' : 'Sign up'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    const isLogin = writable(true);

    const currentUser = get(user);

    function formEnabledDisabled(disabled) {
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const passwordConfirmation = document.getElementById('passwordConfirmation');
        const submitBtn = document.getElementById('submit-btn');

        if (disabled) {
            // @ts-ignore
            if (username) username.disabled = true;
            // @ts-ignore
            if (email) email.disabled = true;
            // @ts-ignore
            if (password) password.disabled = true;
            // @ts-ignore
            if (passwordConfirmation) passwordConfirmation.disabled = true;
            // @ts-ignore
            if (submitBtn) submitBtn.disabled = true;
        } else {
            // @ts-ignore
            if (username) username.disabled = false;
            // @ts-ignore
            if (email) email.disabled = false;
            // @ts-ignore
            if (password) password.disabled = false;
            // @ts-ignore
            if (passwordConfirmation) passwordConfirmation.disabled = false;
            // @ts-ignore
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    function clearInputFields() {
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const passwordConfirmation = document.getElementById('passwordConfirmation');

        // @ts-ignore
        if (username) username.value = '';
        // @ts-ignore
        if (email) email.value = '';
        // @ts-ignore
        if (password) password.value = '';
        // @ts-ignore
        if (passwordConfirmation) passwordConfirmation.value = '';
    }

    if (currentUser.isLoggedIn) {
        navigate('/', { replace: true });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const data = {
            username: event.target.username.value,
            password: event.target.password.value,
        };

        formEnabledDisabled(true);
        try {
            const response = await fetch(BASE_URL + '/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
            if (response.ok) {
                fetchProfileData();
                notificationStore.set({ message: 'Successfully logged in!', type: 'success' });
                setTimeout(() => {
                    clearInputFields();
                    formEnabledDisabled(false);
                    navigate('/', { replace: true });
                }, 1000);
            } else {
                formEnabledDisabled(false);
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            const errorMessage = JSON.parse(error.message);
            if (errorMessage && errorMessage.error) {
                notificationStore.set({ message: errorMessage.error, type: 'error' });
            } else {
                notificationStore.set({ message: 'An unknown error occurred', type: 'error' });
            }
        }
    }

    async function fetchProfileData() {
        try {
            const response = await fetch(BASE_URL + '/user/profile', {
                credentials: 'include',
            });
            if (response.ok) {
                const responseData = await response.json();
                const userData = responseData.data;

                //Setting the user in the store, so the user can be accessed from any component
                user.set({ isLoggedIn: true, user: userData, avatar: '' });
            } else {
                console.error('Error fetching profile data: ', await response.text());
            }
        } catch (error) {
            console.error('Fetch error: ', error);
        }
    }

    async function handleSignup(event) {
        event.preventDefault();
        formEnabledDisabled(true);

        const username = event.target.username.value;
        const password = event.target.password.value;
        const passwordConfirmation = event.target.passwordConfirmation.value;
        const email = event.target.email.value;

        if (password !== passwordConfirmation) {
            notificationStore.set({ message: 'Passwords do not match!', type: 'error' });
            return;
        }

        const data = {
            username: username,
            password: password,
            email: email,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            const response = await fetch(BASE_URL + '/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                notificationStore.set({ message: 'Successfully signed up!', type: 'success' });
                isLogin.set(true);
                clearInputFields();
                formEnabledDisabled(false);
            } else {
                formEnabledDisabled(false);
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            const errorMessage = JSON.parse(error.message);
            if (errorMessage && errorMessage.error) {
                notificationStore.set({ message: errorMessage.error, type: 'error' });
            } else {
                notificationStore.set({ message: 'An unknown error occurred', type: 'error' });
            }
        }
    }

    function toggleForm() {
        isLogin.update(value => !value);
    }
</script>

<div class="form-container">
    <form on:submit={$isLogin ? handleSubmit : handleSignup}>
        <label for="username">Username{$isLogin ? ' or email' : ''}:</label>
        <input type="text" id="username" name="username" required value="willumsen"/>

        {#if !$isLogin}
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required />
        {/if}

        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required value="Bowie2018"/>

        {#if !$isLogin}
            <label for="passwordConfirmation">Confirm Password:</label>
            <input type="password" id="passwordConfirmation" name="passwordConfirmation" required />
        {/if}

        <button id="submit-btn" type="submit">{$isLogin ? 'Login' : 'Sign up'}</button>
    </form>

    <p>
        {#if $isLogin}
            Haven’t signed up yet? <button class="toggle-form" on:click={toggleForm}>Sign up here!</button>
        {:else}
            Already a member? <button class="toggle-form" on:click={toggleForm}>Login here!</button>
        {/if}
    </p>
</div>

<style>
    .form-container {
        max-width: 400px;
        margin: 80px auto 0;
        padding: 20px;
        background: #2d2d2d;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }

    form {
        display: flex;
        flex-direction: column;
    }

    label {
        margin: 10px 0 5px;
        font-size: 16px;
        font-weight: 600;
        text-align: start;
    }

    input {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        border-radius: 4px;
        border: 1px solid #555;
        background-color: #333;
        color: #fff;
        font-size: 14px;
    }

    input:focus {
        border-color: #ff9500;
        outline: none;
        box-shadow: 0 0 3px #ff9500;
    }

    input:disabled {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.1));
        color: #888;
    }

    button {
        margin-top: 15px;
        padding: 10px 20px;
        background-color: #ff9500;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    button:hover {
        background-color: #cc7a00;
    }

    p {
        text-align: center;
        color: #fff;
    }

    button.toggle-form {
        background: none;
        border: none;
        color: #ff9500;
        padding: 0;
        margin: 0;
    }

    @media (max-width: 768px) {
        .form-container {
            margin-top: 20px;
        }
    }
</style>
