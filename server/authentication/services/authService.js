import { createUser, loginUser, checkAndChangePassword, editProfile } from '../../db/mysql/usersMysql.js';

export const authService = {
    async signUpUser(userData) {
        return createUser(userData.username, userData.email, userData.password, userData.role);
    },
    async loginUser(req, userData) {
        const user = await loginUser(userData.username, userData.password);
        req.session.user = user;
        return user;
    },

    async checkAndChangePassword(userData) {
        await checkAndChangePassword(userData.username, userData.currentPassword, userData.newPassword);
    },
    async editProfile(userData) {
        return await editProfile(userData.oldUsername, userData.newUsername, userData.oldEmail, userData.newEmail);
    }
};
