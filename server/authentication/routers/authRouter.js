import { Router } from 'express';
const router = Router();

import { authController } from '../controllers/authController.js';
import { authRateLimiter } from '../middlewares/authMiddlewares.js';

export default function (io) {
    router.post('/auth/login', authRateLimiter, async (req, res) => {
        try {
            await authController.login(req, req.body);
            delete req.body.password;
            if (req.body.app == true) {
                req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000;
            }
            req.session.save(err => {
                if (err) {
                    throw err;
                }
                res.send({ data: { message: 'Login successful', body: req.body, sessionId: req.session.id } });
            });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.post('/auth/signup', authRateLimiter, async (req, res) => {
        try {
            const createdUser = await authController.signUp(req.body);
            delete createdUser.hashedPassword;
            io.emit('user_changed', { user: createdUser });

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

    router.post('/auth/validateSession', async (req, res) => {
        if (req.session && req.session.user) {
            res.send({ isValid: true });
        } else {
            res.json({ isValid: false });
        }
    });

    return router;
}
