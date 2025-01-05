import CustomError from './CustomError';

export class NotAuthorized extends CustomError {
  statusCode = 401;
  constructor(public message: string = 'Not authorized!', public code: number = 401, public detail?: any) {
    super();
    this.statusCode = code;
    Object.setPrototypeOf(this, NotAuthorized.prototype);
  }
  serializeErrors() {
    return {title: this.message, status: this.statusCode, detail: [this.detail]};
  }
}
