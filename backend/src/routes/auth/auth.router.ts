import express, { Router } from 'express';
import validateRequest from '@/middlewares/validateRequest';
import {
    login,
    register,
} from './auth.controller';
import {
    loginValidate,
    registerValidate,
} from './auth.validator';


const authRouter: Router = express.Router();

authRouter.post('/login', loginValidate, validateRequest, login);
authRouter.post('/register', registerValidate, validateRequest, register);

export = authRouter;
