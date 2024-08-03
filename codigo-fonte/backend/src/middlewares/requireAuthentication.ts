import { Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core';
import { SERVER_CONFIG } from '../config/server.config';
import jwt from 'jsonwebtoken';
import { DecodedJWTContent } from '@controllers/sessions.controller';

const {
    JWT_CONFIG
} = SERVER_CONFIG;

export function requireAuthentication(req: Request, res: Response, next: NextFunction): unknown {
    
    if (!req.headers || !req.headers['authorization']) {
        res.statusCode = 400;
        return res.json({ message: 'Token JWT não encontrado' });
    }

    const authHeader = req.headers.authorization;

    try {
        const [, token] = authHeader.split('Bearer ');

        if(token) {
            const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

            const { id, level } = decoded as DecodedJWTContent;
            req.user = { id, level };

            return next();
        }
        res.statusCode = 401;
        return res.json({ message: 'Token inválido' });
    } catch (err) {
        //console.error(err);
        res.statusCode = 401;
        return res.json({ message: 'Token inválido' });
    }
}

