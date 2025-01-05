import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BadRequest } from '@/errors/BadRequest';
import { NotAuthorized } from '@/errors/NotAuthorized';
import { returnSuccess } from '@/libs/Response';
import { User } from '@/models/Auth/User';
import BaseRepository from '@/repository/baseRepository';


const userRepo = new BaseRepository(User);

const register = async(req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        const existUser = await userRepo.findByKey(email, 'email');
        if(existUser) {
            throw new BadRequest('User with same email already exists.');
        }
        else {
            let userData: any = {
                email: email,
                password: await bcrypt.hash(password, 10),
            };
            const user = await userRepo.create(userData);
            return returnSuccess(res, {
                email: user.email,
                created_at: user.created_at,
            });
        }
    } catch(e) {
        console.log(e);
        next(e);
    }
};

const login = async(req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        const existUser = await userRepo.findByKey(email, 'email');
        if(!existUser) {
            throw new BadRequest("User doesn't exist." );
        }
        const passwordMatch = await bcrypt.compareSync(password, existUser.password);
        if(!passwordMatch) {
            throw new BadRequest('Password is not correct.');
        }
        if(!existUser.status) {
            throw new NotAuthorized('User is deactive.');
        }
        existUser.last_login_at = new Date();
        await existUser.save();
        const payload = {
            user: {
                id: existUser.user_id,
                email: existUser.email,
            }
        };
        const accessToken = jwt.sign(
            payload,
            process.env.JWTSECRET as string,
            { expiresIn: parseFloat(process.env.JWTEXPIREDTIME as string) * 1000 * 3600 },
        );

        return returnSuccess(res, {
            token: accessToken,
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

export {
    register,
    login,
}