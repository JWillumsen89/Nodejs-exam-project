<script>
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { user } from '../../stores/userStore.js';
    import { onMount } from 'svelte';
    import { checkSession } from '../../components/Authorization/Authorization.js';

    $: pageTitle.set('Home'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    onMount(async () => {
        console.log('User store is', $user);
        console.log('SessionStorage user', sessionStorage.getItem('userData'));
        if ($user.isLoggedIn) {
            console.log('Check session is called from home');
            await checkSession();
        }
    });
</script>
