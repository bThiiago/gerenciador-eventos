import { injectable } from 'inversify';
import { container } from '@core/container';
import jwt from 'jsonwebtoken';
import { SERVER_CONFIG } from '../config/server.config';

export interface DecodedJWTContent {
    id: number;
    level: number;
}

const {
    JWT_CONFIG
} = SERVER_CONFIG;

@injectable()
export class EncryptionService {
    sign(data: DecodedJWTContent): string {
        return jwt.sign(data, JWT_CONFIG.SECRET, {
            expiresIn: JWT_CONFIG.EXPIRATION_TIME
        });
    }
    
    signRecoverToken(userId: number): string {
        return jwt.sign({ id: userId }, JWT_CONFIG.SECRET, {
            expiresIn: '30 minutes'
        });
    }
    
    verify(token: string): string | jwt.JwtPayload {
        return jwt.verify(token, JWT_CONFIG.SECRET, {
            ignoreExpiration: true
        });
    }
}

container.bind(EncryptionService).toSelf();