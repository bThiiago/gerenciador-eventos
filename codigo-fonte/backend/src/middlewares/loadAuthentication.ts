import { Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core';
import { SERVER_CONFIG } from '../config/server.config';
import jwt from 'jsonwebtoken';
import { DecodedJWTContent } from '@controllers/sessions.controller';

const {
    JWT_CONFIG
} = SERVER_CONFIG;

// Autenticação será verificada, mas não obrigatória.
export function loadAuthentication(req: Request, res: Response, next: NextFunction): unknown {
    if (!req.headers || !req.headers['authorization']) {
        return next();
    }

    const authHeader = req.headers.authorization;

    try {
        const [, token] = authHeader.split(' ');

        const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

        const { id, level } = decoded as DecodedJWTContent;
        req.user = { id, level };
        
        return next();
    } catch (err) {
        return next();
    }
}

