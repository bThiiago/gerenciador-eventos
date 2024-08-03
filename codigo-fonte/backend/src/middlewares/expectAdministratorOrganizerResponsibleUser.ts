import { container } from '@core/container';
import ErrMessages from '@errors/messages/messages';
import { UserLevel } from '@models/UserLevel';
import { UserService } from '@services/user.service';
import { Request, Response, NextFunction } from 'express';

export const expectAdministratorOrganizerResponsibleUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    const userService = container.get(UserService);

    if (req.user) {
        if (req.user.level === UserLevel.ADMIN) return next();

        const isEventOrganizer = await userService.isEventOrganizer(
            req.user.id
        );

        if (isEventOrganizer) {
            return next();
        }

        const isActivityResponsible = await userService.isActivityResponsible(
            req.user.id
        );

        if (isActivityResponsible) {
            return next();
        }

        return res
            .status(403)
            .json({ message: ErrMessages.insufficientPermissions });
    }
    return res
        .status(401)
        .json({ message: ErrMessages.unauthenticated });
};
