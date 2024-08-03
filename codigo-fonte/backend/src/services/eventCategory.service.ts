import { FindOneOptions, Repository, Connection } from 'typeorm';
import { EventCategory } from '../model/EventCategory';
import { injectable } from 'inversify';
import { dataSource } from '@database/connection';
import { container } from '@core/container';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { Event } from '@models/Event';

interface CategoryFindOptions extends ServiceOptions.FindManyOptions {
    category?: string;
    url?: string;
}

@injectable()
export class EventCategoryService {
    private readonly connection: Connection;
    private readonly repository: Repository<EventCategory>;

    constructor() {
        this.connection = dataSource;
        this.repository = dataSource.getRepository(EventCategory);
    }

    public getInstance(entityLikeArray: Partial<EventCategory>): EventCategory {
        const category = this.repository.create(entityLikeArray);
        return category;
    }

    async find(
        options?: CategoryFindOptions
    ): Promise<ServiceOptions.FindManyResult<EventCategory>> {
        const query = this.repository.createQueryBuilder('category');

        const limit = options?.limit > 0 ? options.limit : 10;
        const page = options?.page > 0 ? (options.page - 1) * limit : 0;

        if (options?.category) {
            query.andWhere('category.category LIKE :c', {
                c: '%' + options.category + '%',
            });
        }
        if (options?.url) {
            query.andWhere('category.url_src LIKE :url', {
                url: '%' + options.url + '%',
            });
        }

        const totalCount = await query.getCount();
        query.limit(limit).offset(page);
        const categories = await query.getMany();
        return { items: categories, totalCount };
    }

    findById(id: number, options?: FindOneOptions<EventCategory>): Promise<EventCategory> {
        return new Promise((resolve, reject) => {
            this.repository
                .findOne({ 
                    where: { id }, 
                    ...options
                })
                .then((eventCategory) =>
                    eventCategory
                        ? resolve(eventCategory)
                        : reject(new NotFoundError('Event category'))
                )
                .catch((err) => reject(err));
        });
    }

    findByUrl(url: string, options?: FindOneOptions<EventCategory>): Promise<EventCategory> {
        return new Promise((resolve, reject) => {
            this.repository
                .findOne({
                    where: {
                        url_src: url,
                    },
                    ...options
                })
                .then((eventCategory) =>
                    eventCategory
                        ? resolve(eventCategory)
                        : reject(new NotFoundError('Event category'))
                )
                .catch((err) => reject(err));
        });
    }

    create(eventCategory: EventCategory): Promise<EventCategory> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(EventCategory);
                    return repo.save(eventCategory);
                })
                .then((createdEventCategory) => {
                    resolve(createdEventCategory);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    edit(
        id: number,
        eventCategory: Partial<EventCategory>
    ): Promise<EventCategory> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(EventCategory);
                    const oldEventCategory = await repo.findOneBy({ id });

                    if (oldEventCategory) {
                        const merged = repo.merge(
                            oldEventCategory,
                            eventCategory
                        );
                        return repo.save(merged);
                    }

                    throw new NotFoundError('Event category');
                })
                .then((editedeventCategory) => {
                    resolve(editedeventCategory);
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
                    const repo = manager.getRepository(EventCategory);
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

    isAssociatedToEvent(id: number) : Promise<boolean> {
        return new Promise((resolve) => {
            const query = this.connection.createQueryBuilder(Event, 'event')
                .innerJoin('event.eventCategory', 'category')
                .where('category.id = :categoryId', { categoryId: id });
            query.getCount().then((count) => resolve(count > 0));
        });
    }
}

container.bind(EventCategoryService).toSelf();