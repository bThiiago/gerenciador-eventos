import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { expectSameUserOrAdmin } from '@middlewares/expectSameUserOrAdmin';
import { requireAuthentication } from '@middlewares/requireAuthentication';
import { Activity } from '@models/Activity';
import { Event } from '@models/Event';
import { ActivityService } from '@services/activity.service';
import { EventService } from '@services/event.service';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpGet } from 'inversify-express-utils';

@controller('/user/responsibility')
export class UserResponsibilityController {
    @inject(ActivityService)
    private activityService: ActivityService;

    @inject(EventService)
    private eventService: EventService;

    @httpGet('/:id', requireAuthentication, expectSameUserOrAdmin)
    async getOne(req: Request, res: Response): Promise<unknown> {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            throw new NotFoundError('User');
        }

        const isOld = req.query.old && req.query.old === 'true';

        let findResultEvent: ServiceOptions.FindManyResult<Event>;
        let findResultActivity: ServiceOptions.FindManyResult<Activity>;
        if (isOld) {
            findResultEvent = await this.eventService.findOldByResponsibleUser(
                id
            );
            findResultActivity =
                await this.activityService.findOldByResponsibleUser(id);
        } else {
            findResultEvent = await this.eventService.findByResponsibleUser(id);
            findResultActivity =
                await this.activityService.findByResponsibleUser(id);
        }

        const preparedEvents = findResultEvent.items.map(async (event) => ({
            id: event.id,
            edition: event.edition,
            startDate: event.startDate,
            endDate: event.endDate,
            eventArea: event.eventArea,
            eventCategory: event.eventCategory,
            statusVisible: event.statusVisible,
            statusActive: event.statusActive,
            display: event.display,
            editionDisplay: event.editionDisplay,
            readyForCertificate : await this.eventService.isReadyForEmission(event.id),
        }));

        const preparedActivities = findResultActivity.items.map((activity) => ({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            vacancy: activity.vacancy,
            workloadInMinutes: activity.workloadInMinutes,
            schedules: activity.schedules,
            teachingUsers: activity.teachingUsers,
            readyForCertificateEmission: activity.readyForCertificateEmission,
        }));

        const resolvedEvents = await Promise.all(preparedEvents);
        return res.json({
            activities: preparedActivities,
            events: resolvedEvents,
        });
    }

    @httpGet('/permissions/:id', requireAuthentication, expectSameUserOrAdmin)
    async getPermissions(req: Request, res: Response): Promise<unknown> {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            throw new NotFoundError('User');
        }

        let isEventOrganizer = true;
        let isActivityResponsible = true;

        let findResultEvent: ServiceOptions.FindManyResult<Event>;
        let findResultActivity: ServiceOptions.FindManyResult<Activity>;

        findResultEvent = await this.eventService.findOldByResponsibleUser(
            id
        );
        findResultActivity =
            await this.activityService.findOldByResponsibleUser(id);
        

        if (findResultEvent.totalCount == 0) {
            findResultEvent = await this.eventService.findByResponsibleUser(id);
        }
        if (findResultActivity.totalCount == 0) {
            findResultActivity = await this.activityService.findByResponsibleUser(id);
        }

        if (findResultEvent.totalCount == 0) {
            isEventOrganizer = false;
        }
        if (findResultActivity.totalCount == 0) {
            isActivityResponsible = false;
        }

        return res.json({
            isEventOrganizer,
            isActivityResponsible,
        });
    }

    @httpGet('/:id/event', requireAuthentication, expectSameUserOrAdmin)
    async getEventById(req: Request, res: Response): Promise<unknown> {
        const id = parseInt(req.params.id);
        let limit: number, page: number, startYear: number;

        if (isNaN(id)) {
            throw new NotFoundError('User');
        }

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
            typeof req.query.startYear == 'string' &&
            !isNaN(parseInt(req.query.startYear))
        ) {
            startYear = Number(req.query.startYear);
        }

        const isOld = req.query.old && req.query.old === 'true';

        let findResult: ServiceOptions.FindManyResult<Event>;
        if (isOld) {
            findResult = await this.eventService.findOldByResponsibleUser(id, {
                page,
                limit,
                startYear
            });
        } else {
            findResult = await this.eventService.findByResponsibleUser(id, {
                page,
                limit,
                startYear
            });
        }

        res.set('X-Total-Count', findResult.totalCount.toString());

        const preparedEvents = findResult.items.map(async (event) => ({
            id: event.id,
            edition: event.edition,
            startDate: event.startDate,
            endDate: event.endDate,
            eventArea: event.eventArea,
            eventCategory: event.eventCategory,
            statusVisible: event.statusVisible,
            statusActive: event.statusActive,
            display: event.display,
            editionDisplay: event.editionDisplay,
            readyForCertificate : await this.eventService.isReadyForEmission(event.id),
        }));

        const resolvedEvents = await Promise.all(preparedEvents);
        return res.json(resolvedEvents);
    }
    
    @httpGet('/:id/activity', requireAuthentication, expectSameUserOrAdmin)
    async getActivityById(req: Request, res: Response): Promise<unknown> {
        const id = parseInt(req.params.id);
        let limit: number, page: number, category: number;

        if (isNaN(id)) {
            throw new NotFoundError('User');
        }

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
            typeof req.query.category == 'string' &&
            !isNaN(parseInt(req.query.category))
        ) {
            category = Number(req.query.category);
        }

        const isOld = req.query.old && req.query.old === 'true';

        let findResult: ServiceOptions.FindManyResult<Activity>;
        if (isOld) {
            findResult = await this.activityService.findOldByResponsibleUser(id, {
                page,
                limit,
                category
            });
        } else {
            findResult = await this.activityService.findByResponsibleUser(id, {
                page,
                limit,
                category
            });
        }

        res.set('X-Total-Count', findResult.totalCount.toString());

        const preparedData = findResult.items.map((activity) => ({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            vacancy: activity.vacancy,
            workloadInMinutes: activity.workloadInMinutes,
            schedules: activity.schedules,
            responsibleUsers: activity.responsibleUsers,
            teachingUsers: activity.teachingUsers,
            readyForCertificateEmission: activity.readyForCertificateEmission,
            activityCategory: activity.activityCategory
        }));

        return res.json(preparedData);
    }
}
