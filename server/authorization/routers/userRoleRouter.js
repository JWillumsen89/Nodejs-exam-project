import { Router } from 'express';
const router = Router();

import { requireRole } from '../middlewares/authorizationMiddlewares.js';
import { isAuthenticated } from '../../authentication/middlewares/authMiddlewares.js';
import { authorizationController } from '../controllers/authorizationController.js';

export default function (io) {
    router.get('/user/profile', isAuthenticated, requireRole(['user']), (req, res) => {
        res.send({ data: req.session.user });
    });

    router.get('/user/get-events', isAuthenticated, requireRole(['user']), async (req, res) => {
        const events = await authorizationController.getEventsForUser(req.session.user.id);
        res.send({ data: events });
    });

    return router;
}
