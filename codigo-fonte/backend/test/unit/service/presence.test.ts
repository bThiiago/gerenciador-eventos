import { dataSource } from '@database/connection';
import { Repository } from 'typeorm';
import { container } from '@core/container';

import { Activity } from '@models/Activity';
import { Room } from '@models/Room';
import { User } from '@models/User';
import { EventCategory } from '@models/EventCategory';
import { Event } from '@models/Event';
import { ActivityCategory } from '@models/ActivityCategory';

import { ActivityRegistryService } from '@services/activity_registry.service';

import { createMockActivity } from 'test/utils/createMockActivity';
import { createMockUser } from 'test/utils/createMockUser';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';

import { ActivityRegistry } from '@models/ActivityRegistry';
import { PresenceService } from '@services/presence.service';
import { ActivityHasPresencesArchived } from '@errors/specialErrors/ActivityHasPresencesArchived';

describe('Serviço da presença', () => {
    let activityRepository: Repository<Activity>;
    let activityCategoryRepository: Repository<ActivityCategory>;
    let categoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let userRepository: Repository<User>;
    let roomRepository: Repository<Room>;
    let activityRegistryRepository: Repository<ActivityRegistry>;

    let presenceService: PresenceService;
    let activityRegistryService: ActivityRegistryService;

    let user: User;
    let category: EventCategory;
    let event: Event;
    let room: Room;
    let activity: Activity;
    let activityCategory: ActivityCategory;

    beforeAll(async () => {
        activityRepository = dataSource.getRepository(Activity);
        categoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        userRepository = dataSource.getRepository(User);
        roomRepository = dataSource.getRepository(Room);
        activityRegistryRepository = dataSource.getRepository(ActivityRegistry);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);

        user = createMockUser(
            'carlos123@testatividade.com',
            '29731779019',
            '182254369493'
        );
        category = createMockEventCategory(
            'Categoria Teste Atividade Controller',
            'ctac332'
        );
        event = createMockEvent([user], category);
        room = new Room('TEST-ACTIVITY 203', 30);
        activityCategory = new ActivityCategory('MX', 'andasjncjasn');
        activity = createMockActivity(event, room, [user], activityCategory);

        await userRepository.save(user);
        await categoryRepository.save(category);
        await eventRepository.save(event);
        event.statusVisible = true;
        await eventRepository.save(event);
        await roomRepository.save(room);
        await activityCategoryRepository.save(activityCategory);
        await activityRepository.save(activity);

        presenceService = container.get(PresenceService);
        activityRegistryService = container.get(ActivityRegistryService);
    });

    afterAll(async () => {
        await activityRepository.delete(activity.id);
        await activityCategoryRepository.delete(activityCategory.id);
        await roomRepository.delete(room.id);
        await eventRepository.delete(event.id);
        await categoryRepository.delete(category.id);
        await userRepository.delete(user.id);
    });

    describe('Marcar e desmarcar presenças', () => {
        let registeredUser: User;
        let activityRegistry: ActivityRegistry;

        let userId: number;

        beforeAll(async () => {
            registeredUser = createMockUser(
                'userWithRegistry111@testpresenca.com',
                '72981420380',
                '16546456788'
            );
            await userRepository.save(registeredUser);
            activityRegistry = await activityRegistryService.registry(
                activity.id,
                registeredUser.id
            );
            activityRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .leftJoin('ar.activity', 'activity')
                .leftJoin('ar.user', 'user')
                .leftJoin('ar.presences', 'presences')
                .leftJoin('presences.schedule', 'schedule')
                .select([
                    'ar',
                    'presences',
                    'user.id',
                    'activity.id',
                    'schedule',
                ])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();
            userId = activityRegistry.user.id;
        });

        afterAll(async () => {
            await activityRegistryRepository.delete(activityRegistry.id);
            await userRepository.delete(registeredUser.id);
        });

        beforeEach(async () => {
            activity.readyForCertificateEmission = false;
            await activityRepository.save(activity);
        });

        test('Deve desmarcar e marcar a presença 1, alterando corretamente a matrícula', async () => {
            let presence = await presenceService.markAsNotPresent(
                userId,
                activityRegistry.presences[0].schedule.id
            );

            let updatedRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .select(['ar'])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();

            expect(presence.isPresent).toBeFalsy();
            expect(updatedRegistry.readyForCertificate).toBeFalsy();

            presence = await presenceService.markAsPresent(
                userId,
                activityRegistry.presences[0].schedule.id
            );

            updatedRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .select(['ar'])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();

            expect(presence.isPresent).toBeTruthy();
            expect(updatedRegistry.readyForCertificate).toBeTruthy();
        });

        test('Deve desmarcar e marcar a presença 2', async () => {
            let presence = await presenceService.markAsNotPresent(
                userId,
                activityRegistry.presences[1].schedule.id
            );
            expect(presence.isPresent).toBeFalsy();

            presence = await presenceService.markAsPresent(
                userId,
                activityRegistry.presences[1].schedule.id
            );
            expect(presence.isPresent).toBeTruthy();
        });

        test('Deve desmarcar e marcar a presença 3', async () => {
            let presence = await presenceService.markAsNotPresent(
                userId,
                activityRegistry.presences[2].schedule.id
            );
            expect(presence.isPresent).toBeFalsy();

            presence = await presenceService.markAsPresent(
                userId,
                activityRegistry.presences[2].schedule.id
            );
            expect(presence.isPresent).toBeTruthy();
        });

        test('Não deve marcar ou desmarcar presença se a atividade já teve suas presenças emitidas', async () => {
            activity.readyForCertificateEmission = true;
            await activityRepository.save(activity);

            await expect(async () => {
                await presenceService.markAsNotPresent(
                    userId,
                    activityRegistry.presences[2].schedule.id
                );
            }).rejects.toThrowError(ActivityHasPresencesArchived);

            await expect(async () => {
                await presenceService.markAsPresent(
                    userId,
                    activityRegistry.presences[2].schedule.id
                );
            }).rejects.toThrowError(ActivityHasPresencesArchived);
        });

        test('Não deve tornar a matrícula pronta se ainda ter presenças faltando', async () => {
            let presence1 = await presenceService.markAsNotPresent(
                userId,
                activityRegistry.presences[0].schedule.id
            );
            const presence2 = await presenceService.markAsNotPresent(
                userId,
                activityRegistry.presences[1].schedule.id
            );

            let updatedRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .select(['ar'])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();

            expect(presence1.isPresent).toBeFalsy();
            expect(presence2.isPresent).toBeFalsy();
            expect(updatedRegistry.readyForCertificate).toBeFalsy();

            presence1 = await presenceService.markAsPresent(
                userId,
                activityRegistry.presences[0].schedule.id
            );

            updatedRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .select(['ar'])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();

            expect(presence1.isPresent).toBeTruthy();
            expect(updatedRegistry.readyForCertificate).toBeFalsy();
        });
    });
});