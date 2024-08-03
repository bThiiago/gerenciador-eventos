import {
    Repository,
    SelectQueryBuilder,
    DeepPartial,
    EntityManager,
    ILike,
    DataSource,
} from 'typeorm';
import { dataSource } from '../database/connection';
import bcrypt from 'bcrypt';

import { User } from '@models/User';
import { injectable } from 'inversify';
import { container } from '@core/container';
import { UserLevel } from '@models/UserLevel';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { Activity } from '@models/Activity';
import { UserCannotBeDeleted } from '@errors/specialErrors/UserCannotBeDeleted';
import { UserCannotBeDisabled } from '@errors/specialErrors/UserCannotBeDisabled';
import { UserCannotBeReenabled } from '@errors/specialErrors/UserCannotBeReenabled';

interface UserFindOptions extends ServiceOptions.FindManyOptions {
    name?: string;
    cpf?: string;
}

@injectable()
export class UserService {
    private readonly connection: DataSource;
    private readonly repository: Repository<User>;

    constructor() {
        this.connection = dataSource;
        this.repository = this.connection.getRepository(User);
    }

    private queryForAdmin(query: SelectQueryBuilder<User>): void {
        query.select([
            'user.id',
            'user.name',
            'user.cpf',
            'user.email',
            'user.cellphone',
            'user.birthDate',
            'user.cep',
            'user.city',
            'user.uf',
            'user.address',
            'user.active',
        ]);
        query.andWhere('user.level != :level', { level: UserLevel.ADMIN });
        query.addOrderBy('user.name', 'ASC');
        query.addOrderBy('user.cpf', 'ASC');
    }

    private queryForResponsible(query: SelectQueryBuilder<User>): void {
        query.select(['user.id', 'user.name', 'user.cpf']);
        query.andWhere('user.level != :level', { level: UserLevel.ADMIN });
        query.addOrderBy('user.name', 'ASC');
        query.addOrderBy('user.cpf', 'ASC');
    }

    public getInstance(entityLikeArray: DeepPartial<User>): User {
        const user = this.repository.create(entityLikeArray);
        return user;
    }

    public async findAsResponsible(
        options?: UserFindOptions
    ): Promise<ServiceOptions.FindManyResult<User>> {
        const limit = options?.limit && options?.limit > 0 ? options.limit : 10;
        const offset =
            options?.page && options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('user');

        this.queryForResponsible(query);
        query.andWhere('user.active = true');

        if (options?.name) {
            const name = '%' + options.name + '%';
            query.andWhere('user.name LIKE :name', { name });
        }

        if (options?.cpf) {
            const cpf = '%' + options.cpf + '%';
            query.andWhere('user.cpf LIKE :cpf', { cpf });
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const users = await query.getMany();
        return { items: users, totalCount };
    }

    public async findAsAdmin(
        options?: UserFindOptions
    ): Promise<ServiceOptions.FindManyResult<User>> {
        const limit = options?.limit && options?.limit > 0 ? options.limit : 10;
        const offset =
            options?.page && options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('user');

        this.queryForAdmin(query);

        if (options?.name) {
            const name = '%' + options.name + '%';
            query.andWhere('user.name LIKE :name', { name });
        }

        if (options?.cpf) {
            const cpf = '%' + options.cpf + '%';
            query.andWhere('user.cpf LIKE :cpf', { cpf });
        }

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const users = await query.getMany();
        return { items: users, totalCount };
    }

    public async findById(id: number): Promise<User> {
        const query = this.repository.createQueryBuilder('user');

        this.queryForAdmin(query);

        query.where('user.id = :id', { id });
        query.andWhere('user.active = true');

        const user = await query.getOne();

        if (user) return user;
        throw new NotFoundError('User');
    }

    public async create(user: User): Promise<User> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(User);
                    user.level = UserLevel.DEFAULT;
                    user.active = true;

                    return repo.save(user);
                })
                .then((user) => {
                    delete user.password;
                    delete user.active;
                    resolve(user);
                })
                .catch(reject);
        });
    }

    public async edit(id: number, user: Partial<User>): Promise<User> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(User);
                    const oldUser = await repo.findOneBy({ id });
                    user.active = true;

                    if (oldUser) {
                        user.level = oldUser.level;

                        const merged = repo.merge(oldUser, user);
                        return repo.save(merged);
                    }
                    reject(new NotFoundError('User'));
                })
                .then(resolve)
                .catch(reject);
        });
    }

    delete(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(User);
                    const user = await repo
                        .createQueryBuilder('user')
                        .leftJoin('user.eventsResponsibility', 'events')
                        .leftJoin('user.activitiesResponsibility', 'activities')
                        .leftJoin('activities.event', 'act_event')
                        .select(['user.id'])
                        .where('user.id = :userId', { userId: id })
                        .andWhere(
                            '(events.endDate > NOW() OR act_event.endDate > NOW())'
                        )
                        .andWhere('active = true')
                        .getOne();

                    if (user) throw new UserCannotBeDeleted();
                    return repo.delete(id);
                })
                .then((deleteResult) => {
                    resolve(deleteResult.affected);
                })
                .catch(reject);
        });
    }

    public async disable(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(User);
                    const user = await repo
                        .createQueryBuilder('user')
                        .leftJoin('user.eventsResponsibility', 'events')
                        .leftJoin('user.activitiesResponsibility', 'activities')
                        .leftJoin('activities.event', 'act_event')
                        .select(['user.id'])
                        .where('user.id = :userId', { userId: id })
                        .andWhere(
                            '(events.endDate > NOW() OR act_event.endDate > NOW())'
                        )
                        .andWhere('active = true')
                        .getOne();

                    if (user) throw new UserCannotBeDisabled();
                    return repo.update(id, {
                        active: false,
                    });
                })
                .then((update) => resolve(update.affected))
                .catch(reject);
        });
    }

    public async reenable(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(User);
                    const user = await repo
                        .createQueryBuilder('user')
                        .select(['user.id'])
                        .where('user.id = :userId', { userId: id })
                        .andWhere('active = false')
                        .getOne();

                    if (!user) throw new UserCannotBeReenabled();
                    return repo.update(id, {
                        active: true,
                    });
                })
                .then((update) => resolve(update.affected))
                .catch(reject);
        });
    }

    public async login(
        email: string,
        password: string
    ): Promise<Partial<User> | undefined> {
        return new Promise((resolve, reject) => {
            this.repository
                .findOne({
                    where: {
                        email: ILike(email),
                    },
                    select: [
                        'id',
                        'email',
                        'name',
                        'level',
                        'password',
                        'active',
                    ],
                })
                .then((user) => {
                    if (!user) {
                        return resolve(undefined);
                    }

                    bcrypt
                        .compare(password, user.password)
                        .then((res) => {
                            if (!res) {
                                return resolve(undefined);
                            }

                            const partialUser: Partial<User> = {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                level: user.level,
                                active: user.active,
                            };

                            return resolve(partialUser);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    public async loginCpf(
        cpf: string,
        password: string
    ): Promise<Partial<User> | undefined> {
        return new Promise((resolve, reject) => {
            this.repository
                .findOne({
                    where: {
                        cpf,
                    },
                    select: [
                        'id',
                        'email',
                        'name',
                        'level',
                        'password',
                        'active',
                    ],
                })
                .then((user) => {
                    if (!user) {
                        return resolve(undefined);
                    }

                    bcrypt
                        .compare(password, user.password)
                        .then((res) => {
                            if (!res) {
                                return resolve(undefined);
                            }

                            const partialUser: Partial<User> = {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                level: user.level,
                                active: user.active,
                            };

                            return resolve(partialUser);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    public async isEventOrganizer(
        id: number,
        eventId?: number
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(User);
                    const query = repo
                        .createQueryBuilder('u')
                        .where('u.id = :userId', { userId: id });
                    if (eventId)
                        query.leftJoinAndSelect(
                            'u.eventsResponsibility',
                            'events',
                            'events.id = :eventId',
                            { eventId }
                        );
                    else
                        query.leftJoinAndSelect(
                            'u.eventsResponsibility',
                            'events'
                        );
                    query.andWhere('active = true');
                    return query.getOne();
                })
                .then((user) => {
                    if (user) {
                        if (user.eventsResponsibility.length > 0) resolve(true);
                        else resolve(false);
                    } else {
                        reject(new NotFoundError('User'));
                    }
                });
        });
    }

    public async isActivityResponsible(id: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(User);
                    const query = repo
                        .createQueryBuilder('u')
                        .leftJoinAndSelect(
                            'u.activitiesResponsibility',
                            'activities'
                        )
                        .where('u.id = :userId', { userId: id })
                        .andWhere('active = true');
                    return query.getOne();
                })
                .then((user) => {
                    if (user) {
                        if (user.activitiesResponsibility.length > 0)
                            resolve(true);
                        else resolve(false);
                    } else {
                        reject(new NotFoundError('User'));
                    }
                });
        });
    }

    public async usersFromActivity(
        activityId: number,
        options?: ServiceOptions.FindManyOptions
    ): Promise<ServiceOptions.FindManyResult<Partial<User>>> {
        const hasActivity = await this.connection.getRepository(Activity)
            .findOneBy({ id: activityId });

        if (!hasActivity)
            throw new NotFoundError('Activity');

        const limit = options?.limit && options?.limit > 0 ? options.limit : 10;
        const offset =
            options?.page && options?.page > 0 ? (options.page - 1) * limit : 0;

        const query = this.repository.createQueryBuilder('user');

        this.queryForResponsible(query);

        query.innerJoin('user.activityRegistration', 'registry')
            .andWhere('registry.activityId = :activityId', { activityId })
            .andWhere('active = true');

        const totalCount = await query.getCount();
        query.take(limit).skip(offset);
        const users = await query.getMany();
        return { items: users, totalCount };
    }

    async findParticipatingUsersInfoById(
        eventId: number
    ): Promise<User[]> {
        const query = this.repository.createQueryBuilder('user')
            .innerJoin('user.activityRegistration', 'registries')
            .leftJoin('registries.activity', 'activity')
            .leftJoin('registries.presences', 'presences')
            .leftJoin('presences.schedule', 'schedule')
            .innerJoin('activity.event', 'event')
            .innerJoin('activity.activityCategory', 'activityCategory')
            .leftJoin('user.managingActivities', 'managingActivities', 'managingActivities.event.id = :eventId', { eventId })
            .select([
                'user.name',
                'user.cpf',

                'managingActivities.title',
                'managingActivities.workloadInMinutes',

                'activity.title',
                'activity.workloadInMinutes',
                'activity.indexInCategory',

                'registries.activity',
                'registries.registryDate',
                'registries.readyForCertificate',

                'activityCategory.code',

                'presences.schedule',
                'presences.isPresent',
                'schedule.startDate',
                'schedule.durationInMinutes',
            ])
            .where('event.id = :eventId', { eventId })
            .andWhere('presences.isPresent = true')
            .orderBy('user.name', 'ASC')
            .addOrderBy('activityCategory.code', 'ASC')
            .addOrderBy('activity.indexInCategory', 'ASC');

        return await query.getMany();
    }

    public async findUsersArray(
        userArray: number[],
        manager?: EntityManager
    ): Promise<User[]> {
        const query = manager
            ? manager.getRepository(User).createQueryBuilder('user')
            : this.repository.createQueryBuilder('user');

        this.queryForResponsible(query);

        return query
            .whereInIds(userArray)
            .andWhere('active = true')
            .getMany();
    }

    public async findUserByEmail(email: string): Promise<User> {
        const query = this.repository.createQueryBuilder('user');

        this.queryForAdmin(query);

        query
            .where('email = :email', { email })
            .andWhere('active = true');

        const user = await query.getOne();

        if (!user) throw new NotFoundError('user');

        return user;
    }
}

container.bind(UserService).toSelf();