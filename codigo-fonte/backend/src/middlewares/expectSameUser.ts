import ErrMessages from '../errors/messages/messages';
import { NextFunction, Request, Response } from 'express';

export async function expectSameUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    if (req.user) {
        const id = parseInt(req.params.id || req.params.userId);
        if (id == req.user.id) return next();
        return res
            .status(403)
            .json({ message: ErrMessages.insufficientPermissions });
    }
    return res
        .status(401)
        .json({ message: ErrMessages.unauthenticated });
}
