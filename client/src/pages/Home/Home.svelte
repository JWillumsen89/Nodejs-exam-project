<script>
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';

    $: pageTitle.set('Home'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));
</script>
