import { container } from '@core/container';
import { dataSource } from '@database/connection';
import { MultipleAccountsNotConfirmed } from '@errors/services/MultipleAccountsNotConfirmed';
import { ActivityDeleteHasRegistry } from '@errors/specialErrors/ActivityDeleteHasRegistry';
import { ActivityDeleteIsHappening } from '@errors/specialErrors/ActivityDeleteIsHappening';
import { DateConflictError } from '@errors/specialErrors/DateConflictError';
import { IncompleteActivity } from '@errors/specialErrors/IncompleteActivity';
import { Activity } from '@models/Activity';
import { ActivityRegistry } from '@models/ActivityRegistry';
import { Schedule } from '@models/Schedule';
import { inject, injectable } from 'inversify';
import renderEventName from '@utils/renderEventName';
import {
    DataSource,
    DeepPartial,
    EntityManager,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { EventChangeRestriction } from '../errors/specialErrors/EventChangeRestriction';
import { NotFoundError } from '../errors/specialErrors/NotFoundError';
import { ResponsibleUsersUndefined } from '../errors/undefinedErrors/ResponsibleUsersUndefined';
import { SchedulesUndefined } from '../errors/undefinedErrors/SchedulesUndefined';
import { UserService } from './user.service';

interface ActivityFilterOptions {
    category?: number;
}

interface FromUser {
    fromUser?: number;
}

interface ActivityFindManyOptions extends ServiceOptions.FindManyOptions {
    title?: string;
}

@injectable()
export class ActivityService {
    private readonly connection: DataSource;
    private readonly repository: Repository<Activity>;
    private readonly scheduleRepository: Repository<Schedule>;
    private readonly activityRegistryRepository: Repository<ActivityRegistry>;

    @inject(UserService)
    private userService: UserService;

    constructor() {
        this.connection = dataSource;
        this.repository = this.connection.getRepository(Activity);
        this.scheduleRepository = this.connection.getRepository(Schedule);
        this.activityRegistryRepository =
            this.connection.getRepository(ActivityRegistry);
    }

    private queryForAdmin(query: SelectQueryBuilder<Activity>): void {
        query
            .innerJoin('activity.schedules', 'schedules')
            .innerJoin('activity.event', 'event')
            .innerJoin('activity.responsibleUsers', 'responsibleUsers')
            .innerJoin('activity.activityCategory', 'activityCategory')
            .innerJoin('event.eventCategory', 'eventCategory')
            .leftJoin('schedules.room', 'room')
            .leftJoin('activity.teachingUsers', 'teachingUsers')
            .select([
                'activity',
                'activity.readyForCertificateEmission',

                'schedules',

                'room',

                'event.id',
                'event.edition',
                'event.startDate',
                'event.endDate',
                'event.statusVisible',
                'event.registryStartDate',
                'event.registryEndDate',

                'teachingUsers.id',
                'teachingUsers.name',
                'teachingUsers.cpf',
                'teachingUsers.email',

                'responsibleUsers.id',
                'responsibleUsers.name',
                'responsibleUsers.cpf',

                'eventCategory',
                'activityCategory',
            ])
            .orderBy('schedules.startDate', 'ASC')
            .addOrderBy('activity.indexInCategory', 'ASC')
            .addOrderBy('activity.title', 'ASC');
    }

    private queryForCommonUser(query: SelectQueryBuilder<Activity>): void {
        query
            .innerJoin('activity.event', 'event')
            .innerJoin('activity.responsibleUsers', 'responsibleUsers')
            .innerJoin('activity.schedules', 'schedules')
            .innerJoin('activity.activityCategory', 'activityCategory')
            .innerJoin('event.eventCategory', 'eventCategory')
            .leftJoin('schedules.room', 'room')
            .leftJoin('activity.teachingUsers', 'teachingUsers')
            .select([
                'activity',
                'schedules',
                'room',

                'teachingUsers.id',
                'teachingUsers.name',

                'responsibleUsers.id',
                'responsibleUsers.name',
                'responsibleUsers.cpf',

                'event.id',
                'event.edition',
                'event.startDate',
                'event.endDate',
                'event.registryStartDate',
                'event.registryEndDate',

                'eventCategory',
                'activityCategory',
            ])
            .orderBy('schedules.startDate', 'ASC')
            .addOrderBy('activity.indexInCategory', 'ASC')
            .addOrderBy('activity.title', 'ASC');
    }

    public hasConflictWithSchedules(
        schedule: Schedule,
        schedules: Schedule[]
    ): boolean {
        const startDate = schedule.startDate;
        const endDate = new Date(
            schedule.startDate.getTime() + schedule.durationInMinutes * 60000
        );
        const noConflict = schedules.every((otherSchedule) => {
            if (schedule == otherSchedule) return true;
            const otherStartDate = otherSchedule.startDate;
            const otherEndDate = new Date(
                otherStartDate.getTime() +
                otherSchedule.durationInMinutes * 60000
            );

            return !(
                (startDate >= otherStartDate && startDate < otherEndDate) ||
                (endDate > otherStartDate && endDate <= otherEndDate)
            );
        });
        return !noConflict;
    }

    private async verifyScheduleConflict(
        activityId: number,
        activity: Partial<Activity>,
        manager?: EntityManager
    ): Promise<void> {
        if (activity.schedules) {
            const repoToUse = manager
                ? manager.getRepository(Schedule)
                : this.scheduleRepository;

            const conflicts: number[] = [];
            for (let index = 0; index < activity.schedules.length; index++) {
                const schedule = activity.schedules[index];
                if (
                    this.hasConflictWithSchedules(schedule, activity.schedules)
                ) {
                    conflicts.push(index);
                }
            }

            if (conflicts.length > 0) {
                throw new DateConflictError(
                    'Conflito na própria atividade',
                    conflicts.map((index) => {
                        return {
                            activityName: activity.title,
                            eventName: 'Evento atual',
                            index,
                        };
                    })
                );
            }

            const teacherConflicts: {
                activityName: string;
                eventName: string;
                index?: number;
            }[] = [];

            for (const schedule of activity.schedules) {
                const startDate = schedule.startDate;
                const endDate = new Date(
                    schedule.startDate.getTime() +
                    schedule.durationInMinutes * 60000
                );

                const teachingUserIds =
                    activity.teachingUsers?.map((user) => user.id) || [];

                for (const teachingUserId of teachingUserIds) {
                    const query = repoToUse
                        .createQueryBuilder('schedule')
                        .innerJoin('schedule.activity', 'activity')
                        .innerJoin('activity.event', 'event')
                        .innerJoin('event.eventCategory', 'eventCategory')
                        .innerJoin('activity.teachingUsers', 'teachingUsers')
                        .select([
                            'schedule',
                            'activity',
                            'event',
                            'eventCategory',
                        ])
                        .where('teachingUsers.id = :teachingUserId', {
                            teachingUserId,
                        })
                        .andWhere(
                            '((:startDate >= schedule."startDate" AND :startDate < (schedule."startDate" + INTERVAL \'1 min\' * schedule."durationInMinutes")) OR (:endDate > schedule."startDate" AND :endDate <= (schedule."startDate" + INTERVAL \'1 min\' * schedule."durationInMinutes")))',
                            { startDate, endDate }
                        )
                        .andWhere('event."endDate" > NOW()');

                    if (activityId) {
                        query.andWhere('activity.id != :activityId', {
                            activityId,
                        });
                    }

                    const conflictingScheduleWithTeachingUser =
                        await query.getOne();

                    if (conflictingScheduleWithTeachingUser) {
                        const event =
                            conflictingScheduleWithTeachingUser.activity.event;
                        teacherConflicts.push({
                            eventName: renderEventName(event),
                            activityName:
                                conflictingScheduleWithTeachingUser.activity
                                    .title,
                            index: activity.schedules.indexOf(schedule),
                        });
                    }
                }
            }

            if (teacherConflicts.length > 0) {
                throw new DateConflictError(
                    'Ocorreu conflito com o ministrante',
                    teacherConflicts
                );
            }

            const otherConflicts: {
                activityName: string;
                eventName: string;
                roomName?: string;
                index?: number;
            }[] = [];

            for (let index = 0; index < activity.schedules.length; index++) {
                const schedule = activity.schedules[index];
                if (schedule.room) {
                    const startDate = schedule.startDate;
                    const endDate = new Date(
                        schedule.startDate.getTime() +
                        schedule.durationInMinutes * 60000
                    );

                    const query = repoToUse
                        .createQueryBuilder('schedule')
                        .innerJoin('schedule.activity', 'activity')
                        .innerJoin('activity.event', 'event')
                        .innerJoin('event.eventCategory', 'eventCategory')
                        .innerJoin('schedule.room', 'room')
                        .select([
                            'schedule',
                            'activity',
                            'event',
                            'room',
                            'eventCategory',
                        ])
                        .where('room.id = :roomId', {
                            roomId: schedule.room.id,
                        })
                        .andWhere(
                            '((:startDate >= schedule."startDate" AND :startDate < (schedule."startDate" + INTERVAL \'1 min\' * schedule."durationInMinutes")) OR (:endDate > schedule."startDate" AND :endDate <= (schedule."startDate" + INTERVAL \'1 min\' * schedule."durationInMinutes")))',
                            { startDate, endDate }
                        )
                        .andWhere('event."endDate" > NOW()');

                    if (activityId) {
                        query.andWhere('activity.id != :activityId', {
                            activityId,
                        });
                    }

                    const conflictingSchedule = await query.getOne();

                    if (conflictingSchedule) {
                        const event = conflictingSchedule.activity.event;
                        otherConflicts.push({
                            eventName: renderEventName(event),
                            activityName: conflictingSchedule.activity.title,
                            index,
                        });
                    }
                }
            }

            if (otherConflicts.length > 0) {
                throw new DateConflictError(
                    'Ocorreu conflito com outras atividades',
                    otherConflicts
                );
            }
        }
    }

    public isSchedulesTimeDifferent(
        oldSchedules: Schedule[],
        newSchedules: Schedule[]
    ): boolean {
        if (oldSchedules.length != newSchedules.length) return true;
        const isEqual = oldSchedules.every((oldSchedule) => {
            const newSchedule = newSchedules.find(
                (schedule) => schedule.id === oldSchedule.id
            );
            if (!newSchedule) return false;
            return (
                newSchedule.durationInMinutes ===
                oldSchedule.durationInMinutes &&
                newSchedule.startDate.getTime() ===
                oldSchedule.startDate.getTime()
            );
        });
        return !isEqual;
    }

    public getInstance(entityLikeArray: DeepPartial<Activity>): Activity {
        const activity = this.repository.create(entityLikeArray);
        return activity;
    }

    public async findByScheduleId(id: number): Promise<Activity> {
        const query = this.repository.createQueryBuilder('activity');

        this.queryForAdmin(query);

        query.where('schedules.id = :scheduleId', { scheduleId: id });

        const activity = await query.getOne();

        if (activity) return activity;
        throw new NotFoundError('Activity');
    }

    public async findByIdAsCommonUser(id: number): Promise<Activity> {
        const query = this.repository.createQueryBuilder('activity');

        this.queryForCommonUser(query);

        query.where('activity.id = :activityId', { activityId: id });
        query.andWhere('event.statusVisible = true');

        const activity = await query.getOne();

        if (activity) return activity;
        throw new NotFoundError('Activity');
    }

    public async findByIdAsAdmin(
        id: number,
        manager?: EntityManager
    ): Promise<Activity> {
        const query = manager
            ? manager.getRepository(Activity).createQueryBuilder('activity')
            : this.repository.createQueryBuilder('activity');

        this.queryForAdmin(query);

        query.where('activity.id = :activityId', { activityId: id });

        const activity = await query.getOne();

        if (activity) return activity;
        throw new NotFoundError('Activity');
    }

    public async findByEventAsCommonUser(
        eventId: number,
        options?: FromUser & ActivityFindManyOptions & ActivityFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Activity>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;
        const query = this.repository.createQueryBuilder('activity');

        this.queryForCommonUser(query);

        query.where('activity.event.id = :eventId', { eventId });
        query.andWhere(
            '(event."statusVisible" = true OR event."endDate" < NOW())'
        );

        if (options?.title) {
            query.andWhere('activity.title LIKE :title', {
                title: '%' + options.title + '%',
            });
        }

        //TODO: TESTE filtro categoria
        if (options?.category) {
            query.andWhere('activity.activityCategory = :category', {
                category: options.category,
            });
        }

        if (options?.fromUser) {
            query.leftJoin('activity.activityRegistration', 'registry');
            query.andWhere('registry.userId = :userId', {
                userId: options.fromUser,
            });
            query.addSelect('registry.rating');
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const activities = await query.getMany();
        return { items: activities, totalCount };
    }

    public async findByEventAsAdmin(
        eventId: number,
        options?: FromUser & ActivityFindManyOptions & ActivityFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Activity>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;
        const query = this.repository.createQueryBuilder('activity');

        this.queryForAdmin(query);

        query.where('activity.event.id = :eventId', { eventId });

        if (options?.title) {
            query.andWhere('activity.title LIKE :title', {
                title: '%' + options.title + '%',
            });
        }

        if (options?.category) {
            query.andWhere('activity.activityCategory = :category', {
                category: options.category,
            });
        }

        if (options?.fromUser) {
            await this.userService.findById(options.fromUser);

            query.leftJoin('activity.activityRegistration', 'registry');
            query.andWhere('registry.userId = :userId', {
                userId: options.fromUser,
            });
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const activities = await query.getMany();
        return { items: activities, totalCount };
    }

    /**
     * Espera-se que essa função seja utilizada apenas pelo próprio usuário responsável
     */
    public async findByResponsibleUser(
        userId: number,
        options?: ActivityFindManyOptions & ActivityFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Activity>> {
        // dará erro se não encontrar o usuário, prosseguindo se existir
        await this.userService.findById(userId);

        const query = this.repository.createQueryBuilder('activity');

        const limit = options?.limit > 0 ? options.limit : 10;
        const page = options?.page > 0 ? (options.page - 1) * limit : 0;

        this.queryForAdmin(query);

        query.where('responsibleUsers.id = :userId', { userId });
        query.andWhere('event.endDate > NOW()');

        //TODO: TESTE filtro categoria
        if (options?.category) {
            query.andWhere('activity.activityCategory = :category', {
                category: options.category,
            });
        }

        if (options?.title) {
            query.andWhere('activity.title LIKE :title', {
                title: '%' + options.title + '%',
            });
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(page);
        const activities = await query.getMany();
        return { items: activities, totalCount };
    }

    public async findOldByResponsibleUser(
        userId: number,
        options?: ActivityFindManyOptions & ActivityFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Activity>> {
        // dará erro se não encontrar o usuário, prosseguindo se existir
        await this.userService.findById(userId);

        const query = this.repository.createQueryBuilder('activity');

        const limit = options?.limit > 0 ? options.limit : 10;
        const page = options?.page > 0 ? (options.page - 1) * limit : 0;

        this.queryForAdmin(query);

        query.where('responsibleUsers.id = :userId', { userId });
        query.andWhere('event.endDate < NOW()');

        //TODO: TESTE filtro categoria
        if (options?.category) {
            query.andWhere('activity.activityCategory = :category', {
                category: options.category,
            });
        }
        if (options?.title) {
            query.andWhere('activity.title LIKE :title', {
                title: '%' + options.title + '%',
            });
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(page);
        const activities = await query.addOrderBy('activity.title').getMany();
        return { items: activities, totalCount };
    }

    public async create(activity: Activity): Promise<Activity> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Activity);

                    if (activity.responsibleUsers) {
                        const userIds = activity.responsibleUsers.map(
                            (r) => r.id
                        );

                        const confirmedUsers =
                            await this.userService.findUsersArray(
                                userIds,
                                manager
                            );

                        if (confirmedUsers.length != userIds.length) {
                            // Encontra os usuários que estão na listas, e que não foram encontrados no DB
                            const diff = userIds.filter(
                                (u) => !confirmedUsers.some((cf) => u == cf.id)
                            );
                            // Monta uma lista com os nomes das pessoas não encontradas
                            const names = confirmedUsers
                                .filter((cf) => !diff.some((d) => d == cf.id))
                                .map((u) => u.name);
                            throw new MultipleAccountsNotConfirmed(names);
                        }
                    }

                    if (activity.teachingUsers) {
                        const userIds = activity.teachingUsers.map((r) => r.id);

                        const confirmedUsers =
                            await this.userService.findUsersArray(
                                userIds,
                                manager
                            );

                        if (confirmedUsers.length != userIds.length) {
                            // Encontra os usuários que estão na listas, e que não foram encontrados no DB
                            const diff = userIds.filter(
                                (u) => !confirmedUsers.some((cf) => u == cf.id)
                            );
                            // Monta uma lista com os nomes das pessoas não encontradas
                            const names = confirmedUsers
                                .filter((cf) => !diff.some((d) => d == cf.id))
                                .map((u) => u.name);
                            throw new MultipleAccountsNotConfirmed(names);
                        }
                    }

                    await manager.query('LOCK activity');
                    if (activity.event && activity.activityCategory) {
                        activity.indexInCategory =
                            (
                                await manager
                                    .getRepository(Activity)
                                    .createQueryBuilder('activity')
                                    .setLock('pessimistic_read')
                                    .innerJoin('activity.event', 'event')
                                    .innerJoin(
                                        'activity.activityCategory',
                                        'category'
                                    )
                                    .select([
                                        'activity.id',
                                        'event.id',
                                        'category.id',
                                    ])
                                    .where('event.id = :eventId', {
                                        eventId: activity.event.id,
                                    })
                                    .andWhere('category.id = :categoryId', {
                                        categoryId:
                                            activity.activityCategory.id,
                                    })
                                    .getMany()
                            ).length + 1;
                    }

                    await this.verifyScheduleConflict(
                        undefined,
                        activity,
                        manager
                    );
                    return repo.save(activity);
                })
                .then(resolve)
                .catch(reject);
        });
    }

    public async edit(
        id: number,
        activity: Partial<Activity>
    ): Promise<Activity> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Activity);
                    const oldActivity = await repo.findOne({
                        where: { id },
                        relations: [
                            'event',
                            'activityRegistration',
                            'schedules',
                            'activityCategory',
                        ],
                    });

                    const oldActivityRegistration = await repo.findOne({
                        where: { id },
                        select: ['readyForCertificateEmission'],
                    });

                    if (
                        activity.event &&
                        activity.event.id !== oldActivity.event.id
                    )
                        throw new EventChangeRestriction();
                    if (activity.schedules && activity.schedules.length == 0)
                        throw new SchedulesUndefined();
                    if (
                        activity.responsibleUsers &&
                        activity.responsibleUsers.length == 0
                    )
                        throw new ResponsibleUsersUndefined();

                    if (oldActivityRegistration.readyForCertificateEmission)
                        activity.readyForCertificateEmission = true;
                    else if (activity.readyForCertificateEmission) {
                        const isFinished = oldActivity.schedules.every(
                            (schedule) => schedule.startDate < new Date()
                        );
                        if (!isFinished)
                            throw new IncompleteActivity(
                                'A atividade ainda não está finalizada'
                            );
                    }

                    await manager.query('LOCK activity');
                    if (
                        activity.activityCategory &&
                        activity.activityCategory.id !==
                        oldActivity.activityCategory.id
                    ) {
                        activity.indexInCategory =
                            (
                                await manager
                                    .getRepository(Activity)
                                    .createQueryBuilder('activity')
                                    .innerJoin('activity.event', 'event')
                                    .innerJoin(
                                        'activity.activityCategory',
                                        'category'
                                    )
                                    .select([
                                        'activity.id',
                                        'event.id',
                                        'category.id',
                                    ])
                                    .where('event.id = :eventId', {
                                        eventId: oldActivity.event.id,
                                    })
                                    .andWhere('category.id = :categoryId', {
                                        categoryId:
                                            activity.activityCategory.id,
                                    })
                                    .getMany()
                            ).length + 1;

                        await manager
                            .getRepository(Activity)
                            .createQueryBuilder('activity')
                            .innerJoin('activity.event', 'event')
                            .update('activity')
                            .set({
                                indexInCategory: () => '"indexInCategory" - 1',
                            })
                            .where('"indexInCategory" > :oldIndex', {
                                oldIndex: oldActivity.indexInCategory,
                            })
                            .andWhere('event.id = :eventId', {
                                eventId: oldActivity.event.id,
                            })
                            .andWhere('activityCategory.id = :categoryId', {
                                categoryId: oldActivity.activityCategory.id,
                            })
                            .execute();
                    } else {
                        activity.indexInCategory = oldActivity.indexInCategory;
                    }

                    if (activity.schedules) {
                        await this.verifyScheduleConflict(
                            id,
                            activity,
                            manager
                        );
                        if (
                            this.isSchedulesTimeDifferent(
                                oldActivity.schedules,
                                activity.schedules
                            )
                        ) {
                            this.activityRegistryRepository.delete({
                                activity: { id },
                            });
                        }
                    }

                    const merged = repo.merge(oldActivity, activity);

                    if (activity.schedules)
                        merged.schedules = activity.schedules;
                    if (activity.teachingUsers)
                        merged.teachingUsers = activity.teachingUsers;
                    if (activity.responsibleUsers)
                        merged.responsibleUsers = activity.responsibleUsers;

                    return repo.save(merged);
                })
                .then((editedActivity) => resolve(editedActivity))
                .catch((err) => reject(err));
        });
    }

    public async delete(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Activity);

                    const toBeDeletedActivity = await repo.findOne({
                        where: { id },
                        relations: [
                            'event',
                            'activityCategory',
                            'activityRegistration',
                        ],
                    });

                    if (toBeDeletedActivity) {
                        if (
                            toBeDeletedActivity.activityRegistration.length > 0
                        ) {
                            throw new ActivityDeleteHasRegistry();
                        }

                        const atualDate = new Date();

                        if (
                            atualDate > toBeDeletedActivity.event.startDate &&
                            atualDate < toBeDeletedActivity.event.endDate &&
                            toBeDeletedActivity.event.statusVisible == true
                        ) {
                            throw new ActivityDeleteIsHappening();
                        }

                        await manager.query('LOCK activity');
                        await manager
                            .getRepository(Activity)
                            .createQueryBuilder('activity')
                            .innerJoin('activity.event', 'event')
                            .innerJoin(
                                'activity.activityCategory',
                                'activityCategory'
                            )
                            .update('activity')
                            .set({
                                indexInCategory: () => '"indexInCategory" - 1',
                            })
                            .where('"indexInCategory" > :oldIndex', {
                                oldIndex: toBeDeletedActivity.indexInCategory,
                            })
                            .andWhere('event.id = :eventId', {
                                eventId: toBeDeletedActivity.event.id,
                            })
                            .andWhere('activityCategory.id = :categoryId', {
                                categoryId:
                                    toBeDeletedActivity.activityCategory.id,
                            })
                            .execute();
                    }

                    return repo.delete(id);
                })
                .then((deleteResult) => resolve(deleteResult.affected))
                .catch((err) => reject(err));
        });
    }
}

container.bind(ActivityService).toSelf();
