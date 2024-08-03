import { ValidationError } from 'yup';

interface Erros {
    [key: string]: string;
}

export default function getValidationError(err: ValidationError): Erros {
    const validationError: Erros = {};

    err.inner.forEach(error => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        validationError[error.path] = error.message;
    });

    return validationError;
}