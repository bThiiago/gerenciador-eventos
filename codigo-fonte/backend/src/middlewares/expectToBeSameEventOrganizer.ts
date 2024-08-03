import { container } from '@core/container';
import { InsufficientPermissionsError } from '@errors/services/InsufficientPermissions';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { EventService } from '@services/event.service';
import { UserLevel } from '@models/UserLevel';
import { Request, Response, NextFunction } from 'express';

export const expectToBeSameEventOrganizer = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const eventId = req.params.eventId;
        const eventService = container.get(EventService);

        const targetEvent = await eventService.findByIdAsAdmin(
            parseInt(eventId)
        );
        if (targetEvent) {
            const users = targetEvent.responsibleUsers;
            if (users.find((user) => user.id === req.user.id) || (req.user.level === UserLevel.ADMIN)) {
                return next();
            }
            throw new InsufficientPermissionsError();
        }
        throw new NotFoundError('Event');
    } catch (error) {
        next(error);
    }
};
