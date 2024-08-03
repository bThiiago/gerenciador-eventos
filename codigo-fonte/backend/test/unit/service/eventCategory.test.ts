import { dataSource } from '@database/connection';
import { QueryFailedError, Repository } from 'typeorm';
import { container } from '@core/container';

import { EventCategory } from '@models/EventCategory';
import { Event } from '@models/Event';
import { User } from '@models/User';

import { EventCategoryService } from '@services/eventCategory.service';

import { createMockUser } from 'test/utils/createMockUser';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';

import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { InvalidUrlSrc } from '@errors/invalidErrors/InvalidUrlSrc';

let categoryService: EventCategoryService;

describe('Serviço da categoria do evento', () => {
    let categoryRepository: Repository<EventCategory>;

    beforeAll(() => {
        categoryRepository = dataSource.getRepository(EventCategory);
        categoryService = container.get(EventCategoryService);
    });

    describe('Cadastro', () => {
        afterEach(async () => {
            await categoryRepository.createQueryBuilder('category').delete().execute();
        });

        test('Deve cadastrar uma categoria de evento com sucesso', async () => {
            const category = createMockEventCategory(
                'Categoria exemplo serviço',
                'ces3241'
            );
            const createdCategory = await categoryService.create(category);
            expect(createdCategory.id).toBeDefined();

            const categoryFromDB = await categoryRepository.findOne(
                createdCategory.id
            );
            expect(categoryFromDB).toBeDefined();
            expect(createdCategory.id).toBe(categoryFromDB?.id);
        });

        test('Deve falhar em cadastrar uma categoria sem categoria', async () => {
            const category = createMockEventCategory(
                'Categoria exemplo serviço',
                'ces3241'
            );
            delete category.category;
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma categoria com categoria com mais de 80 caracteres', async () => {
            const category = createMockEventCategory(
                'Categoria exemplo serviço',
                'ces3241'
            );
            category.category = 'a'.repeat(81);
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma categoria com URL inválida (com espaço ou símbolos especiais)', async () => {
            const category = createMockEventCategory(
                'Categoria exemplo serviço',
                'ces 3241'
            );
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(InvalidUrlSrc);

            category.url_src = 'ces@473728';
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(InvalidUrlSrc);
        });

        test('Deve falhar em cadastrar uma categoria sem URL', async () => {
            const category = createMockEventCategory(
                'Categoria exemplo serviço',
                'ces3241'
            );
            delete category.url_src;
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma categoria com URL com mais de 20 caracteres', async () => {
            const category = createMockEventCategory(
                'Categoria exemplo serviço',
                'ces3241'
            );
            category.url_src = 'a'.repeat(21);
            await expect(async () => {
                await categoryService.create(category);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma categoria com a mesma url', async () => {
            const category1 = createMockEventCategory(
                'Categoria exemplo serviço 1',
                'ces3241'
            );
            const category2 = createMockEventCategory(
                'Categoria exemplo serviço 2',
                'ces3241'
            );

            const createdCategory = await categoryService.create(category1);

            await expect(async () => {
                await categoryService.create(category2);
            }).rejects.toThrowError(QueryFailedError);

            await categoryRepository.delete(createdCategory.id);
        });
    });

    describe('Consulta', () => {
        const categories: EventCategory[] = [];
        beforeAll(async () => {
            categories.push(
                await categoryRepository.save(
                    createMockEventCategory(
                        'Categoria exemplo serviço - Teste 1',
                        'cesteste1'
                    )
                )
            );
            categories.push(
                await categoryRepository.save(
                    createMockEventCategory(
                        'Categoria exemplo serviço - Teste Legal 2',
                        'cestestelegal2'
                    )
                )
            );
            categories.push(
                await categoryRepository.save(
                    createMockEventCategory(
                        'Categoria exemplo serviço - Exemplo Legal 3',
                        'cesexemplolegal2'
                    )
                )
            );
        });

        afterAll(async () => {
            await categoryRepository.delete(categories[0].id);
            await categoryRepository.delete(categories[1].id);
            await categoryRepository.delete(categories[2].id);
        });

        describe('Por ID', () => {
            test('Deve consultar os atributos básicos de uma categoria', async () => {
                const foundCategory = await categoryService.findById(
                    categories[0].id
                );

                expect(foundCategory).toEqual({
                    id: expect.any(Number),
                    category: expect.any(String),
                    url_src: expect.any(String),
                });
            });

            test('Deve consultar a categoria 1 com sucesso', async () => {
                const foundCategory = await categoryService.findById(
                    categories[0].id
                );

                expect(foundCategory).toEqual(categories[0]);
            });

            test('Deve consultar a categoria 2 com sucesso', async () => {
                const foundCategory = await categoryService.findById(
                    categories[1].id
                );

                expect(foundCategory).toEqual(categories[1]);
            });

            test('Deve consultar a categoria 3 com sucesso', async () => {
                const foundCategory = await categoryService.findById(
                    categories[2].id
                );

                expect(foundCategory).toEqual(categories[2]);
            });

            test('Deve dar erro ao não encontrar uma categoria inexistente', async () => {
                await expect(async () => {
                    await categoryService.findById(-40);
                }).rejects.toThrowError(NotFoundError);
            });
        });

        describe('Por URL', () => {
            test('Deve consultar os atributos básicos de uma categoria', async () => {
                const foundCategory = await categoryService.findByUrl(
                    categories[0].url_src
                );

                expect(foundCategory).toEqual({
                    id: expect.any(Number),
                    category: expect.any(String),
                    url_src: expect.any(String),
                });
            });

            test('Deve consultar a categoria 1 com sucesso', async () => {
                const foundCategory = await categoryService.findByUrl(
                    categories[0].url_src
                );

                expect(foundCategory).toEqual(categories[0]);
            });

            test('Deve consultar a categoria 2 com sucesso', async () => {
                const foundCategory = await categoryService.findByUrl(
                    categories[1].url_src
                );

                expect(foundCategory).toEqual(categories[1]);
            });

            test('Deve consultar a categoria 3 com sucesso', async () => {
                const foundCategory = await categoryService.findByUrl(
                    categories[2].url_src
                );

                expect(foundCategory).toEqual(categories[2]);
            });

            test('Deve dar erro ao não encontrar uma categoria inexistente', async () => {
                await expect(async () => {
                    await categoryService.findByUrl('asdasd');
                }).rejects.toThrowError(NotFoundError);
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

            test('Deve consultar as categorias por sua categoria com sucesso', async () => {
                let categoryName = 'Legal';
                let findResult = await categoryService.find({
                    category: categoryName,
                });

                expect(findResult.totalCount).toBe(2);
                expect(
                    findResult.items[0].category.includes(categoryName)
                ).toBeTruthy();
                expect(
                    findResult.items[1].category.includes(categoryName)
                ).toBeTruthy();

                categoryName = 'Teste';
                findResult = await categoryService.find({
                    category: categoryName,
                });

                expect(findResult.totalCount).toBe(2);
                expect(
                    findResult.items[0].category.includes(categoryName)
                ).toBeTruthy();
                expect(
                    findResult.items[1].category.includes(categoryName)
                ).toBeTruthy();
            });

            test('Deve consultar um total de zero categorias com uma categoria inexistente', async () => {
                const findResult = await categoryService.find({
                    category: 'dsjfsbjkasdkj',
                });

                expect(findResult.totalCount).toBe(0);
            });

            test('Deve consultar as categorias por sua URL com sucesso', async () => {
                let categoryUrl = 'legal';
                let findResult = await categoryService.find({
                    url: categoryUrl,
                });

                expect(findResult.totalCount).toBe(2);
                expect(
                    findResult.items[0].url_src.includes(categoryUrl)
                ).toBeTruthy();
                expect(
                    findResult.items[1].url_src.includes(categoryUrl)
                ).toBeTruthy();

                categoryUrl = 'teste';
                findResult = await categoryService.find({
                    url: categoryUrl,
                });

                expect(findResult.totalCount).toBe(2);
                expect(
                    findResult.items[0].url_src.includes(categoryUrl)
                ).toBeTruthy();
                expect(
                    findResult.items[1].url_src.includes(categoryUrl)
                ).toBeTruthy();
            });

            test('Deve consultar um total de zero categorias com uma URL inexistente', async () => {
                const findResult = await categoryService.find({
                    url: 'dsjfsbjkasdkj',
                });

                expect(findResult.totalCount).toBe(0);
            });
        });
    });

    describe('Alteração', () => {
        let category1: EventCategory;
        let category2: EventCategory;

        beforeAll(async () => {
            category1 = createMockEventCategory('Categoria 1', 'ctgr1');
            category2 = createMockEventCategory('Categoria 2', 'ctgr2');

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

        test('Deve alterar a categoria da categoria com sucesso', async () => {
            const newCategory = 'Categoria legal 1';
            const updatedCategory = await categoryService.edit(category1.id, {
                category: newCategory,
            });
            const selectedCategory = await categoryRepository.findOne(
                category1.id
            );

            expect(updatedCategory.category).toBe(newCategory);
            expect(selectedCategory.category).toBe(newCategory);
        });

        test('Deve alterar a URL da categoria com sucesso', async () => {
            const newUrl = 'urllegal3213';
            const updatedCategory = await categoryService.edit(category1.id, {
                url_src: newUrl,
            });
            const selectedCategory = await categoryRepository.findOne(
                category1.id
            );

            expect(updatedCategory.url_src).toBe(newUrl);
            expect(selectedCategory.url_src).toBe(newUrl);
        });

        test('Deve falhar em alterar para uma URL existente', async () => {
            const newUrl = category2.url_src;

            await expect(async () => {
                await categoryService.edit(category1.id, {
                    url_src: newUrl,
                });
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em alterar para uma URL com caracteres especiais ou espaço', async () => {
            let newUrl = 'url legal 123123';

            await expect(async () => {
                await categoryService.edit(category1.id, {
                    url_src: newUrl,
                });
            }).rejects.toThrowError(InvalidUrlSrc);

            newUrl = 'url@legal!ansdjka';

            await expect(async () => {
                await categoryService.edit(category1.id, {
                    url_src: newUrl,
                });
            }).rejects.toThrowError(InvalidUrlSrc);
        });

        test('Deve falhar em alterar uma categoria inexistente', async () => {
            const newUrl = 'urllegal3213';
            await expect(async () => {
                await categoryService.edit(-20, {
                    url_src: newUrl,
                });
            }).rejects.toThrowError(NotFoundError);
        });
    });

    describe('Exclusão', () => {
        let categoryId: number;

        beforeEach(async () => {
            try {
                const category = await categoryRepository.save(
                    createMockEventCategory('Categoria Exemplo Legal', 'cel48281')
                );
                categoryId = category.id;
            } catch (err) {
                return;
            }
        });

        afterAll(async () => {
            await categoryRepository.delete(categoryId);
        });

        test('Deve excluir a categoria cadastrada com sucesso', async () => {
            const deleteCount = await categoryService.delete(categoryId);
            expect(deleteCount).toBe(1);
        });

        test('Deve retornar zero alterações ao excluir uma sala inexistente', async () => {
            const deleteCount = await categoryService.delete(-20);
            expect(deleteCount).toBe(0);
        });

        test('Deve falhar em excluir uma categoria com um evento já associado', async () => {
            const userRepository = dataSource.getRepository(User);
            const eventRepository = dataSource.getRepository(Event);

            let user = createMockUser('jefersonCategoria@gmail.com', '27460696013', '90675849933');
            let event = createMockEvent([user], await categoryRepository.findOne(categoryId));

            user = await userRepository.save(user);
            event = await eventRepository.save(event);
            
            await expect(async () => {
                await categoryService.delete(categoryId);
            }).rejects.toThrowError(QueryFailedError);

            await eventRepository.delete(event.id);
            await userRepository.delete(user.id);
        });
    });

    describe('Verificar FK com evento', () => {
        const categories: EventCategory[] = [];
        let event: Event;
        let user: User;

        beforeAll(async () => {
            categories.push(await categoryRepository.save(createMockEventCategory('Categoria 1 Teste', 'c1t23')));
            categories.push(await categoryRepository.save(createMockEventCategory('Categoria 2 Teste', 'c2t45')));

            user = await dataSource
                .getRepository(User)
                .save(
                    createMockUser(
                        'usuarioTesteCategoriaService@teste.com',
                        '54818631035',
                        '33642134673'
                    )
                );

            event = await dataSource
                .getRepository(Event)
                .save(createMockEvent([user], categories[1]));
        });

        afterAll(async () => {
            await dataSource.getRepository(Event).delete(event.id);
            await categoryRepository.delete(categories[0].id);
            await categoryRepository.delete(categories[1].id);
            await dataSource.getRepository(User).delete(user.id);
        });

        test('Espera-se com que a primeira categoria não esteja relacionada com um evento', async () => {
            const result = await categoryService.isAssociatedToEvent(
                categories[0].id
            );
            expect(result).toBeFalsy();
        });

        test('Espera-se com que a segunda categoria esteja relacionada com um evento', async () => {
            const result = await categoryService.isAssociatedToEvent(
                categories[1].id
            );
            expect(result).toBeTruthy();
        });
    });
});