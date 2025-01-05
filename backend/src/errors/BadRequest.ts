import CustomError from './CustomError';


export class BadRequest extends CustomError {
    statusCode = 400;
    constructor(public message: string = 'Bad Request', public code: number = 400, public detail: any = []) {
        super();
        this.statusCode = code;
        Object.setPrototypeOf(this, BadRequest.prototype);
    }
    serializeErrors() {
        return { title: this.message, status: this.code, detail: this.detail || [] };
    }
}
