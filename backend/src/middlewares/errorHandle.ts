import {Response, Request, NextFunction} from 'express';
import CustomError from '@/errors/CustomError';


function errorHandle(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof CustomError) {
    res.status(err.statusCode).send(err.serializeErrors());
  }
  const message = err.message || 'Something went wrong';
  const trace = err.stack || '';
  res.status(500).send({
    title: 'Something went wrong',
    status: 500,
    detail: [{message, trace}],
  });
}
export = errorHandle;
