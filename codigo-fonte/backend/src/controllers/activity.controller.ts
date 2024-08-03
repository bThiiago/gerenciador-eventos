import { inject } from 'inversify';
import { NextFunction, Request, Response } from 'express';
import {
    controller,
    httpDelete,
    httpGet,
    httpPost,
    httpPut,
} from 'inversify-express-utils';

import { requireAuthentication } from '@middlewares/requireAuthentication';
import { ActivityService } from '@services/activity.service';
import { ActivityRegistryService } from '@services/activity_registry.service';
import { container } from '@core/container';
import { EventService } from '@services/event.service';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { InsufficientPermissionsError } from '@errors/services/InsufficientPermissions';
import { NotAuthenticatedError } from '@errors/services/NotAuthenticatedError';
import { expectSameUser } from '@middlewares/expectSameUser';
import { loadAuthentication } from '@middlewares/loadAuthentication';
import { UserLevel } from '@models/UserLevel';
import { celebrate, Joi, Segments } from 'celebrate';
import { PresenceService } from '@services/presence.service';
import { expectToBeSameEventOrganizer } from '@middlewares/expectToBeSameEventOrganizer';
import { ActivityRegistry } from '@models/ActivityRegistry';

// middleware especial, deixar aqui
export const expectToBeSameActivityFromPresence = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const scheduleId = parseInt(req.params.scheduleId);
        if (isNaN(scheduleId)) throw new NotFoundError('Schedule');

        const activityService = container.get(ActivityService);

        const targetActivity = await activityService.findByScheduleId(
            scheduleId
        );
        if (targetActivity) {
            const users = targetActivity.responsibleUsers;
            if (users.find((user) => user.id === req.user.id) || (req.user.level === UserLevel.ADMIN)) {
                return next();
            }
            throw new InsufficientPermissionsError();
        }
        throw new NotFoundError('Activity');
    } catch (error) {
        next(error);
    }
};

const expectToBeSameEventOrganizerOrActivityReponsibleFromActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        if (req.user) {
            const activityService = container.get(ActivityService);
            const eventService = container.get(EventService);

            const activityId = parseInt(req.params.activityId);

            if (isNaN(activityId)) {
                throw new NotFoundError('Activity');
            }

            const targetActivity = await activityService.findByIdAsAdmin(
                activityId
            );

            if (targetActivity) {
                const activityResponsibleUsers =
                    targetActivity.responsibleUsers;
                if (
                    activityResponsibleUsers.find(
                        (user) => user.id === req.user.id
                    )
                ) {
                    return next();
                }

                const targetEvent = await eventService.findByIdAsAdmin(
                    targetActivity.event.id
                );
                if (targetEvent) {
                    const users = targetEvent.responsibleUsers;
                    if (users.find((user) => user.id === req.user.id) || (req.user.level === UserLevel.ADMIN)) {
                        return next();
                    }
                    throw new InsufficientPermissionsError();
                }
            }
            throw new NotFoundError('Activity');
        }
        throw new NotAuthenticatedError();
    } catch (error) {
        next(error);
    }
};

const expectToBeSameUserOrSameEventOrganizerOrActivityReponsibleFromActivity =
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            if (req.user) {
                if (req.user.id === parseInt(req.params.userId) || (req.user.level === UserLevel.ADMIN)) return next();
                return expectToBeSameEventOrganizerOrActivityReponsibleFromActivity(
                    req,
                    res,
                    next
                );
            }
            throw new NotAuthenticatedError();
        } catch (error) {
            next(error);
        }
    };

@controller('/activity')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ActivityController {
    @inject(ActivityService)
    private activityService: ActivityService;

    @inject(ActivityRegistryService)
    private activityRegistryService: ActivityRegistryService;

    @inject(EventService)
    private eventService: EventService;

    @inject(PresenceService)
    private presenceService: PresenceService;

    @httpPut(
        '/:activityId/check_schedules',
        requireAuthentication,
        celebrate({
            [Segments.BODY]: Joi.object()
                .keys({
                    schedules: Joi.array()
                        .required()
                        .items(
                            Joi.object().keys({
                                id: Joi.number().optional(),
                                startDate: Joi.date().required(),
                                durationInMinutes: Joi.number()
                                    .required()
                                    .greater(0),
                                room: Joi.when('url', {
                                    is: Joi.string().required(),
                                    then: Joi.object()
                                        .keys({
                                            id: Joi.number().required(),
                                        })
                                        .allow(null)
                                        .optional(),
                                    otherwise: Joi.object()
                                        .keys({
                                            id: Joi.number().required(),
                                        })
                                        .required(),
                                }),
                                url: Joi.string()
                                    .optional()
                                    .uri()
                                    .min(1)
                                    .max(300)
                                    .allow(null),
                            })
                        )
                        .min(1),
                })
                .min(1),
        })
    )
    async checkActivitySchedulesAndRegistries(req: Request, res: Response) {
        const activityId = parseInt(req.params.activityId);

        if (isNaN(activityId)) {
            throw new NotFoundError('Activity');
        }

        const activity = await this.activityService.findByIdAsCommonUser(activityId);
        const isDifferent = this.activityService.isSchedulesTimeDifferent(activity.schedules, req.body.schedules);

        const hasRegistry = (await this.activityRegistryService.findByActivity(activityId)).totalCount > 0;

        return res.status(200).json({ isEqual: !isDifferent, hasRegistry });
    }

    @httpPut(
        '/:activityId',
        requireAuthentication,
        expectToBeSameEventOrganizerOrActivityReponsibleFromActivity,
        celebrate({
            [Segments.BODY]: Joi.object()
                .keys({
                    title: Joi.string().optional().min(1).max(100),
                    description: Joi.string().optional().min(1).max(1500),
                    vacancy: Joi.number().optional().greater(0),
                    workloadInMinutes: Joi.number().optional().greater(0),
                    schedules: Joi.array()
                        .optional()
                        .items(
                            Joi.object().keys({
                                id: Joi.number().optional(),
                                startDate: Joi.date().required(),
                                durationInMinutes: Joi.number()
                                    .required()
                                    .greater(0),
                                room: Joi.when('url', {
                                    is: Joi.string().required(),
                                    then: Joi.object()
                                        .keys({
                                            id: Joi.number().required(),
                                        })
                                        .allow(null)
                                        .optional(),
                                    otherwise: Joi.object()
                                        .keys({
                                            id: Joi.number().required(),
                                        })
                                        .required(),
                                }),
                                url: Joi.string()
                                    .optional()
                                    .uri()
                                    .min(1)
                                    .max(300)
                                    .allow(null),
                            })
                        )
                        .min(1),
                    responsibleUsers: Joi.array()
                        .optional()
                        .items(
                            Joi.object().keys({
                                id: Joi.number().required().min(0),
                            })
                        )
                        .min(1),
                    teachingUsers: Joi.array()
                        .optional()
                        .items(
                            Joi.object().keys({
                                id: Joi.number().required().min(0),
                            })
                        )
                        .min(0),
                    readyForCertificateEmission: Joi.bool().optional(),
                    activityCategory: Joi.object().optional().keys({
                        id: Joi.number().required().min(0),
                    }),
                })
                .min(1),
        })
    )
    async edit(req: Request, res: Response) {
        const activityId = parseInt(req.params.activityId);

        if (isNaN(activityId)) {
            throw new NotFoundError('Activity');
        }

        const activity = await this.activityService.findByIdAsAdmin(
            activityId
        );
        if (activity) {
            if (req.body.schedules) {
                req.body.schedules.map(schedule => {
                    if (schedule.id) {
                        const isFound = activity.schedules.find(existing => existing.id === schedule.id);
                        if (!isFound) delete schedule.id;
                    }
                });
            }

            const editedActivity = await this.activityService.edit(
                activityId,
                this.activityService.getInstance(req.body)
            );

            return res.status(200).json(editedActivity);
        }
        throw new NotFoundError('Activity');
    }

    @httpPut(
        '/:activityId/rate/:userId',
        requireAuthentication,
        expectToBeSameUserOrSameEventOrganizerOrActivityReponsibleFromActivity,
        celebrate({
            [Segments.BODY]: Joi.object()
                .keys({
                    rating: Joi.number().required().min(1).max(5)
                })
        })
    )
    async setRating(req: Request, res: Response) {
        const { activityId, userId } = req.params;

        let registry: ActivityRegistry;

        await this.activityRegistryService.findByActivityIdAndUserId(
            parseInt(activityId),
            parseInt(userId)
        ).then(
            res => registry = res
        ).catch(() => {
            return res.status(400);
        });

        await this.activityRegistryService.setRating(registry, parseInt(req.body.rating));

        return res.status(200).json();
    }

    @httpGet(
        '/:activityId/registry/',
        requireAuthentication,
        expectToBeSameEventOrganizerOrActivityReponsibleFromActivity
    )
    async getRegistryByActivityId(req: Request, res: Response) {
        const activityId = parseInt(req.params.activityId);
        let limit: number, page: number;

        if (
            typeof req.query.limit == 'string' &&
            !isNaN(parseInt(req.query.limit))
        ) {
            limit = Number(req.query.limit);
        }

        if (
            typeof req.query.page == 'string' &&
            !isNaN(parseInt(req.query.page))
        ) {
            page = Number(req.query.page);
        }

        const findResult = await this.activityRegistryService.findByActivity(
            activityId,
            {
                limit,
                page,
            }
        );
        res.set('X-Total-Count', findResult.totalCount.toString());
        return res.json(findResult.items);
    }

    @httpGet(
        '/registry/:activityId/:userId',
        requireAuthentication,
        expectToBeSameUserOrSameEventOrganizerOrActivityReponsibleFromActivity
    )
    async getRegistryByActivityIdAndUserId(req: Request, res: Response) {
        const { userId, activityId } = req.params;

        const registry =
            await this.activityRegistryService.findByActivityIdAndUserId(
                parseInt(activityId),
                parseInt(userId)
            );

        return res.json(registry);
    }

    @httpPost(
        '/registry/:activityId/:userId',
        requireAuthentication,
        expectSameUser
    )
    async subscribeToActivity(req: Request, res: Response) {
        const { userId, activityId } = req.params;

        await this.activityRegistryService.registry(
            parseInt(activityId),
            parseInt(userId)
        );

        return res.status(201).send();
    }

    @httpPost(
        '/registry/add/:activityId/:userId',
        requireAuthentication,
    )
    async responsibleSubscribeToActivity(req: Request, res: Response) {
        const { userId, activityId } = req.params;

        await this.activityRegistryService.responsibleRegistry(
            parseInt(activityId),
            parseInt(userId)
        );

        return res.status(201).send();
    }

    @httpDelete(
        '/registry/:activityId/:userId',
        requireAuthentication,
        expectToBeSameUserOrSameEventOrganizerOrActivityReponsibleFromActivity
    )
    async deleteSubscriptionToActivity(req: Request, res: Response) {
        const { userId, activityId } = req.params;

        const affectedCount = await this.activityRegistryService.delete(
            parseInt(activityId),
            parseInt(userId)
        );

        return res.status(affectedCount > 0 ? 204 : 404).send();
    }

    @httpGet('/:activityId', loadAuthentication)
    async getActivityById(req: Request, res: Response) {
        const activityId = parseInt(req.params.activityId);

        if (isNaN(activityId)) {
            throw new NotFoundError('Activity');
        }

        let activity = await this.activityService.findByIdAsAdmin(activityId);
        const event = await this.eventService.findByIdAsAdmin(
            activity.event.id
        );

        if (
            !(
                req.user &&
                (req.user.level === UserLevel.ADMIN ||
                    !!event.responsibleUsers.find(
                        (r) => r.id === req.user.id
                    ) ||
                    !!activity.responsibleUsers.find(
                        (r) => r.id === req.user.id
                    ))
            )
        ) {
            activity = await this.activityService.findByIdAsCommonUser(
                activityId
            );
        }

        return res.json(activity);
    }

    @httpPost(
        '/presence/schedule/:scheduleId/user/:userId',
        requireAuthentication,
        expectToBeSameActivityFromPresence
    )
    async markUserAsPresent(req: Request, res: Response) {
        const userId = parseInt(req.params.userId);
        const scheduleId = parseInt(req.params.scheduleId);

        if (isNaN(userId)) throw new NotFoundError('User');
        if (isNaN(scheduleId)) throw new NotFoundError('Schedule');

        await this.presenceService.markAsPresent(userId, scheduleId);

        return res.status(204).send();
    }

    @httpDelete(
        '/presence/schedule/:scheduleId/user/:userId',
        requireAuthentication,
        expectToBeSameActivityFromPresence
    )
    async markUserAsNotPresent(req: Request, res: Response) {
        const userId = parseInt(req.params.userId);
        const scheduleId = parseInt(req.params.scheduleId);

        if (isNaN(userId)) throw new NotFoundError('User');
        if (isNaN(scheduleId)) throw new NotFoundError('Schedule');

        await this.presenceService.markAsNotPresent(userId, scheduleId);

        return res.status(204).send();
    }

    @httpDelete(
        '/:eventId/:activityId',
        requireAuthentication,
        expectToBeSameEventOrganizer,
    )
    async delete(req: Request, res: Response) {
        const id = parseInt(req.params.activityId);

        const affected = await this.activityService.delete(id);

        if (affected > 0) {
            return res.status(204).send();
        } else {
            return res.status(404).send();
        }
    }
}
