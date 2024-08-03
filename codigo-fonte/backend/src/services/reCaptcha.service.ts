import fetch from 'node-fetch';
import { SERVER_CONFIG } from '../config/server.config';

export class CaptchaService {
    private static RECAPTCHA_SECRET = SERVER_CONFIG.RECAPTCHA_SECRET;

    static async validateToken(token: string): Promise<boolean> {
        const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `secret=${this.RECAPTCHA_SECRET}&response=${token}`
        });

        const data = await response.json();
        return data.success;
    }
}
