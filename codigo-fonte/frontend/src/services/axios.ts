import axios from 'axios';
import { NoResponseError } from 'errors/NoResponseError';
import { ResponseError } from 'errors/ResponseError';
import { UnexpectedError } from 'errors/UnexpectedError';

const baseURL = process.env.REACT_APP_SERVICES_API_URL;

const instance = axios.create({
    baseURL,
    timeout : 5000,
});

instance.interceptors.response.use(
    res => res,
    error => {
        if(!axios.isCancel(error)) {
            if(error.response) {
                throw new ResponseError(error.response.data, error.response.status);
            } else if (error.request) {
                throw new NoResponseError(error.stack);
            }
            throw new UnexpectedError(error.stack);
        }
    }
);

export const api = instance;
