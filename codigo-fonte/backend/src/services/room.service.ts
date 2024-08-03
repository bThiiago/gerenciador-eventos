import { container } from '@core/container';
import { injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { dataSource } from '../database/connection';
import { NotFoundError } from '../errors/specialErrors/NotFoundError';
import { Room } from '../model/Room';

interface RoomFindOptions extends ServiceOptions.FindManyOptions {
    code?: string;
    capacity?: number;
    description?: string;
}

@injectable()
export class RoomService {
    private connection: DataSource;
    private repository: Repository<Room>;

    constructor() {
        this.connection = dataSource;
        this.repository = this.connection.getRepository(Room);
    }

    public getInstance(entityLikeArray: Partial<Room>): Room {
        const room = this.repository.create(entityLikeArray);
        return room;
    }

    async find(
        options?: RoomFindOptions
    ): Promise<ServiceOptions.FindManyResult<Room>> {
        const query = this.repository.createQueryBuilder('room');

        const limit = options?.limit && options?.limit > 0 ? options.limit : 10;
        const offset =
            options?.page && options?.page > 0 ? (options.page - 1) * limit : 0;

        if (options?.code) {
            const code = '%' + options.code + '%';
            query.where('room.code LIKE :code', { code });
        }

        query.orderBy('room.code', 'ASC');

        const totalCount = await query.getCount();

        query.offset(offset).limit(limit);

        const rooms = await query.getMany();

        return { items: rooms, totalCount };
    }

    findById(id: number): Promise<Room> {
        return new Promise((resolve, reject) => {
            const query = this.repository
                .createQueryBuilder('room')
                .where('room.id = :roomId', { roomId: id });
            query.getOne().then((room) => {
                if (room) resolve(room);
                else reject(new NotFoundError('Room'));
            });
        });
    }

    create(room: Room): Promise<Room> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Room);
                    return repo.save(room);
                })
                .then(resolve)
                .catch(reject);
        });
    }

    edit(id: number, updatedRoom: Partial<Room>): Promise<Room> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Room);
                    const oldRoom = await repo.findOneBy({ id });
                    if (oldRoom) {
                        const merged = repo.merge(oldRoom, updatedRoom);
                        return repo.save(merged);
                    }
                    throw new NotFoundError('Room');
                })
                .then(resolve)
                .catch(reject);
        });
    }

    delete(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.connection
                .transaction(async (manager) => {
                    const repo = manager.getRepository(Room);
                    return repo.delete(id);
                })
                .then((deleteResult) => {
                    resolve(deleteResult.affected);
                })
                .catch(reject);
        });
    }

    isAssociatedToActivity(id: number): Promise<boolean> {
        return new Promise((resolve) => {
            const query = this.repository
                .createQueryBuilder('room')
                .innerJoin('room.schedules', 'sch', 'sch.roomId = room.id')
                .where('room.id = :roomId', { roomId: id });
            query.getCount().then((count) => resolve(count > 0));
        });
    }
}

container.bind(RoomService).toSelf();