<script>
    import { Router, Route } from 'svelte-navigator';
    import PrivateRoute from './components/PrivateRoutes/PrivateRoute.svelte';
    import Navbar from './components/Navbar/Navbar.svelte';
    import Home from './pages/Home/Home.svelte';
    import SignUpLogin from './pages/SignUpLogin/SignUpLogin.svelte';
    import Admin from './pages/Admin/Admin.svelte';
    import NoPermission from './pages/NoPermission/NoPermission.svelte';
    import Profile from './pages/Profile/Profile.svelte';
    import Contact from './pages/Contact/Contact.svelte';
    import PageNotFound from './pages/PageNotFound/PageNotFound.svelte';
    import WorkPlanner from './pages/WorkPlanner/WorkPlanner.svelte';
    import toast, { Toaster } from 'svelte-french-toast';
    import { notificationStore } from './stores/notificationStore.js';
    import { user } from './stores/userStore.js';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    const adminRole = ['admin'];
    const userRole = ['user', 'admin'];

    const isLoading = writable(true);

    onMount(() => {
        const savedUserData = sessionStorage.getItem('userData');
        if (savedUserData) {
            const userData = JSON.parse(savedUserData);
            user.set({ isLoggedIn: true, user: userData, avatar: '' });
        }
        isLoading.set(false);
    });

    notificationStore.subscribe(({ message, type }) => {
        if (message) {
            if (type === 'success') {
                toast.success(message);
            }
            if (type === 'error') {
                toast.error(message);
            }
            notificationStore.set({ message: '', type: '' });
        }
    });
</script>

{#if $isLoading}
    <!-- Show loader or placeholder here -->
{:else}
    <Toaster />
    <Router>
        <Navbar />
        <div>
            <Route path="/" component={Home} primary={false} />
            <Route path="/login-signup" component={SignUpLogin} primary={false} />
            <Route path="/no-permission" component={NoPermission} primary={false} />
            <Route path="*" component={PageNotFound} primary={false} />
            <Route path="/contact" component={Contact} primary={false} />
            <PrivateRoute path="/admin" roles={adminRole}>
                <Admin />
            </PrivateRoute>
            <PrivateRoute path="/profile" roles={userRole}>
                <Profile />
            </PrivateRoute>
            <PrivateRoute path="/work-planner" roles={userRole}>
                <WorkPlanner />
            </PrivateRoute>
        </div>
    </Router>
{/if}
