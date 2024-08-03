import { EditionDisplay, Event, NameDisplay } from '@models/Event';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import { InsufficientPermissionsError } from '@errors/services/InsufficientPermissions';
import { expectAdmin } from '@middlewares/expectAdmin';
import { expectAdminOrEventOrganizer } from '@middlewares/expectAdminOrEventOrganizer';
import { loadAuthentication } from '@middlewares/loadAuthentication';
import { requireAuthentication } from '@middlewares/requireAuthentication';
import { UserLevel } from '@models/UserLevel';
import { ActivityService } from '@services/activity.service';
import { EventService } from '@services/event.service';
import { UserService } from '@services/user.service';
import { celebrate, Joi, Segments } from 'celebrate';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import {
    controller,
    httpDelete,
    httpGet,
    httpPost,
    httpPut,
} from 'inversify-express-utils';
import { QueryFailedError } from 'typeorm';

import ErrMessages from '../errors/messages/messages';
import { handleQueryFailedErorr } from '../utils/handleQueryFailedErorr';
import { Activity } from '@models/Activity';
import { expectToBeSameEventOrganizer } from '@middlewares/expectToBeSameEventOrganizer';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { ActivityRegistryService } from '@services/activity_registry.service';
import { EmailService } from '@services/email.service';
import renderEventName from '@utils/renderEventName';
import { ConflictingEditionError } from '@errors/specialErrors/ConflictingEditionError';

@controller('/sge')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class EventController {
    @inject(EventService)
    private eventService: EventService;

    @inject(UserService)
    private userService: UserService;

    @inject(ActivityService)
    private activityService: ActivityService;

    @inject(ActivityRegistryService)
    private activityRegistryService: ActivityRegistryService;

    @inject(EmailService)
    private emailService: EmailService;

    @httpGet('/', loadAuthentication)
    async listEvents(req: Request, res: Response) {
        const query = req.query;

        let findResult: ServiceOptions.FindManyResult<Event>;
        let limit: number, page: number;

        if (typeof query.limit == 'string' && !isNaN(parseInt(query.limit))) {
            limit = Number(query.limit);
        }

        if (typeof query.page == 'string' && !isNaN(parseInt(query.page))) {
            page = Number(query.page);
        }

        const isHighLevel =
            query.all &&
            req.user &&
            (req.user.level === UserLevel.ADMIN ||
                (await this.userService.isEventOrganizer(req.user.id)));

        if (isHighLevel) {
            findResult = await this.eventService.findAsAdmin({
                limit,
                page,
            });
        } else {
            findResult = await this.eventService.findAsCommonUser({
                limit,
                page,
            });
        }

        res.set('X-Total-Count', findResult.totalCount.toString());
        if (isHighLevel) {
            const eventList = findResult.items.map(async (event) => {
                const activity = await this.activityService.findByEventAsAdmin(
                    event.id
                );
                return {
                    ...event,
                    readyForCertificate:
                        await this.eventService.isReadyForEmission(event.id),
                    canExclude: activity.totalCount === 0,
                    canEditTime:
                        event.startDate > new Date() &&
                        activity.totalCount === 0,
                };
            });
            const items = await Promise.all(eventList);
            return res.json(items);
        } else {
            return res.json(
                findResult.items.map((event) => ({
                    ...event,
                }))
            );
        }
    }

    @httpGet('/old', loadAuthentication)
    async getOldEvents(req: Request, res: Response) {
        const query = req.query;

        let limit: number, page: number, startYear: number;
        let findResult: ServiceOptions.FindManyResult<Event>;

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

        //TODO: TESTES
        if (
            typeof req.query.startYear == 'string' &&
            !isNaN(parseInt(req.query.startYear))
        ) {
            startYear = Number(req.query.startYear);
        }

        const isHighLevel =
            query.all &&
            req.user &&
            (req.user.level === UserLevel.ADMIN ||
                (await this.userService.isEventOrganizer(req.user.id)));

        //TODO: TESTES
        if (isHighLevel) {
            findResult = await this.eventService.findOldEventsAsAdmin({
                limit,
                page,
                startYear,
            });
        } else {
            //TODO: TESTES
            findResult = await this.eventService.findOldEventsAsCommonUser({
                limit,
                page,
                startYear,
            });
        }

        res.set('X-Total-Count', findResult.totalCount.toString());
        if (isHighLevel) {
            const eventList = findResult.items.map(async (event) => {
                const activity = await this.activityService.findByEventAsAdmin(
                    event.id
                );
                return {
                    ...event,
                    readyForCertificate:
                        await this.eventService.isReadyForEmission(event.id),
                    canExclude: activity.totalCount === 0,
                    canEditTime:
                        event.startDate > new Date() &&
                        activity.totalCount === 0,
                };
            });
            const items = await Promise.all(eventList);
            return res.json(items);
        } else {
            return res.json(
                findResult.items.map((event) => ({
                    ...event,
                }))
            );
        }
    }

    @httpGet('/old/category/:url_src', loadAuthentication)
    async getEventsByCategoryUrl(req: Request, res: Response) {
        const query = req.query;

        let limit: number, page: number, startYear: number;
        const url_src = req.params.url_src;
        let findResult: ServiceOptions.FindManyResult<Event>;

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

        //TODO: TESTES
        if (
            typeof req.query.startYear == 'string' &&
            !isNaN(parseInt(req.query.startYear))
        ) {
            startYear = Number(req.query.startYear);
        }

        const isHighLevel =
            query.all &&
            req.user &&
            (req.user.level === UserLevel.ADMIN ||
                (await this.userService.isEventOrganizer(req.user.id)));

        if (isHighLevel) {
            findResult = await this.eventService.findOldEventsByCategoryAsAdmin(
                url_src,
                {
                    limit,
                    page,
                    startYear,
                }
            );
        } else {
            findResult =
                await this.eventService.findOldEventsByCategoryAsCommonUser(
                    url_src,
                    {
                        limit,
                        page,
                        startYear,
                    }
                );
        }

        res.set('X-Total-Count', findResult.totalCount.toString());
        if (isHighLevel) {
            const eventList = findResult.items.map(async (event) => {
                const activity = await this.activityService.findByEventAsAdmin(
                    event.id
                );
                return {
                    ...event,
                    readyForCertificate:
                        await this.eventService.isReadyForEmission(event.id),
                    canExclude: activity.totalCount === 0,
                    canEditTime:
                        event.startDate > new Date() &&
                        activity.totalCount === 0,
                };
            });
            const items = await Promise.all(eventList);
            return res.json(items);
        } else {
            return res.json(
                findResult.items.map((event) => ({
                    ...event,
                }))
            );
        }
    }

    @httpGet('/:id', loadAuthentication)
    async getEventById(req: Request, res: Response) {
        let event: Event;
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(404).send('Not found');
        }

        const isHighLevel =
            req.user &&
            (req.user.level === UserLevel.ADMIN ||
                (await this.userService.isEventOrganizer(req.user.id, id)));

        if (isHighLevel) {
            event = await this.eventService.findByIdAsAdmin(id);
        } else {
            event = await this.eventService.findByIdAsCommonUser(id);
        }

        if (isHighLevel) {
            const activity = await this.activityService.findByEventAsAdmin(
                event.id
            );
            const eventObject = {
                ...event,
                readyForCertificate: await this.eventService.isReadyForEmission(
                    event.id
                ),
                canExclude: activity.totalCount === 0,
                canEditTime:
                    event.startDate > new Date() && activity.totalCount === 0,
            };
            return res.json(eventObject);
        } else {
            return res.json({
                ...event,
            });
        }
    }

    /**
     * Pegar uma lista de atividades de um evento
     */
    @httpGet('/:id/activities', loadAuthentication)
    async getEventActivity(req: Request, res: Response) {
        let limit: number, page: number, fromUser: number, category: number;
        let findResult: ServiceOptions.FindManyResult<Activity>;

        const id = parseInt(req.params.id);

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

        if (
            typeof req.query.fromUser == 'string' &&
            !isNaN(parseInt(req.query.fromUser))
        ) {
            fromUser = Number(req.query.fromUser);
        }

        //TODO: TESTE filtro categoria
        if (
            typeof req.query.category == 'string' &&
            !isNaN(parseInt(req.query.category))
        ) {
            category = Number(req.query.category);
        }

        if (
            req.user &&
            (req.user.level === UserLevel.ADMIN ||
                (await this.userService.isEventOrganizer(req.user.id)))
        ) {
            //TODO: TESTE filtro categoria
            findResult = await this.activityService.findByEventAsAdmin(id, {
                limit,
                page,
                fromUser,
                category,
            });
        } else {
            //TODO: TESTE filtro categoria
            findResult = await this.activityService.findByEventAsCommonUser(
                id,
                {
                    limit,
                    page,
                    fromUser,
                    category,
                }
            );
        }

        const mappedItems = findResult.items.map(async (activity) => {
            const { totalCount } =
                await this.activityRegistryService.findByActivity(activity.id);
            return {
                ...activity,
                totalRegistry: totalCount,
            };
        });

        await Promise.all(mappedItems).then((items) => {
            res.set('X-Total-Count', findResult.totalCount.toString());

            items
                .sort(this.compare)
                .sort((a, b) =>
                    a.activityCategory.code.localeCompare(
                        b.activityCategory.code
                    )
                );
            return res.json(items);
        });
    }

    compare(a, b) {
        if (a.schedules[0].startDate < b.schedules[0].startDate) {
            return -1;
        }
        if (a.schedules[0].startDate > b.schedules[0].startDate) {
            return 1;
        }
        return 0;
    }

    @httpGet(
        '/activity/activity_registry/regstry_user/:userId',
        loadAuthentication
    )
    async getEventsByRegistry(req: Request, res: Response) {
        const query = req.query;

        let limit: number, page: number, old: string;
        const userId = req.params.userId;

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

        if (typeof req.query.old == 'string') {
            old = req.query.old;
        }

        const findResult = await this.eventService.findEventByRegistry(userId, {
            limit,
            page,
            old,
        });

        res.set('X-Total-Count', findResult.totalCount.toString());
        const events = findResult.items.map((event) => ({
            ...event,
        }));
        return res.json(events);
    }

    @httpPost(
        '/:eventId/activity',
        requireAuthentication,
        expectToBeSameEventOrganizer,
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                title: Joi.string().required().min(1).max(100),
                description: Joi.string().required().min(1).max(1500),
                vacancy: Joi.number().required().greater(0),
                workloadInMinutes: Joi.number().required().greater(0),
                schedules: Joi.array()
                    .required()
                    .items(
                        Joi.object().keys({
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
                                    .optional(),
                                otherwise: Joi.object()
                                    .keys({
                                        id: Joi.number().required(),
                                    })
                                    .required(),
                            }),
                            url: Joi.string().optional().uri().min(1).max(300),
                        })
                    )
                    .min(1),
                responsibleUsers: Joi.array()
                    .required()
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
                activityCategory: Joi.object()
                    .required()
                    .keys({
                        id: Joi.number().required().min(0),
                    }),
            }),
        })
    )
    async createActivity(req: Request, res: Response) {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            throw new NotFoundError('Event');
        }

        req.body = {
            ...req.body,
            event: {
                id: eventId,
            },
        };

        const activity = await this.activityService.create(req.body);
        return res.status(201).json(activity);
    }

    @httpGet('/:url_src/:id', loadAuthentication)
    async getEventsByIdCategory(req: Request, res: Response) {
        const query = req.query;

        const url_src = req.params.url_src;
        const id = parseInt(req.params.id);
        let event: Event;

        const isHighLevel =
            query.all &&
            req.user &&
            (req.user.level === UserLevel.ADMIN ||
                (await this.userService.isEventOrganizer(req.user.id)));

        if (isHighLevel) {
            event = await this.eventService.findEventsByCategoryAndIdAsAdmin(
                url_src,
                id
            );
        } else {
            event =
                await this.eventService.findEventsByCategoryAndIdAsCommonUser(
                    url_src,
                    id
                );
        }

        if (isHighLevel) {
            const activity = await this.activityService.findByEventAsAdmin(
                event.id
            );
            const eventObject = {
                ...event,
                readyForCertificate: await this.eventService.isReadyForEmission(
                    event.id
                ),
                canExclude: activity.totalCount === 0,
                canEditTime:
                    event.startDate > new Date() && activity.totalCount === 0,
            };
            return res.json(eventObject);
        } else {
            return res.json({
                ...event,
            });
        }
    }

    @httpPost(
        '/',
        requireAuthentication,
        expectAdmin,
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                edition: Joi.number().required().min(1),
                description: Joi.string().required().min(1).max(5000),
                startDate: Joi.date().required(),
                endDate: Joi.date().required().min(Joi.ref('startDate')),
                eventArea: Joi.object()
                    .required()
                    .keys({
                        id: Joi.number().required().min(0),
                    }),
                eventCategory: Joi.object()
                    .required()
                    .keys({
                        id: Joi.number().required().min(0),
                    }),
                responsibleUsers: Joi.array()
                    .required()
                    .items(
                        Joi.object().keys({
                            id: Joi.number().required().min(0),
                        })
                    )
                    .min(1),
                registryStartDate: Joi.date().required(),
                registryEndDate: Joi.date().required(),
                display: Joi.number()
                    .required()
                    .valid(...Object.values(NameDisplay)),
                editionDisplay: Joi.number()
                    .required()
                    .valid(...Object.values(EditionDisplay)),
                icon: Joi.string(),
                banner: Joi.string(),
            }),
        })
    )
    async create(req: Request, res: Response) {
        try {
            const event = await this.eventService.getInstance(req.body);

            const createdEvent = await this.eventService.create(event);

            return res.status(201).json(createdEvent);
        } catch (err) {
            //TODO: Tirar o tratamento de query failed daqui
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }

            if (err instanceof ConflictingEditionError) {
                return res.status(409).json({ message: err.message });
            }

            if (err instanceof BusinessRuleError) {
                return res.status(400).json({ message: err.message });
            }

            return res
                .status(400)
                .json({ message: ErrMessages.eventRoutes.creationError });
        }
    }

    @httpPut(
        '/:id',
        requireAuthentication,
        expectAdminOrEventOrganizer,
        celebrate({
            [Segments.BODY]: Joi.object()
                .keys({
                    edition: Joi.number().optional().min(1),
                    description: Joi.string().required().min(1).max(5000),
                    startDate: Joi.date().required(),
                    endDate: Joi.date().required(),
                    eventArea: Joi.object()
                        .required()
                        .keys({
                            id: Joi.number().required().min(0),
                        }),
                    eventCategory: Joi.object()
                        .optional()
                        .keys({
                            id: Joi.number().required().min(0),
                        }),
                    responsibleUsers: Joi.array()
                        .optional()
                        .items(
                            Joi.object().keys({
                                id: Joi.number().required().min(0),
                            })
                        )
                        .min(1),
                    statusVisible: Joi.bool().optional(),
                    statusActive: Joi.bool().optional(),
                    registryStartDate: Joi.date().optional(),
                    registryEndDate: Joi.date().optional(),
                    display: Joi.number()
                        .optional()
                        .valid(...Object.values(NameDisplay)),
                    editionDisplay: Joi.number()
                        .optional()
                        .valid(...Object.values(EditionDisplay)),
                    icon: Joi.string(),
                    banner: Joi.string(),
                })
                .min(1),
        })
    )
    async edit(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const userId = req.user.id;

        //TODO: pode ser utilizado um método para obter diretamente os usuários responsáveis por esse evento
        const event = await this.eventService.findByIdAsAdmin(id);

        const isResponsibleForEvent = event.responsibleUsers.find((resUser) => {
            return resUser.id === userId;
        });

        if (req.user.level === UserLevel.ADMIN || isResponsibleForEvent) {
            const eventNewData = await this.eventService.getInstance(req.body);

            if (isResponsibleForEvent) {
                delete eventNewData.responsibleUsers;
            }

            await this.eventService.edit(id, eventNewData);

            return res.status(200).send();
        }
        throw new InsufficientPermissionsError();
    }

    @httpPut(
        '/update_status/:id',
        requireAuthentication,
        expectAdminOrEventOrganizer,
        celebrate({
            [Segments.BODY]: Joi.object()
                .keys({
                    edition: Joi.number().optional().min(1),
                    description: Joi.string().optional().min(1).max(5000),
                    startDate: Joi.date().optional(),
                    endDate: Joi.date().optional(),
                    eventArea: Joi.object()
                        .optional()
                        .keys({
                            id: Joi.number().required().min(0),
                        }),
                    eventCategory: Joi.object()
                        .optional()
                        .keys({
                            id: Joi.number().required().min(0),
                        }),
                    responsibleUsers: Joi.array()
                        .optional()
                        .items(
                            Joi.object().keys({
                                id: Joi.number().required().min(0),
                            })
                        )
                        .min(1),
                    statusVisible: Joi.bool().optional(),
                    statusActive: Joi.bool().optional(),
                    registryStartDate: Joi.date().optional(),
                    registryEndDate: Joi.date().optional(),
                    display: Joi.number()
                        .optional()
                        .valid(...Object.values(NameDisplay)),
                    editionDisplay: Joi.number()
                        .optional()
                        .valid(...Object.values(EditionDisplay)),
                    icon: Joi.string(),
                    banner: Joi.string(),
                })
                .min(1),
        })
    )
    async editStatus(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const userId = req.user.id;

        //TODO: pode ser utilizado um método para obter diretamente os usuários responsáveis por esse evento
        const event = await this.eventService.findByIdAsAdmin(id);

        const isResponsibleForEvent = event.responsibleUsers.find((resUser) => {
            return resUser.id === userId;
        });

        if (req.user.level === UserLevel.ADMIN || isResponsibleForEvent) {
            const eventNewData = await this.eventService.getInstance(req.body);

            if (isResponsibleForEvent) {
                delete eventNewData.responsibleUsers;
            }

            await this.eventService.edit(id, eventNewData);

            return res.status(200).send();
        }
        throw new InsufficientPermissionsError();
    }

    @httpDelete(
        '/:id',
        requireAuthentication,
        expectAdmin,
        celebrate({
            [Segments.PARAMS]: Joi.object().keys({
                id: Joi.number().required().min(1),
            }),
        })
    )
    async delete(req: Request, res: Response) {
        const id = parseInt(req.params.id);

        const affected = await this.eventService.delete(id);

        if (affected > 0) {
            return res.status(204).send();
        } else {
            return res.status(404).send();
        }
    }

    @httpPost('/:id/emitir', requireAuthentication, expectAdminOrEventOrganizer)
    async emitirCertificado(req: Request, res: Response) {
        const { id } = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).send();
        }

        const isReady = await this.eventService.isReadyForEmission(
            parseInt(id)
        );

        if (!isReady) {
            return res
                .status(400)
                .json({ message: 'Event is not ready for certificate' });
        }

        const event = await this.eventService.findByIdAsCommonUser(
            parseInt(id)
        );

        event.endDate.setDate(event.endDate.getDate() + 1);

        const arrayEmail =
            await this.activityRegistryService.filterReadyForCertificate(
                parseInt(id)
            );

        try {
            await Promise.all(
                arrayEmail.map((e) => {
                    this.emailService
                        .sendMail({
                            to: e,
                            subject: `Certificados do evento ${renderEventName(
                                event
                            )}`,
                            html: [
                                'Olá,',
                                `Venho avisá-lo que os seus certificados do evento ${renderEventName(
                                    event
                                )} estão prontos`,
                                'Atenciosamente, a direção.',
                            ].join('<br />'),
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                })
            );

            return res.status(200).send();
        } catch (error) {
            return res
                .status(400)
                .json({ message: 'Houve uma falha no envio de emails' });
        }
    }
}
