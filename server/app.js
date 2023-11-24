import 'dotenv/config';
import express, { urlencoded } from 'express';
const app = express();

app.use(express.json());
app.use(urlencoded({ extended: true }));

import cors from 'cors';
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

import session from 'express-session';
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

import http from 'http';
const server = http.createServer(app);

import { Server } from 'socket.io';
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['*'],
    },
});

import { rateLimit } from 'express-rate-limit';

const allRoutesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

app.use(allRoutesLimiter);

import authRouter from './authentication/routers/authRouter.js';
app.use(authRouter(io));

import authorizationRouter from './authorization/routers/authorizationRouter.js';
app.use(authorizationRouter(io));

import userRoleRouter from './authorization/routers/userRoleRouter.js';
app.use(userRoleRouter(io));

import adminRoleRouter from './authorization/routers/adminRoleRouter.js';
app.use(adminRoleRouter(io));

import emailSenderRouter from './emailSender/routers/emailSenderRouter.js';
app.use(emailSenderRouter);

app.get('*', (req, res) => {
    res.send('<h1>404 Page not found</h1>');
});

app.all('*', (req, res) => {
    res.status(404).send({ data: `Unsupported path ${req.path}` });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port`, PORT);
});
