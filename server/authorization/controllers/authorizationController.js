import { authorizationService } from '../services/authorizationService.js';

export const authorizationController = {
    async getAllUsersWithUserRole() {
        const users = await authorizationService.getAllUsersWithUserRole();
        return users;
    },

    async getAllUsers() {
        const users = await authorizationService.getAllUsers();
        return users;
    },
    async getAllEvents() {
        const events = await authorizationService.getAllEvents();
        return events;
    },
    async createEvent(event) {
        const newEvent = await authorizationService.createEvent(event);
        return newEvent;
    }
};
