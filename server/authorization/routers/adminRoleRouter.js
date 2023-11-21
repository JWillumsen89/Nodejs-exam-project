import { Router } from 'express';
const router = Router();

import { requireRole } from '../middlewares/authorizationMiddlewares.js';
import { isAuthenticated } from '../../authentication/middlewares/authMiddlewares.js';
import { authorizationController } from '../controllers/authorizationController.js';

router.get('/admin/data', isAuthenticated, requireRole(['admin']), (req, res) => {
    res.send({ data: 'This is some admin data' });
});

router.get('/admin/users', isAuthenticated, requireRole(['admin']), async (req, res) => {
    const users = await authorizationController.getAllUsersWithUserRole();
    res.send({ data: users });
});

router.get('/admin/getAllUsers', isAuthenticated, requireRole(['admin']), async (req, res) => {
    const users = await authorizationController.getAllUsers();
    res.send({ data: users });
});

router.get('admin/getAllEvents', isAuthenticated, requireRole(['admin']), async (req, res) => {
    const events = await authorizationController.getAllEvents();
    res.send({ data: events });
});

router.post('/admin/create-event', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
        const event = await authorizationController.createEvent(req.body);
        res.send({ data: { message: 'Event created successfully', event: event } });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

export default router;
