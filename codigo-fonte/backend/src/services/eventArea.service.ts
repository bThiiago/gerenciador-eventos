import { FindOneOptions, Repository, Connection } from 'typeorm';
import { EventArea } from '../model/EventArea';
import { injectable } from 'inversify';
import { dataSource } from '@database/connection';
import { container } from '@core/container';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { Event } from '@models/Event';

interface AreaFindOptions extends ServiceOptions.FindManyOptions {
    name?: string;
    sigla?: string;
}

@injectable()
export class EventAreaService {
    private readonly connection: Connection;
    private readonly repository: Repository<EventArea>;

    constructor() {
        this.connection = dataSource;
        this.repository = dataSource.getRepository(EventArea);
    }

    public getInstance(entityLikeArray: Partial<EventArea>): EventArea {
        const name = this.repository.create(entityLikeArray);
        return name;
    }

    async find(
        options?: AreaFindOptions
    ): Promise<ServiceOptions.FindManyResult<EventArea>> {
        const query = this.repository.createQueryBuilder('name');

        const limit = options?.limit > 0 ? options.limit : 10;
        const page = options?.page > 0 ? (options.page - 1) * limit : 0;

        if (options?.name) {
            query.andWhere('name.name LIKE :c', {
                c: '%' + options.name + '%',
            });
        }
        if (options?.sigla) {
            query.andWhere('name.sigla LIKE :sigla', {
                sigla: '%' + options.sigla + '%',
            });
        }

        const totalCount = await query.getCount();
        query.limit(limit).offset(page);
        const areas = await query.getMany();
        return { items: areas, totalCount };
    }

    findById(
        id: number,
        options?: FindOneOptions<EventArea>
    ): Promise<EventArea> {
        return new Promise((resolve, reject) => {
            this.repository
                .findOne({
                    where: { id },
                    ...options,
                })
                .then((EventArea) =>
                    EventArea
                        ? resolve(EventArea)
                        : reject(new NotFoundError('Event name'))
                )
                .catch((err) => reject(err));
        });
    }

    findBySigla(
        sigla: string,
        options?: FindOneOptions<EventArea>
    ): Promise<EventArea> {
        return new Promise((resolve, reject) => {
            this.repository
                .findOne({
                    where: {
                        sigla: sigla,
                    },
                    ...options,
                })
                .then((EventArea) =>
                    EventArea
                        ? resolve(EventArea)
                        : reject(new NotFoundError('Event name'))
                )
                .catch((err) => reject(err));
        });
    }

    create(eventArea: EventArea): Promise<EventArea> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(EventArea);
                    return repo.save(eventArea);
                })
                .then((createdEventArea) => {
                    resolve(createdEventArea);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    edit(id: number, eventArea: Partial<EventArea>): Promise<EventArea> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(EventArea);
                    const oldEventArea = await repo.findOneBy({ id });

                    if (oldEventArea) {
                        const merged = repo.merge(oldEventArea, eventArea);
                        return repo.save(merged);
                    }

                    throw new NotFoundError('Event name');
                })
                .then((editedEventArea) => {
                    resolve(editedEventArea);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    delete(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(EventArea);
                    return repo.delete(id);
                })
                .then((deleteResult) => {
                    resolve(deleteResult.affected);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    isAssociatedToEvent(id: number): Promise<boolean> {
        return new Promise((resolve) => {
            const query = this.connection
                .createQueryBuilder(Event, 'event')
                .innerJoin('event.eventArea', 'name')
                .where('name.id = :nameId', { nameId: id });
            query.getCount().then((count) => resolve(count > 0));
        });
    }
}

container.bind(EventAreaService).toSelf();
