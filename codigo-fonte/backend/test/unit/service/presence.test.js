"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("@database/connection");
const container_1 = require("@core/container");
const Activity_1 = require("@models/Activity");
const Room_1 = require("@models/Room");
const User_1 = require("@models/User");
const EventCategory_1 = require("@models/EventCategory");
const Event_1 = require("@models/Event");
const ActivityCategory_1 = require("@models/ActivityCategory");
const activity_registry_service_1 = require("@services/activity_registry.service");
const createMockActivity_1 = require("test/utils/createMockActivity");
const createMockUser_1 = require("test/utils/createMockUser");
const createMockEvent_1 = require("test/utils/createMockEvent");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const ActivityRegistry_1 = require("@models/ActivityRegistry");
const presence_service_1 = require("@services/presence.service");
const ActivityHasPresencesArchived_1 = require("@errors/specialErrors/ActivityHasPresencesArchived");
describe('Serviço da presença', () => {
    let activityRepository;
    let activityCategoryRepository;
    let categoryRepository;
    let eventRepository;
    let userRepository;
    let roomRepository;
    let activityRegistryRepository;
    let presenceService;
    let activityRegistryService;
    let user;
    let category;
    let event;
    let room;
    let activity;
    let activityCategory;
    beforeAll(async () => {
        activityRepository = connection_1.dataSource.getRepository(Activity_1.Activity);
        categoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
        eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        roomRepository = connection_1.dataSource.getRepository(Room_1.Room);
        activityRegistryRepository = connection_1.dataSource.getRepository(ActivityRegistry_1.ActivityRegistry);
        activityCategoryRepository = connection_1.dataSource.getRepository(ActivityCategory_1.ActivityCategory);
        user = (0, createMockUser_1.createMockUser)('carlos123@testatividade.com', '29731779019', '182254369493');
        category = (0, createMockEventCategory_1.createMockEventCategory)('Categoria Teste Atividade Controller', 'ctac332');
        event = (0, createMockEvent_1.createMockEvent)([user], category);
        room = new Room_1.Room('TEST-ACTIVITY 203', 30);
        activityCategory = new ActivityCategory_1.ActivityCategory('MX', 'andasjncjasn');
        activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
        await userRepository.save(user);
        await categoryRepository.save(category);
        await eventRepository.save(event);
        event.statusVisible = true;
        await eventRepository.save(event);
        await roomRepository.save(room);
        await activityCategoryRepository.save(activityCategory);
        await activityRepository.save(activity);
        presenceService = container_1.container.get(presence_service_1.PresenceService);
        activityRegistryService = container_1.container.get(activity_registry_service_1.ActivityRegistryService);
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
        let registeredUser;
        let activityRegistry;
        let userId;
        beforeAll(async () => {
            registeredUser = (0, createMockUser_1.createMockUser)('userWithRegistry111@testpresenca.com', '72981420380', '16546456788');
            await userRepository.save(registeredUser);
            activityRegistry = await activityRegistryService.registry(activity.id, registeredUser.id);
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
            let presence = await presenceService.markAsNotPresent(userId, activityRegistry.presences[0].schedule.id);
            let updatedRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .select(['ar'])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();
            expect(presence.isPresent).toBeFalsy();
            expect(updatedRegistry.readyForCertificate).toBeFalsy();
            presence = await presenceService.markAsPresent(userId, activityRegistry.presences[0].schedule.id);
            updatedRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .select(['ar'])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();
            expect(presence.isPresent).toBeTruthy();
            expect(updatedRegistry.readyForCertificate).toBeTruthy();
        });
        test('Deve desmarcar e marcar a presença 2', async () => {
            let presence = await presenceService.markAsNotPresent(userId, activityRegistry.presences[1].schedule.id);
            expect(presence.isPresent).toBeFalsy();
            presence = await presenceService.markAsPresent(userId, activityRegistry.presences[1].schedule.id);
            expect(presence.isPresent).toBeTruthy();
        });
        test('Deve desmarcar e marcar a presença 3', async () => {
            let presence = await presenceService.markAsNotPresent(userId, activityRegistry.presences[2].schedule.id);
            expect(presence.isPresent).toBeFalsy();
            presence = await presenceService.markAsPresent(userId, activityRegistry.presences[2].schedule.id);
            expect(presence.isPresent).toBeTruthy();
        });
        test('Não deve marcar ou desmarcar presença se a atividade já teve suas presenças emitidas', async () => {
            activity.readyForCertificateEmission = true;
            await activityRepository.save(activity);
            await expect(async () => {
                await presenceService.markAsNotPresent(userId, activityRegistry.presences[2].schedule.id);
            }).rejects.toThrowError(ActivityHasPresencesArchived_1.ActivityHasPresencesArchived);
            await expect(async () => {
                await presenceService.markAsPresent(userId, activityRegistry.presences[2].schedule.id);
            }).rejects.toThrowError(ActivityHasPresencesArchived_1.ActivityHasPresencesArchived);
        });
        test('Não deve tornar a matrícula pronta se ainda ter presenças faltando', async () => {
            let presence1 = await presenceService.markAsNotPresent(userId, activityRegistry.presences[0].schedule.id);
            const presence2 = await presenceService.markAsNotPresent(userId, activityRegistry.presences[1].schedule.id);
            let updatedRegistry = await activityRegistryRepository
                .createQueryBuilder('ar')
                .select(['ar'])
                .where('ar.id = :id', { id: activityRegistry.id })
                .getOne();
            expect(presence1.isPresent).toBeFalsy();
            expect(presence2.isPresent).toBeFalsy();
            expect(updatedRegistry.readyForCertificate).toBeFalsy();
            presence1 = await presenceService.markAsPresent(userId, activityRegistry.presences[0].schedule.id);
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
//# sourceMappingURL=presence.test.js.map