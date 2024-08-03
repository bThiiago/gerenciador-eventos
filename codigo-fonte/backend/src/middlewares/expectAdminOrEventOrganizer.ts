import ErrMessages from '../errors/messages/messages';
import { NextFunction, Request, Response } from 'express';
import { UserLevel } from '../model/UserLevel';
import { container } from '@core/container';
import { UserService } from '@services/user.service';
import { BaseMiddleware } from 'inversify-express-utils';
import { inject, injectable } from 'inversify';

@injectable()
export class ExpectAdminOrEventOrganizer extends BaseMiddleware {
    @inject(UserService)
    private readonly userService: UserService;

    public async handler(req: Request, res: Response, next: NextFunction) {
        if (req.user.level === UserLevel.ADMIN) {
            return next();
        }

        const isOrganizer = await this.userService.isEventOrganizer(
            req.user.id
        );
        if (isOrganizer) {
            return next();
        }

        return res
            .status(403)
            .json({ message: ErrMessages.insufficientPermissions });
    }
}

container.bind(ExpectAdminOrEventOrganizer).toSelf();

export async function expectAdminOrEventOrganizer(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    if (req.user) {
        if (req.user.level === UserLevel.ADMIN) return next();
        const userService = container.get(UserService);

        const isOrganizer = await userService.isEventOrganizer(req.user.id);
        if (isOrganizer) {
            return next();
        }
        return res
            .status(403)
            .json({ message: ErrMessages.insufficientPermissions });
    }
    return res
        .status(401)
        .json({ message: ErrMessages.unauthenticated });
}
