abstract class CustomError extends Error {
    abstract statusCode: number;
    constructor() {
        super();
        Object.setPrototypeOf(this, CustomError.prototype);
    }
    abstract serializeErrors(): {
        title: string;
        status: string | number;
        detail?: {
            message: string;
            field?: string;
        }[];
    };
}
export = CustomError;
