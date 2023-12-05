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
    },
    async getEventsForUser(userId) {
        const events = await authorizationService.getEventsForUser(userId);
        return events;
    },
    async updateEvent(event) {
        const updatedEvent = await authorizationService.updateEvent(event);
        return updatedEvent;
    },
    async userUpdateEvent(event) {
        const updatedEvent = await authorizationService.userUpdateEvent(event);
        return updatedEvent;
    },
    async checkAndChangePassword(body, sessionUserId) {
        return await authorizationService.checkAndChangePassword(body, sessionUserId);
    },
    async editProfile(body, sessionUserId) {
        return await authorizationService.editProfile(body, sessionUserId);
    },
    async deleteEvent(id) {
        const deletedEvent = await authorizationService.deleteEvent(id);
        return deletedEvent;
    }
};
