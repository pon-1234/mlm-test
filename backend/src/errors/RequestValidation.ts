import { ValidationError } from 'express-validator';
import CustomError from './CustomError';

export class RequestValidationError extends CustomError {
    statusCode = 400;

    constructor(public errors: ValidationError[]) {
        super();
        Object.setPrototypeOf(this, RequestValidationError.prototype);
    }

    serializeErrors() {
        const detail = this.errors.map(err => {
            const n_err: any = { ...err };
            return { message: err.msg, field: n_err.path };
        });
        return {
            title: 'The Input was not valid!',
            status: this.statusCode,
            detail,
        };
    }
}
