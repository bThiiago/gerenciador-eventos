import {
    DataSource,
    DeepPartial,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';

import { ActivityRegistry } from '@models/ActivityRegistry';
import { dataSource } from '../database/connection';
import { User } from '@models/User';
import { RegistredUser } from '../errors/services/RegistredUser';
import { ArchivedEventError } from '../errors/specialErrors/ArchivedEventError';
import { InvisibleEventError } from '../errors/specialErrors/InvisibleEventError';
import { ResponsibleRegistryError } from '../errors/services/ResponsibleRegistryError';
import { inject, injectable } from 'inversify';
import { ActivityService } from './activity.service';
import { container } from '@core/container';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { Presence } from '@models/Presence';
import { Activity } from '@models/Activity';
import { DateConflictError } from '@errors/specialErrors/DateConflictError';
import { OutsideOfRegistryDate } from '@errors/specialErrors/OutsideOfRegistryDate';
import renderEventName from '@utils/renderEventName';

@injectable()
export class ActivityRegistryService {
    private readonly connection: DataSource;
    private readonly repository: Repository<ActivityRegistry>;

    @inject(ActivityService)
    private activityService: ActivityService;

    constructor() {
        this.connection = dataSource;
        this.repository = this.connection.getRepository(ActivityRegistry);
    }

    private queryAttributes(query: SelectQueryBuilder<ActivityRegistry>): void {
        query
            .innerJoin('activity_registry.activity', 'activity')
            .innerJoin('activity_registry.user', 'user')
            .leftJoin('activity_registry.presences', 'presences')
            .leftJoin('presences.schedule', 'schedule')
            .leftJoin('activity.schedules', 'schedules')
            .select([
                'activity_registry',
                'schedules',
                'schedule',

                'activity.id',
                'activity.title',
                'activity.vacancy',

                'user.id',
                'user.name',
                'user.cpf',
                'user.email',

                'presences',
            ])
            .orderBy('user.name', 'ASC');
    }

    public getInstance(
        entityLikeArray: DeepPartial<ActivityRegistry>
    ): ActivityRegistry {
        const activityRegistry = this.repository.create(entityLikeArray);
        return activityRegistry;
    }

    public async findByActivity(
        activityId: number,
        options?: ServiceOptions.FindManyOptions
    ): Promise<ServiceOptions.FindManyResult<ActivityRegistry>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('activity_registry');

        this.queryAttributes(query);

        query.where('activity.id = :id', {
            id: activityId,
        });

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const registry = await query.getMany();

        return { items: registry, totalCount };
    }

    public async findByActivityIdAndUserId(
        activityId: number,
        userId: number
    ): Promise<ActivityRegistry> {
        const query = this.repository.createQueryBuilder('activity_registry');

        this.queryAttributes(query);

        query.where('activity.id = :activityId', {
            activityId,
        });
        query.andWhere('user.id = :userId', {
            userId,
        });

        const registry = await query.getOne();
        if (registry) return registry;
        throw new NotFoundError('Registry');
    }


    private async checkIfConflictsWithOtherActivity(
        activity: Activity,
        user: User
    ) {
        const conflicts: {
            activityName: string;
            eventName: string;
            roomName?: string;
            index?: number;
        }[] = [];
        const promises = activity.schedules.map(async (schedule, index) => {
            const startDate = schedule.startDate;
            const endDate = new Date(
                schedule.startDate.getTime() +
                schedule.durationInMinutes * 60000
            );

            const query = this.repository
                .createQueryBuilder('registry')
                .innerJoin('registry.activity', 'activity')
                .innerJoin('activity.event', 'event')
                .innerJoin('event.eventCategory', 'eventCategory')
                .innerJoin('registry.user', 'user')
                .innerJoin('activity.schedules', 'schedules')
                .select([
                    'registry.id',
                    'activity.title',
                    'event',
                    'eventCategory',
                ])
                .where(
                    '((:startDate >= schedules."startDate" AND :startDate < (schedules."startDate" + INTERVAL \'1 min\' * schedules."durationInMinutes")) OR (:endDate > schedules."startDate" AND :endDate <= (schedules."startDate" + INTERVAL \'1 min\' * schedules."durationInMinutes")))',
                    {
                        startDate,
                        endDate,
                    }
                )
                .andWhere('event."endDate" > NOW()')
                .andWhere('user.id = :userId', {
                    userId: user.id,
                });
            const conflictingRegistry = await query.getOne();
            if (conflictingRegistry) {
                conflicts.push({
                    eventName: renderEventName(
                        conflictingRegistry.activity.event
                    ),
                    activityName: conflictingRegistry.activity.title,
                    index,
                });
            }
            return schedule;
        });
        await Promise.all(promises);
        if (conflicts.length > 0) {
            throw new DateConflictError('Inscrição conflitante', conflicts);
        }
    }

    public async create(
        activityRegistry: ActivityRegistry
    ): Promise<ActivityRegistry> {
        return new Promise((resolve, reject) => {
            this.connection.transaction(async (manager) => {
                const repo = manager.getRepository(ActivityRegistry);
                await manager.query('LOCK activity_registry');
                const subscriptions = await repo
                    .createQueryBuilder('registry')
                    .select('registry.id')
                    .innerJoin('registry.activity', 'activity')
                    .where('activity.id = :activityId', {
                        activityId: activityRegistry.activity.id,
                    })
                    .getCount();

                const activity = await this.activityService.findByIdAsAdmin(
                    activityRegistry.activity.id,
                    manager
                );
                activityRegistry.presences = activity.schedules.map(
                    schedule => new Presence(schedule, activityRegistry)
                );
                return repo.save(activityRegistry);
            })
                .then(resolve)
                .catch(reject);
        });
    }

    async registry(
        activityId: number,
        userId: number
    ): Promise<ActivityRegistry> {
        const userRepo = dataSource.getRepository(User);

        const activity = await this.activityService.findByIdAsAdmin(activityId);

        const currentDate = new Date();

        if (!activity) {
            throw new BusinessRuleError('Atividade não encontrada');
        } else if (
            activity.event.registryEndDate < currentDate ||
            activity.event.registryStartDate > currentDate
        ) {
            throw new OutsideOfRegistryDate();
        } else if (!activity.event.statusVisible) {
            throw new InvisibleEventError('O Evento está invisível');
        }

        const isResponsible = activity.responsibleUsers.find(
            (u) => u.id === userId
        );

        if (isResponsible) {
            throw new ResponsibleRegistryError();
        }

        const user = await userRepo.findOneBy({ id: userId });

        const alreadyExist = await this.repository.findOneBy({
            activity: { id: activityId },
            user: { id: userId },
        });

        if (alreadyExist) {
            throw new RegistredUser();
        }

        await this.checkIfConflictsWithOtherActivity(activity, user);

        const registry = new ActivityRegistry(activity, user);

        return this.create(registry);
    }

    async responsibleRegistry(
        activityId: number,
        userId: number
    ): Promise<ActivityRegistry> {
        const userRepo = dataSource.getRepository(User);

        const activity = await this.activityService.findByIdAsAdmin(activityId);

        if (!activity) {
            throw new BusinessRuleError('Atividade não encontrada');
        } else if (!activity.event.statusVisible) {
            throw new InvisibleEventError('O Evento está invisível');
        }

        const user = await userRepo.findOneBy({ id: userId });

        const alreadyExist = await this.repository.findOneBy({
            activity: { id: activityId },
            user: { id: userId },
        });

        if (alreadyExist) {
            throw new RegistredUser();
        }

        await this.checkIfConflictsWithOtherActivity(activity, user);

        const registry = new ActivityRegistry(activity, user);

        return this.create(registry);
    }

    async delete(activityId: number, userId: number): Promise<number> {
        const activity = await this.activityService.findByIdAsAdmin(activityId);

        const isArchived = activity.event.endDate <= new Date();

        if (isArchived) {
            throw new ArchivedEventError(
                'Não é possível remover matriculas de eventos arquivados'
            );
        }

        if (!activity.event.statusVisible) {
            throw new InvisibleEventError(
                'Não é possível remover matricula de um evento que não está visível'
            );
        }

        return new Promise((resolve, reject) => {
            dataSource
                .transaction(async (manager) => {
                    const repo = manager.getRepository(ActivityRegistry);
                    return repo.delete({
                        user: { id: userId },
                        activity: { id: activityId },
                    });
                })
                .then((result) => {
                    resolve(result.affected);
                })
                .catch(reject);
        });
    }

    async filterReadyForCertificate(eventId: number): Promise<string[]> {
        const emails = await this.repository
            .createQueryBuilder('registry')
            .innerJoin('registry.user', 'user')
            .innerJoin('registry.activity', 'activity')
            .innerJoin('activity.event', 'event')
            .where('event.id = :id', { id: eventId })
            .andWhere('registry.readyForCertificate = true')
            .select('user.email')
            .distinct(true)
            .getRawMany();

        return emails.map((e) => e.user_email);
    }

    async setRating(registry: ActivityRegistry, rating: number) {
        await dataSource.createQueryBuilder()
            .update(ActivityRegistry)
            .set({
                rating: rating
            })
            .where('userId = :userId', {
                userId: registry.user.id
            })
            .andWhere('activityId = :activityId', {
                activityId: registry.activity.id
            })
            .execute();
    }
}

container.bind(ActivityRegistryService).toSelf();