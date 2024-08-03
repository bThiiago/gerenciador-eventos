"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("@database/connection");
const typeorm_1 = require("typeorm");
const container_1 = require("@core/container");
const ActivityCategory_1 = require("@models/ActivityCategory");
const Event_1 = require("@models/Event");
const User_1 = require("@models/User");
const Room_1 = require("@models/Room");
const Activity_1 = require("@models/Activity");
const EventCategory_1 = require("@models/EventCategory");
const activityCategory_service_1 = require("@services/activityCategory.service");
const createMockUser_1 = require("test/utils/createMockUser");
const createMockEvent_1 = require("test/utils/createMockEvent");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const createMockActivity_1 = require("test/utils/createMockActivity");
const NotFoundError_1 = require("@errors/specialErrors/NotFoundError");
const InvalidActivityCategoryCode_1 = require("@errors/invalidErrors/InvalidActivityCategoryCode");
let categoryService;
describe('Serviço da categoria da atividade', () => {
    let categoryRepository;
    beforeAll(() => {
        categoryRepository = connection_1.dataSource.getRepository(ActivityCategory_1.ActivityCategory);
        categoryService = container_1.container.get(activityCategory_service_1.ActivityCategoryService);
    });
    describe('Cadastro', () => {
        afterEach(async () => {
            await categoryRepository
                .createQueryBuilder('category')
                .delete()
                .execute();
        });
        test('Deve cadastrar uma categoria de atividade com sucesso', async () => {
            const category = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            const createdCategory = await categoryService.create(category);
            expect(createdCategory.id).toBeDefined();
            const categoryFromDB = await categoryRepository.findOne(createdCategory.id);
            expect(categoryFromDB).toBeDefined();
            expect(createdCategory.id).toBe(categoryFromDB?.id);
        });
        test('Deve falhar em cadastrar uma categoria sem código', async () => {
            const category = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            delete category.code;
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma categoria com o código com mais de 2 caracteres', async () => {
            const category = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            category.code = 'a'.repeat(3);
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma categoria com código inválido (com espaço, símbolos ou números)', async () => {
            const category = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            category.code = 'M ';
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(InvalidActivityCategoryCode_1.InvalidActivityCategoryCode);
            category.code = '@!';
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(InvalidActivityCategoryCode_1.InvalidActivityCategoryCode);
            category.code = '2A';
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(InvalidActivityCategoryCode_1.InvalidActivityCategoryCode);
        });
        test('Deve falhar em cadastrar uma categoria sem descrição', async () => {
            const category = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            delete category.description;
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma categoria com URL com mais de 200 caracteres', async () => {
            const category = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            category.description = 'a'.repeat(201);
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma categoria com o mesmo código', async () => {
            const category1 = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            const category2 = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda 2');
            await categoryService.create(category1);
            await expect(async () => {
                await categoryService.create(category2);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
    });
    describe('Consulta', () => {
        const categories = [];
        beforeAll(async () => {
            categories.push(await categoryRepository.save(new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda')));
            categories.push(await categoryRepository.save(new ActivityCategory_1.ActivityCategory('PL', 'Palestra')));
            categories.push(await categoryRepository.save(new ActivityCategory_1.ActivityCategory('MC', 'Mini-curso')));
        });
        afterAll(async () => {
            await categoryRepository.delete(categories[0].id);
            await categoryRepository.delete(categories[1].id);
            await categoryRepository.delete(categories[2].id);
        });
        describe('Por ID', () => {
            test('Deve consultar os atributos básicos de uma categoria de atividade', async () => {
                const foundCategory = await categoryService.findById(categories[0].id);
                expect(foundCategory).toEqual({
                    id: expect.any(Number),
                    code: expect.any(String),
                    description: expect.any(String),
                });
            });
            test('Deve consultar a categoria 1 com sucesso', async () => {
                const foundCategory = await categoryService.findById(categories[0].id);
                expect(foundCategory).toEqual(categories[0]);
            });
            test('Deve consultar a categoria 2 com sucesso', async () => {
                const foundCategory = await categoryService.findById(categories[1].id);
                expect(foundCategory).toEqual(categories[1]);
            });
            test('Deve consultar a categoria 3 com sucesso', async () => {
                const foundCategory = await categoryService.findById(categories[2].id);
                expect(foundCategory).toEqual(categories[2]);
            });
            test('Deve dar erro ao não encontrar uma categoria inexistente', async () => {
                await expect(async () => {
                    await categoryService.findById(categories[2].id + 3213);
                }).rejects.toThrowError(NotFoundError_1.NotFoundError);
            });
        });
        describe('Multi consulta', () => {
            test('Deve consultar todas as três categorias com sucesso', async () => {
                const findResult = await categoryService.find();
                expect(findResult.items.length).toBe(3);
                expect(findResult.totalCount).toBe(3);
            });
            test('Deve consultar apenas duas categorias por página com sucesso', async () => {
                let findResult = await categoryService.find({
                    page: 1,
                    limit: 2,
                });
                expect(findResult.items.length).toBe(2);
                expect(findResult.totalCount).toBe(3);
                findResult = await categoryService.find({
                    page: 2,
                    limit: 2,
                });
                expect(findResult.items.length).toBe(1);
                expect(findResult.totalCount).toBe(3);
                findResult = await categoryService.find({
                    page: 3,
                    limit: 2,
                });
                expect(findResult.items.length).toBe(0);
                expect(findResult.totalCount).toBe(3);
            });
            test('Deve consultar as categorias por seu código com sucesso', async () => {
                let categoryCode = 'M';
                let findResult = await categoryService.find({
                    code: categoryCode,
                });
                expect(findResult.totalCount).toBe(2);
                expect(findResult.items[0].code.includes(categoryCode)).toBeTruthy();
                expect(findResult.items[1].code.includes(categoryCode)).toBeTruthy();
                categoryCode = 'P';
                findResult = await categoryService.find({
                    code: categoryCode,
                });
                expect(findResult.totalCount).toBe(1);
                expect(findResult.items[0].code.includes(categoryCode)).toBeTruthy();
            });
            test('Deve consultar um total de zero categorias com um código inexistente', async () => {
                const findResult = await categoryService.find({
                    code: 'AB',
                });
                expect(findResult.totalCount).toBe(0);
            });
        });
    });
    describe('Alteração', () => {
        let category1;
        let category2;
        beforeAll(async () => {
            category1 = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
            category2 = new ActivityCategory_1.ActivityCategory('MC', 'Mini curso');
            category1 = await categoryRepository.save(category1);
            category2 = await categoryRepository.save(category2);
        });
        afterAll(async () => {
            await categoryRepository.delete(category1.id);
            await categoryRepository.delete(category2.id);
        });
        test('Não deve falhar ao passar a categoria com os mesmos atributos', async () => {
            await expect(categoryService.edit(category1.id, category1)).resolves.not.toThrow();
        });
        test('Deve alterar o código da categoria com sucesso', async () => {
            const newCode = 'MI';
            const updatedCategory = await categoryService.edit(category1.id, {
                code: newCode,
            });
            const selectedCategory = await categoryRepository.findOne(category1.id);
            expect(updatedCategory.code).toBe(newCode);
            expect(selectedCategory.code).toBe(newCode);
        });
        test('Deve alterar a descrição da categoria com sucesso', async () => {
            const newDescription = 'Minis cursos a';
            const updatedCategory = await categoryService.edit(category1.id, {
                description: newDescription,
            });
            const selectedCategory = await categoryRepository.findOne(category1.id);
            expect(updatedCategory.description).toBe(newDescription);
            expect(selectedCategory.description).toBe(newDescription);
        });
        test('Deve falhar em alterar para uma URL existente', async () => {
            const newCode = category2.code;
            await expect(async () => {
                await categoryService.edit(category1.id, {
                    code: newCode,
                });
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em alterar para uma URL com caracteres especiais ou espaço', async () => {
            let newCode = '2A';
            await expect(async () => {
                await categoryService.edit(category1.id, {
                    code: newCode,
                });
            }).rejects.toThrowError(InvalidActivityCategoryCode_1.InvalidActivityCategoryCode);
            newCode = 'a ';
            await expect(async () => {
                await categoryService.edit(category1.id, {
                    code: newCode,
                });
            }).rejects.toThrowError(InvalidActivityCategoryCode_1.InvalidActivityCategoryCode);
        });
        test('Deve falhar em alterar uma categoria inexistente', async () => {
            const newCode = 'AB';
            await expect(async () => {
                await categoryService.edit(category1.id + 473, {
                    code: newCode,
                });
            }).rejects.toThrowError(NotFoundError_1.NotFoundError);
        });
    });
    describe('Exclusão', () => {
        let categoryId;
        beforeEach(async () => {
            try {
                let category = new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda');
                category = await categoryRepository.save(category);
                categoryId = category.id;
            }
            catch (err) {
                return;
            }
        });
        afterEach(async () => {
            await categoryRepository.delete(categoryId);
        });
        test('Deve excluir a categoria cadastrada com sucesso', async () => {
            const deleteCount = await categoryService.delete(categoryId);
            expect(deleteCount).toBe(1);
        });
        test('Deve retornar zero alterações ao excluir uma categoria inexistente', async () => {
            const deleteCount = await categoryService.delete(categoryId + 432);
            expect(deleteCount).toBe(0);
        });
        test('Deve falhar em excluir uma categoria com uma atividade já associada', async () => {
            const userRepository = connection_1.dataSource.getRepository(User_1.User);
            const eventCategoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
            const eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
            const roomRepository = connection_1.dataSource.getRepository(Room_1.Room);
            const activityRepository = connection_1.dataSource.getRepository(Activity_1.Activity);
            let eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('Alguma ae', 'asd123');
            let user = (0, createMockUser_1.createMockUser)('jefersonCategoriaAtividade@gmail.com', '54662713064', '18372749525');
            let event = (0, createMockEvent_1.createMockEvent)([user], eventCategory);
            let room = new Room_1.Room('alguma sala ae', 232);
            let activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], await categoryRepository.findOne(categoryId));
            eventCategory = await eventCategoryRepository.save(eventCategory);
            user = await userRepository.save(user);
            event = await eventRepository.save(event);
            room = await roomRepository.save(room);
            activity = await activityRepository.save(activity);
            await expect(async () => {
                await categoryService.delete(categoryId);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
            await activityRepository.delete(activity.id);
            await roomRepository.delete(room.id);
            await eventRepository.delete(event.id);
            await eventCategoryRepository.delete(eventCategory.id);
            await userRepository.delete(user.id);
        });
    });
    describe('Verificar FK com atividade', () => {
        const categories = [];
        let eventCategory;
        let user;
        let event;
        let room;
        let activity;
        beforeAll(async () => {
            categories.push(await categoryRepository.save(new ActivityCategory_1.ActivityCategory('MR', 'Mesa redonda')));
            categories.push(await categoryRepository.save(new ActivityCategory_1.ActivityCategory('AR', 'Algo redondo')));
            eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('Alguma ae', 'asd123');
            user = (0, createMockUser_1.createMockUser)('marcovisndabu3b@gmail.com', '08356323002', '4326564362');
            event = (0, createMockEvent_1.createMockEvent)([user], eventCategory);
            room = new Room_1.Room('alguma sala ae', 232);
            activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], categories[1]);
            eventCategory = await connection_1.dataSource
                .getRepository(EventCategory_1.EventCategory)
                .save(eventCategory);
            user = await connection_1.dataSource.getRepository(User_1.User).save(user);
            event = await connection_1.dataSource.getRepository(Event_1.Event).save(event);
            room = await connection_1.dataSource.getRepository(Room_1.Room).save(room);
            activity = await connection_1.dataSource.getRepository(Activity_1.Activity).save(activity);
        });
        afterAll(async () => {
            await connection_1.dataSource.getRepository(Activity_1.Activity).delete(activity.id);
            await connection_1.dataSource.getRepository(Room_1.Room).delete(room.id);
            await connection_1.dataSource.getRepository(Event_1.Event).delete(event.id);
            await connection_1.dataSource.getRepository(EventCategory_1.EventCategory).delete(eventCategory.id);
            await connection_1.dataSource.getRepository(User_1.User).delete(user.id);
            await categoryRepository.delete(categories[0].id);
            await categoryRepository.delete(categories[1].id);
            await connection_1.dataSource.getRepository(User_1.User).delete(user.id);
        });
        test('Espera-se com que a primeira categoria não esteja relacionada com uma atividade', async () => {
            const result = await categoryService.isAssociatedToActivity(categories[0].id);
            expect(result).toBeFalsy();
        });
        test('Espera-se com que a segunda categoria esteja relacionada com uma atividade', async () => {
            const result = await categoryService.isAssociatedToActivity(categories[1].id);
            expect(result).toBeTruthy();
        });
    });
});
//# sourceMappingURL=activityCategory.test.js.map