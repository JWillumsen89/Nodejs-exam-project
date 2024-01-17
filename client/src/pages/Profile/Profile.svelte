<script>
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { user } from '../../stores/userStore.js';
    import { get } from 'svelte/store';
    import { Modals, openModal, closeModal } from 'svelte-modals';
    import PasswordChangeModal from './PasswordChangeModal.svelte';
    import EditProfileModal from './EditProfileModal.svelte';
    import { formatDateEuropean } from '../../utils/dateFormatting.js';
    import { onMount } from 'svelte';
    import { checkSession } from '../../components/Authorization/Authorization.js';
    import { writable } from 'svelte/store';

    $: pageTitle.set('Profile'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    const isSessionChecked = writable(false);

    onMount(async () => {
        console.log('Check session is called from profile');
        isSessionChecked.set(await checkSession());
    });

    let userData;

    $: userData = $user.user;

    $: console.log('User data is', userData);

    function openChangePasswordModal() {
        openModal(PasswordChangeModal, { title: 'Change Password' });
    }

    function openEditUsernameAndEmail() {
        openModal(EditProfileModal, { title: 'Edit Username And Email' });
    }

    function handleBackdropClick() {
        closeModal();
    }

    function handleBackdropKeyDown(event) {
        if (event.key === 'Enter' || event.key === 'Space') {
            closeModal();
        }
    }
</script>

{#if $isSessionChecked}
    <br />
    <Modals>
        <div
            slot="backdrop"
            class="backdrop"
            on:click={handleBackdropClick}
            on:keydown={handleBackdropKeyDown}
            tabindex="0"
            role="button"
            aria-label="Close modal"
        />
    </Modals>
    <div class="form-container">
        <img src={get(user).avatar} alt="Avatar" />
        <div class="user-info">
            {#if userData}
                <h2><span class="user-label">Username:</span> {userData.username}</h2>
                <h2><span class="user-label">Email:</span> {userData.email}</h2>
                <h2><span class="user-label">Created at:</span> {formatDateEuropean(userData.created_at, true)}</h2>
                <h2><span class="user-label">Updated at:</span> {formatDateEuropean(userData.updated_at, true)}</h2>
            {/if}
        </div>
        <div class="button-group">
            <button on:click={openEditUsernameAndEmail}>Edit Profile</button>
            <button on:click={openChangePasswordModal}>Change Password</button>
        </div>
    </div>
{/if}

<style>
    .form-container {
        max-width: 400px;
        margin: 80px auto 0;
        padding: 20px;
        background: #2d2d2d;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }

    .user-info h2 {
        font-size: 16px;
        color: #c0c0c0;
        margin: 10px 0;
    }

    .user-label {
        font-weight: bold;
        color: #ff9500;
    }

    button {
        display: inline-block;
        margin: 10px;
    }

    .form-container img {
        display: block;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        margin: auto;
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            filter 0.3s ease;
        filter: grayscale(100%);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
        position: relative;
        z-index: 1;
    }

    .form-container img:hover {
        transform: scale(1.05) rotate3d(0, 1, 0, 20deg);
        box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.4),
            0 0 15px 5px #00ffaa;
        filter: grayscale(0%);
    }

    .form-container img::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        bottom: -2px;
        left: -2px;
        background: linear-gradient(45deg, #ff0055, #f8c210, #00ffaa, #00f);
        border-radius: 50%;
        z-index: -1;
        transition: opacity 0.3s ease;
        opacity: 0;
    }

    .form-container img:hover::after {
        animation: rotate 2s linear infinite;
        opacity: 1;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @media (max-width: 768px) {
        .form-container {
            margin-top: 0px;
        }

        .form-container img {
            width: 80px;
            height: 80px;
        }
        .form-container h2 {
            font-size: 16px;
        }
    }
</style>
