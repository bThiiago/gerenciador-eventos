import { injectable } from 'inversify';
import { Connection, Repository } from 'typeorm';

import { container } from '@core/container';
import { dataSource } from '@database/connection';
import { Presence } from '@models/Presence';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { ActivityRegistry } from '@models/ActivityRegistry';
import { ActivityHasPresencesArchived } from '@errors/specialErrors/ActivityHasPresencesArchived';

@injectable()
export class PresenceService {
    private readonly connection: Connection;
    private readonly repository: Repository<Presence>;
    private readonly activityRegistryRepository: Repository<ActivityRegistry>;

    constructor() {
        this.connection = dataSource;
        this.repository = this.connection.getRepository(Presence);
        this.activityRegistryRepository =
            this.connection.getRepository(ActivityRegistry);
    }

    public async findByUserAndSchedule(
        userId: number,
        scheduleId: number
    ): Promise<Presence> {
        const query = this.repository.createQueryBuilder('p');
        query
            .select(['p', 'registry', 'user.id', 'activity.id', 'schedule.id', 'activity.readyForCertificateEmission'])
            .innerJoin('p.schedule', 'schedule')
            .innerJoin('p.activityRegistry', 'registry')
            .innerJoin('registry.activity', 'activity')
            .innerJoin('registry.user', 'user')
            .where('user.id = :userId', { userId })
            .andWhere('schedule.id = :scheduleId', { scheduleId });
        const presence = await query.getOne();

        if (presence) return presence;
        throw new NotFoundError('Presence');
    }

    public async markAsPresent(
        userId: number,
        scheduleId: number
    ): Promise<Presence> {
        const presence = await this.findByUserAndSchedule(userId, scheduleId);

        presence.isPresent = true;
        await this.repository.save(presence);

        const activityRegistry = await this.activityRegistryRepository
            .createQueryBuilder('ar')
            .select(['ar', 'presences'])
            .innerJoin('ar.presences', 'presences')
            .innerJoin('ar.activity', 'activity')
            .innerJoin('ar.user', 'user')
            .where('user.id = :userId', { userId })
            .andWhere('activity.id = :activtyId', {
                activtyId: presence.activityRegistry.activity.id,
            })
            .getOne();

        const isReadyForCertificate = activityRegistry.presences.every(
            (presence) => presence.isPresent
        );
        activityRegistry.readyForCertificate = isReadyForCertificate;

        if (isReadyForCertificate)
            await this.activityRegistryRepository.save(activityRegistry);
        return presence;
    }

    public async markAsNotPresent(
        userId: number,
        scheduleId: number
    ): Promise<Presence> {
        const presence = await this.findByUserAndSchedule(userId, scheduleId);

        presence.isPresent = false;
        await this.repository.save(presence);

        const activityRegistry = await this.activityRegistryRepository
            .createQueryBuilder('ar')
            .select(['ar', 'presences'])
            .innerJoin('ar.presences', 'presences')
            .innerJoin('ar.activity', 'activity')
            .innerJoin('ar.user', 'user')
            .where('user.id = :userId', { userId })
            .andWhere('activity.id = :activtyId', {
                activtyId: presence.activityRegistry.activity.id,
            })
            .getOne();

        if (activityRegistry.readyForCertificate) {
            activityRegistry.readyForCertificate = false;
            await this.activityRegistryRepository.save(activityRegistry);
        }
        return presence;
    }
}

container.bind(PresenceService).toSelf();