import { authService } from '../services/authService.js';

export const authController = {
    signUp(body) {
        return authService.signUpUser(body);
    },
    login(req, body) {
        return authService.loginUser(req, body);
    },
};
