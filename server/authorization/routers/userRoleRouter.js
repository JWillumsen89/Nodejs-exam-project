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

    router.post('/user/update-event', isAuthenticated, requireRole(['user']), async (req, res) => {
        try {
            console.log('Update req.body', req.body);
            const event = await authorizationController.updateEvent(req.body);
            io.emit('event_updated', { event: event });
            res.send({ data: { message: 'Event updated successfully', event: event } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    return router;
}
