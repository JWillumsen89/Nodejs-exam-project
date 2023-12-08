<script>
    import { BASE_URL } from '../../components/Urls.js';
    import { notificationStore } from '../../stores/notificationStore.js';
    import { navigate } from 'svelte-navigator';
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { user } from '../../stores/userStore.js';

    $: pageTitle.set('Contact'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    let formData = {
        name: $user.isLoggedIn ? $user.user.username : '',
        email: $user.isLoggedIn ? $user.user.email : '',
        subject: '',
        message: '',
    };

    let isSubmitting = false;

    async function handleContactSubmit(event) {
        event.preventDefault();
        isSubmitting = true;

        try {
            const response = await fetch(BASE_URL + '/sendContactEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            notificationStore.set({ message: 'Message sent successfully!', type: 'success' });
            setTimeout(() => navigate('/', { replace: true }), 1000);
        } catch (error) {
            let errorMessage;
            try {
                errorMessage = JSON.parse(error.message);
            } catch {
                errorMessage = { error: 'An unknown error occurred' };
            }
            notificationStore.set({ message: errorMessage.error, type: 'error' });
        } finally {
            isSubmitting = false;
        }
    }

    // let username = '';
    // let email = '';

    // $: if ($user.isLoggedIn) {
    //     username = $user.user.username;
    //     email = $user.user.email;
    // }

    // let isSubmitting = false;

    // async function handleContactSubmit(event) {
    //     event.preventDefault();
    //     isSubmitting = true;

    //     const data = {
    //         name: event.target.name.value,
    //         email: event.target.email.value,
    //         subject: event.target.subject.value,
    //         message: event.target.message.value,
    //     };

    //     try {
    //         const response = await fetch(BASE_URL + '/sendContactEmail', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(data),
    //         });

    //         if (response.ok) {
    //             notificationStore.set({ message: 'Message sent successfully!', type: 'success' });
    //             setTimeout(() => {
    //                 navigate('/', { replace: true });
    //             }, 1000);
    //         } else {
    //             const errorText = await response.text();
    //             throw new Error(errorText);
    //         }
    //     } catch (error) {
    //         const errorMessage = JSON.parse(error.message);
    //         if (errorMessage && errorMessage.error) {
    //             notificationStore.set({ message: errorMessage.error, type: 'error' });
    //         } else {
    //             notificationStore.set({ message: 'An unknown error occurred', type: 'error' });
    //         }
    //     }
    //     isSubmitting = false;
    // }
</script>

<div class="form-container">
    <form on:submit={handleContactSubmit}>
        <label for="name">Name:</label>
        <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Enter full name..."
            bind:value={formData.name}
            disabled={isSubmitting || $user.isLoggedIn}
        />

        <label for="email">Email:</label>
        <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="Enter email..."
            bind:value={formData.email}
            disabled={isSubmitting || $user.isLoggedIn}
        />

        <label for="subject">Subject:</label>
        <input type="text" id="subject" name="subject" required placeholder="Enter subject..." disabled={isSubmitting} />

        <label for="message">Message:</label>
        <textarea id="message" name="message" required rows="15" style="resize: none;" placeholder="Enter message..." disabled={isSubmitting} />

        <button id="submit-btn" type="submit" disabled={isSubmitting}>Send Message</button>
    </form>
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

    button {
        margin-top: 15px;
    }

    

    @media (max-width: 768px) {
        .form-container {
            margin-top: 20px;
        }

        textarea {
            height: 100px;
        }
    }
</style>
