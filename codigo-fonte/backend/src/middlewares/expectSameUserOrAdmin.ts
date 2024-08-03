import ErrMessages from '../errors/messages/messages';
import { NextFunction, Request, Response } from 'express';
import { UserLevel } from '../model/UserLevel';

export async function expectSameUserOrAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    if (req.user) {
        if (req.user.level === UserLevel.ADMIN) return next();
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
