import { getAllUsersWithUserRole, getAllUsers, checkAndChangePassword, editProfile } from '../../db/mysql/usersMysql.js';
import { getAllEvents, createEvent, getEventsForUser, updateEvent, userUpdateEvent,deleteEvent } from '../../db/mysql/eventsMysql.js';

export const authorizationService = {
    async getAllUsersWithUserRole() {
        const users = await getAllUsersWithUserRole();
        return users;
    },

    async getAllUsers() {
        const users = await getAllUsers();
        return users;
    },
    async getAllEvents() {
        const events = await getAllEvents();
        return events;
    },
    async createEvent(event) {
        const newEvent = await createEvent(event);
        return newEvent;
    },
    async getEventsForUser(userId) {
        const events = await getEventsForUser(userId);
        return events;
    },
    async updateEvent(event) {
        const updatedEvent = await updateEvent(event);
        return updatedEvent;
    },
    async userUpdateEvent(event) {
        const updatedEvent = await userUpdateEvent(event);
        return updatedEvent;
    },
    async checkAndChangePassword(userData, sessionUserId) {
        await checkAndChangePassword(userData.currentPassword, userData.newPassword, sessionUserId);
    },
    async editProfile(userData, sessionUserId) {
        return await editProfile(userData.oldUsername, userData.newUsername, userData.oldEmail, userData.newEmail, sessionUserId);
    },
    async deleteEvent(id) {
        const deletedEvent = await deleteEvent(id);
        return deletedEvent;
    }
};
