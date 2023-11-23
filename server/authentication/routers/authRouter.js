import { Router } from 'express';
const router = Router();

import { authController } from '../controllers/authController.js';
import { authRateLimiter } from '../middlewares/authMiddlewares.js';

export default function (io) {
    router.post('/auth/login', authRateLimiter, async (req, res) => {
        try {
            await authController.login(req, req.body);

            console.log('Session user', req.session.user);
            res.send({ data: { message: 'Login successful', body: req.body } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.post('/auth/signup', authRateLimiter, async (req, res) => {
        try {
            const createdUser = await authController.signUp(req.body);
            delete createdUser.hashedPassword;
            console.log('Created user', createdUser);
            io.emit('user_signup', { user: createdUser });

            res.send({ data: { message: 'Sign up successful', user: createdUser } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.post('/auth/logout', authRateLimiter, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Error while logging out');
            }
            res.cookie('connect.sid', '', { expires: new Date(0), path: '/' });
            res.send({ message: 'Logged out successfully' });
        });
    });

    router.post('/auth/change-password', authRateLimiter, async (req, res) => {
        try {
            await authController.checkAndChangePassword(req.body);
            res.send({ data: { message: 'Password changed successfully' } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.post('/auth/edit-profile', authRateLimiter, async (req, res) => {
        try {
            const updatedUserData = await authController.editProfile(req.body);
            req.session.user = updatedUserData;
            console.log('Updated user', updatedUserData);
            io.emit('user_updated', { user: updatedUserData });
            res.send({ data: { message: 'Profile edited successfully', user: updatedUserData } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    return router;
}
