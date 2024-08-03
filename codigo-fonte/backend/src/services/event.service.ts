import {
    DataSource,
    DeepPartial,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { dataSource } from '../database/connection';
import { EventDeleteRestriction } from '../errors/services/EventDeleteRestriction';

import { Event } from '@models/Event';
import { inject, injectable } from 'inversify';
import { container } from '@core/container';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { ResponsibleUsersUndefined } from '@errors/undefinedErrors/ResponsibleUsersUndefined';
import { UserService } from './user.service';
import { ActivityService } from './activity.service';
import { ConflictingEditionError } from '@errors/specialErrors/ConflictingEditionError';

interface EventFilterOptions {
    startYear?: number;
}

interface EventFindOptions extends ServiceOptions.FindManyOptions {
    name?: string;
    old?: string;
}

@injectable()
export class EventService {
    private readonly connection: DataSource;
    private readonly repository: Repository<Event>;

    @inject(UserService)
    private userService: UserService;

    @inject(ActivityService)
    private activityService: ActivityService;

    constructor() {
        this.connection = dataSource;
        this.repository = dataSource.getRepository(Event);
    }

    private queryForAdmin(query: SelectQueryBuilder<Event>): void {
        query.leftJoinAndSelect('event.eventArea', 'area');
        query.leftJoinAndSelect('event.eventCategory', 'category');
        query.innerJoin('event.responsibleUsers', 'responsibleUsers');
        query.select([
            'event.id',
            'event.edition',
            'event.description',
            'event.startDate',
            'event.endDate',
            'event.statusActive',
            'event.statusVisible',
            'event.registryStartDate',
            'event.registryEndDate',
            'event.display',
            'event.editionDisplay',
            'event.icon',
            'event.banner',

            'responsibleUsers.id',
            'responsibleUsers.name',
            'responsibleUsers.cpf',

            'area',
            'category',
        ]);
    }

    private queryForCommonUser(query: SelectQueryBuilder<Event>): void {
        query.leftJoinAndSelect('event.eventArea', 'area');
        query.leftJoinAndSelect('event.eventCategory', 'category');
        query.select([
            'event.id',
            'event.edition',
            'event.description',
            'event.startDate',
            'event.endDate',
            'event.statusActive',
            'event.registryStartDate',
            'event.registryEndDate',
            'event.display',
            'event.editionDisplay',
            'event.icon',
            'event.banner',
            'area',
            'category',
        ]);
    }

    public async getInstance(
        entityLikeArray: DeepPartial<Event>
    ): Promise<Event> {
        return this.repository.create(entityLikeArray);
    }

    public async isReadyForEmission(id: number): Promise<boolean> {
        const { items } = await this.activityService.findByEventAsAdmin(id, {
            limit: 500,
        });

        return items.every((activity) => activity.readyForCertificateEmission);
    }

    findByIdAsCommonUser(id: number): Promise<Event> {
        return new Promise((resolve, reject) => {
            const query = this.repository.createQueryBuilder('event');

            this.queryForCommonUser(query);

            query.where(
                '(event.statusVisible = true OR event.endDate < NOW())'
            );
            query.andWhere('event.id = :eventId', { eventId: id });

            query.getOne().then((event) => {
                event ? resolve(event) : reject(new NotFoundError('Event'));
            });
        });
    }

    findByIdAsAdmin(id: number): Promise<Event> {
        return new Promise((resolve, reject) => {
            const query = this.repository.createQueryBuilder('event');

            this.queryForAdmin(query);

            query.where('event.id = :eventId', { eventId: id });

            query.getOne().then((event) => {
                event ? resolve(event) : reject(new NotFoundError('Event'));
            });
        });
    }

    async findEventsByCategoryAndIdAsCommonUser(
        url: string,
        eventId: number
    ): Promise<Event> {
        const query = this.repository.createQueryBuilder('event');

        this.queryForCommonUser(query);

        query.where('(event.statusVisible = true OR event.endDate < NOW())');
        query.andWhere('category.url_src = :url', {
            url,
        });
        query.andWhere('event.id = :id', {
            id: eventId,
        });

        const event = await query.getOne();

        if (event) return event;
        throw new NotFoundError('Event');
    }

    async findEventsByCategoryAndIdAsAdmin(
        url: string,
        eventId: number
    ): Promise<Event> {
        const query = this.repository.createQueryBuilder('event');

        this.queryForAdmin(query);

        query.andWhere('category.url_src = :url', {
            url,
        });
        query.andWhere('event.id = :id', {
            id: eventId,
        });

        const event = await query.getOne();

        if (event) return event;
        throw new NotFoundError('Event');
    }

    async findByResponsibleUser(
        userId: number,
        options?: EventFindOptions & EventFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        // ao pesquisar pelo usuário, se não encontrar, dará erro
        await this.userService.findById(userId);

        const query = this.repository.createQueryBuilder('event');

        this.queryForAdmin(query);

        query.where('responsibleUsers.id = :userId', { userId });
        query.andWhere('event.endDate > NOW()');

        //TODO: Teste
        if (options?.startYear) {
            query.andWhere("date_part('year', event.startDate) = :startYear", {
                startYear: options.startYear,
            });
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    async findOldByResponsibleUser(
        userId: number,
        options?: EventFindOptions & EventFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        // ao pesquisar pelo usuário, se não encontrar, dará erro
        await this.userService.findById(userId);

        const query = this.repository.createQueryBuilder('event');

        this.queryForAdmin(query);

        query.where('responsibleUsers.id = :userId', { userId });
        query.andWhere('event.endDate < NOW()');

        //TODO: Teste
        if (options?.startYear) {
            query.andWhere("date_part('year', event.startDate) = :startYear", {
                startYear: options.startYear,
            });
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    public async findEventByRegistry(
        userId: string,
        options?: EventFindOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;
        const old = options?.old;

        const query = this.repository.createQueryBuilder('event');

        this.queryForCommonUser(query);

        query.innerJoin('activity', 'activity', 'event.id = activity.eventId');
        query.leftJoin('activity.activityRegistration', 'registry');
        query.andWhere('registry.userId = :userId', {
            userId: userId,
        });

        if (old) {
            query.andWhere('event.endDate <= NOW()');
        } else {
            query.andWhere('event.statusVisible = true');
            query.andWhere('event.endDate > NOW()');
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    async findAsCommonUser(
        options?: EventFindOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('event');

        this.queryForCommonUser(query);

        query.where('event.statusVisible = true');
        query.andWhere('event.endDate > NOW()');

        query.orderBy('event.startDate', 'ASC');

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    async findAsAdmin(
        options?: EventFindOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('event');

        this.queryForAdmin(query);

        query.where('event.endDate > NOW()');
        query.orderBy('event.startDate', 'ASC');

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    async findOldEventsAsCommonUser(
        options?: EventFindOptions & EventFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('event');

        this.queryForCommonUser(query);
        query.where('event.endDate < NOW()');

        //TODO: TESTES
        if (options?.startYear) {
            query.andWhere("date_part('year', event.startDate) = :startYear", {
                startYear: options.startYear,
            });
        }

        // ordem do evento
        query.orderBy('event.endDate', 'DESC');

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    async findOldEventsAsAdmin(
        options?: EventFindOptions & EventFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('event');

        this.queryForAdmin(query);
        query.where('event.endDate < NOW()');

        //TODO: TESTES
        if (options?.startYear) {
            query.andWhere("date_part('year', event.startDate) = :startYear", {
                startYear: options.startYear,
            });
        }

        // ordem do evento
        query.orderBy('event.endDate', 'DESC');

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    async findOldEventsByCategoryAsCommonUser(
        url: string,
        options?: EventFindOptions & EventFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('event');

        this.queryForCommonUser(query);

        query.where('event.endDate < NOW()');

        query.andWhere('category.url_src = :url', {
            url,
        });

        if (options?.startYear) {
            query.andWhere("date_part('year', event.startDate) = :startYear", {
                startYear: options.startYear,
            });
        }

        query.orderBy('event.endDate', 'DESC');

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    async findOldEventsByCategoryAsAdmin(
        url: string,
        options?: EventFindOptions & EventFilterOptions
    ): Promise<ServiceOptions.FindManyResult<Event>> {
        const limit = options?.limit > 0 ? options.limit : 10;
        const offset = options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('event');

        this.queryForAdmin(query);

        query.where('event.endDate < NOW()');

        query.andWhere('category.url_src = :url', {
            url,
        });

        if (options?.startYear) {
            query.andWhere("date_part('year', event.startDate) = :startYear", {
                startYear: options.startYear,
            });
        }

        query.orderBy('event.endDate', 'DESC');

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const events = await query.getMany();
        return { items: events, totalCount };
    }

    create(event: Event): Promise<Event> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Event);
                    if (event.edition && event.eventCategory?.id) {
                        await manager.query('LOCK event');
                        const count = await repo
                            .createQueryBuilder('event')
                            .select('event.id')
                            .innerJoin('event.eventCategory', 'category')
                            .where('event.edition = :edition', {
                                edition: event.edition,
                            })
                            .andWhere('category.id = :category', {
                                category: event.eventCategory.id,
                            })
                            .getCount();
                        if (count > 0) {
                            throw new ConflictingEditionError();
                        }
                    }

                    if (event.responsibleUsers) {
                        for (const responsible of event.responsibleUsers) {
                            const user = await this.userService.findById(
                                responsible.id
                            );
                        }
                    }

                    return repo.save(event);
                })
                .then(resolve)
                .catch(reject);
        });
    }

    edit(id: number, event: Partial<Event>): Promise<Event> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Event);

                    const oldEvent = await repo.findOne({
                        where: { id },
                        relations: [
                            'responsibleUsers',
                            'eventCategory',
                            'activities',
                        ],
                    });

                    const currentTime = new Date().getTime();

                    if (event.edition || event.eventCategory?.id) {
                        if (!event.edition) event.edition = oldEvent.edition;
                        if (!event.eventCategory?.id)
                            event.eventCategory = oldEvent.eventCategory;
                        await manager.query('LOCK event');
                        const count = await repo
                            .createQueryBuilder('event')
                            .select('event.id')
                            .innerJoin('event.eventCategory', 'category')
                            .where('event.edition = :edition', {
                                edition: event.edition,
                            })
                            .andWhere('category.id = :category', {
                                category: event.eventCategory.id,
                            })
                            .andWhere('event.id != :eventId', { eventId: id })
                            .getCount();
                        if (count > 0) {
                            throw new ConflictingEditionError();
                        }
                    }

                    if (
                        event.responsibleUsers &&
                        event.responsibleUsers.length == 0
                    )
                        throw new ResponsibleUsersUndefined();

                    const merged = repo.merge(oldEvent, event);
                    if (event.responsibleUsers)
                        merged.responsibleUsers = event.responsibleUsers;
                    return repo.save(merged);
                })
                .then(resolve)
                .catch(reject);
        });
    }

    delete(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Event);

                    const event = await repo.findOne({
                        where: { id },
                        relations: ['activities'],
                    });

                    if (event?.statusActive) {
                        throw new EventDeleteRestriction();
                    }

                    if (event?.activities.length > 0) {
                        throw new EventDeleteRestriction(
                            "Event can't be deleted if it has activities"
                        );
                    }

                    return repo.delete(id);
                })
                .then((deleteResult) => {
                    resolve(deleteResult.affected);
                })
                .catch(reject);
        });
    }
}

container.bind(EventService).toSelf();
