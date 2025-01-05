import { Response } from 'express';

export const returnSuccess = (res: Response, data: any = [], message: string = 'Success', code: number = 200) => {
    res.status(code).json({ title: message, status: code, detail: data });
};

export const returnError = (res: Response, data: any = [], message: string = 'Error', code: number = 500,) => {
    res.status(code).json({ title: message, code, detail: data });
};
