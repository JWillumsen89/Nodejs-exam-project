import { Router } from 'express';
const router = Router();

import { isAuthenticated } from '../../authentication/middlewares/authMiddlewares.js';

import { authorizationController } from '../controllers/authorizationController.js';

export default function (io) {
    router.post('/authorization/change-password', isAuthenticated, async (req, res) => {
        try {
            const userIdFromSession = req.session.user.id;
            await authorizationController.checkAndChangePassword(req.body, userIdFromSession);
            res.send({ data: { message: 'Password changed successfully' } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.post('/authorization/edit-profile', isAuthenticated, async (req, res) => {
        try {
            const userIdFromSession = req.session.user.id;
            const updatedUserData = await authorizationController.editProfile(req.body, userIdFromSession);
            req.session.user = updatedUserData;
            io.emit('user_changed', { user: updatedUserData });
            res.send({ data: { message: 'Profile edited successfully', user: updatedUserData } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    return router;
}
