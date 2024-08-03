import { FindOneOptions, Repository, Connection } from 'typeorm';
import { ActivityCategory } from '../model/ActivityCategory';
import { injectable } from 'inversify';
import { dataSource } from '@database/connection';
import { container } from '@core/container';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { Activity } from '@models/Activity';

interface CategoryFindOptions extends ServiceOptions.FindManyOptions {
    code?: string;
    description?: string;
}

@injectable()
export class ActivityCategoryService {
    private readonly connection: Connection;
    private readonly repository: Repository<ActivityCategory>;

    constructor() {
        this.connection = dataSource;
        this.repository = dataSource.getRepository(ActivityCategory);
    }

    public getInstance(entityLikeArray: Partial<ActivityCategory>): ActivityCategory {
        const category = this.repository.create(entityLikeArray);
        return category;
    }

    async find(
        options?: CategoryFindOptions
    ): Promise<ServiceOptions.FindManyResult<ActivityCategory>> {
        const query = this.repository.createQueryBuilder('category');

        const limit = options?.limit > 0 ? options.limit : 10;
        const page = options?.page > 0 ? (options.page - 1) * limit : 0;

        if (options?.code) {
            query.andWhere('category.code LIKE :c', {
                c: '%' + options.code + '%',
            });
        }
        if (options?.description) {
            query.andWhere('category.description LIKE :d', {
                d: '%' + options.description + '%',
            });
        }

        const totalCount = await query.getCount();
        query.limit(limit).offset(page);
        const categories = await query.getMany();
        return { items: categories, totalCount };
    }

    findById(id: number, options?: FindOneOptions<ActivityCategory>): Promise<ActivityCategory> {
        return new Promise((resolve, reject) => {
            this.repository
                .findOne({ 
                    where: { id }, 
                    ...options
                })
                .then((eventCategory) =>
                    eventCategory
                        ? resolve(eventCategory)
                        : reject(new NotFoundError('Activity category'))
                )
                .catch((err) => reject(err));
        });
    }

    create(activityCategory: ActivityCategory): Promise<ActivityCategory> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(ActivityCategory);
                    return repo.save(activityCategory);
                })
                .then((createdActivityCategory) => {
                    resolve(createdActivityCategory);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    edit(
        id: number,
        activityCategory: Partial<ActivityCategory>
    ): Promise<ActivityCategory> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(ActivityCategory);
                    const oldActivityCategory = await repo.findOneBy({ id });

                    if (oldActivityCategory) {
                        const merged = repo.merge(
                            oldActivityCategory,
                            activityCategory
                        );
                        return repo.save(merged);
                    }

                    throw new NotFoundError('Activity category');
                })
                .then((editedActivityCategory) => {
                    resolve(editedActivityCategory);
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
                    const repo = manager.getRepository(ActivityCategory);
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

    isAssociatedToActivity(id: number) : Promise<boolean> {
        return new Promise((resolve) => {
            const query = this.connection.createQueryBuilder(Activity, 'activity')
                .innerJoin('activity.activityCategory', 'category')
                .where('category.id = :categoryId', { categoryId: id });
            query.getCount().then((count) => resolve(count > 0));
        });
    }
}

container.bind(ActivityCategoryService).toSelf();