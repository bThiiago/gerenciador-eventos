import { config as loadDotEnv } from 'dotenv';

loadDotEnv();

const HOUR = 60 * 60;

export const SERVER_CONFIG = {
    PORT: parseInt(process.env.PORT) || 3333,
    JWT_CONFIG: {
        SECRET: process.env.JWT,
        EXPIRATION_TIME: HOUR * 5
    },
    ROOTPATH: process.env.ROOTPATH,
    RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET
};

export const EMAIL_CONFIG = {
    EMAIL: process.env.EMAIL,
    HOST: process.env.EMAIL_HOST,
    PORT: parseInt(process.env.EMAIL_PORT),
    AUTH_USER: process.env.EMAIL_AUTH_USER,
    AUTH_PASS: process.env.EMAIL_AUTH_PASS,
    BASE_EMAIL_URL: process.env.BASE_EMAIL_URL,
};