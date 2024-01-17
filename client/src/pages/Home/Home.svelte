<script>
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { user } from '../../stores/userStore.js';
    import { onMount } from 'svelte';
    import { checkSession } from '../../components/Authorization/Authorization.js';
    import { navigate } from 'svelte-navigator';
    import { logoutUser } from '../../components/Authorization/Authorization.js';

    $: pageTitle.set('Home'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    onMount(async () => {
        if ($user.isLoggedIn) {
            await checkSession();
        }
    });

    function handleWidgetClick(endpoint) {
        navigate(endpoint, { replace: true });
    }
</script>

<div class="home-content">
    <h2>Welcome {$user.isLoggedIn ? $user.user.username : 'to the Work Planner'}</h2>
    {#if $user.isLoggedIn}
        {#if $user.user.role === 'admin'}
            <p>
                Streamline Your Management Workflow. As an admin, effortlessly create, assign, and mark tasks as completed. Simplify your team's task management
                and enhance productivity.
            </p>
        {:else if $user.user.role === 'user'}
            <p>
                Stay on Top of Your Work Schedule. As a user, easily view and manage your assigned tasks. Keep track of deadlines and stay organized with our
                intuitive work planner.
            </p>
        {/if}
        <div class="widget-container">
            <button class="widget-box" on:click={() => handleWidgetClick('/work-planner')}>
                <h3>{$user.user.role === 'user' ? 'Your ' : ''}Work Planner</h3>
                {#if $user.user.role === 'admin'}
                    <p>Organize Your Day with Ease! Dive into the planner to manage and delegate tasks efficiently.</p>
                {:else if $user.user.role === 'user'}
                    <p>Stay Ahead of Your Tasks! Explore your planner to view your assignments and update your progress.</p>
                {/if}
            </button>
            {#if $user.user.role === 'admin'}
                <button class="widget-box" on:click={() => handleWidgetClick('/admin')}>
                    <h3>Admin Panel</h3>
                    <p>View and manage users. Add new users and update existing users.</p>
                </button>
            {/if}
            <button class="widget-box" on:click={() => handleWidgetClick('/profile')}>
                <h3>My Profile</h3>
                <p>View and update your profile details. Personalize your experience.</p>
            </button>
            <button class="widget-box" on:click={() => handleWidgetClick('/contact')}>
                <h3>Contact Us</h3>
                <p>Have questions or need assistance? We're here to help.</p>
            </button>
            <button class="widget-box logout-widget" on:click={() => logoutUser('Successfully logged out!')}>
                <h3>Ready to Log Out?</h3>
                <p>Wrapping up for today? Remember to log out for security!</p>
            </button>
        </div>
    {:else}
        <p>Experience the simplicity of task management. Admins can create, assign, and complete tasks with ease.</p>
        <p>Users can effortlessly keep track of their work schedules and tasks.</p>

        <div class="widget-container">
            <button class="widget-box" on:click={() => handleWidgetClick('/login-signup')}>
                <h3>Create Account or Log In</h3>
                <p>New here? Create an account or log in to get started.</p>
            </button>

            <button class="widget-box" on:click={() => handleWidgetClick('/contact')}>
                <h3>Contact Us</h3>
                <p>Have questions or need assistance? We're here to help.</p>
            </button>
        </div>
    {/if}
</div>
