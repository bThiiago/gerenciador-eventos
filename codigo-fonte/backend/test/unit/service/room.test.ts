import { dataSource } from '@database/connection';
import { QueryFailedError, Repository } from 'typeorm';
import { container } from '@core/container';

import { EventCategory } from '@models/EventCategory';
import { Activity } from '@models/Activity';
import { ActivityCategory } from '@models/ActivityCategory';
import { Event } from '@models/Event';
import { Room } from '@models/Room';
import { Schedule } from '@models/Schedule';
import { User } from '@models/User';

import { RoomService } from '@services/room.service';

import { createFutureDate } from 'test/utils/createFutureDate';
import { createMockUser } from 'test/utils/createMockUser';

import { InvalidCapacityValue } from '@errors/invalidErrors/InvalidCapacityValue';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';

describe('Serviço da sala', () => {

    let roomRepository: Repository<Room>;
    let roomService: RoomService;

    beforeAll(() => {
        roomRepository = dataSource.getRepository(Room);
        roomService = container.get(RoomService);
    });

    describe('Cadastro', () => {
        test('Deve cadastrar uma sala com sucesso', async () => {
            const room = new Room('Sala 10', 30);
            const createdRoom = await roomService.create(room);
            expect(createdRoom.id).toBeDefined();

            const roomFromDB = await roomRepository.findOne(createdRoom.id);
            expect(roomFromDB).toBeDefined();
            expect(createdRoom.id).toBe(roomFromDB?.id);

            await roomRepository.delete(createdRoom.id);
        });

        test('Deve falhar em cadastrar uma sala sem código', async () => {
            const room = new Room(undefined, 30);
            await expect(async () => {
                await roomService.create(room);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma sala com código com mais de 100 caracteres', async () => {
            const room = new Room('a'.repeat(101), 30);
            await expect(async () => {
                await roomService.create(room);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma sala sem capacidade', async () => {
            const room = new Room('Sala 10', undefined);
            await expect(async () => {
                await roomService.create(room);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma sala com capacidade igual a zero', async () => {
            const room = new Room('Sala 10', 0);
            await expect(async () => {
                await roomService.create(room);
            }).rejects.toThrowError(InvalidCapacityValue);
        });

        test('Deve falhar em cadastrar uma sala com capacidade menor que zero', async () => {
            const room = new Room('Sala 10', -10);
            await expect(async () => {
                await roomService.create(room);
            }).rejects.toThrowError(InvalidCapacityValue);
        });

        test('Deve falhar em cadastrar uma sala com o mesmo código', async () => {
            const room1 = new Room('Sala 10', 30);
            const room2 = new Room('Sala 10', 40);

            const createdRoom = await roomService.create(room1);

            await expect(async () => {
                await roomService.create(room2);
            }).rejects.toThrowError(QueryFailedError);

            await roomRepository.delete(createdRoom.id);
        });
    });

    describe('Consulta', () => {
        const rooms: Room[] = [];
        beforeAll(async () => {
            rooms.push(await roomRepository.save(new Room('1 - Laboratório', 30)));
            rooms.push(
                await roomRepository.save(new Room('Sala 2 - Laboratório', 40))
            );
            rooms.push(
                await roomRepository.save(new Room('Sala 3 - Recreação', 20))
            );
        });

        afterAll(async () => {
            await roomRepository.delete(rooms[0].id);
            await roomRepository.delete(rooms[1].id);
            await roomRepository.delete(rooms[2].id);
        });

        describe('Por ID', () => {
            test('Deve consultar a sala 1 com sucesso', async () => {
                const foundRoom = await roomService.findById(rooms[0].id);

                expect(foundRoom).toEqual(rooms[0]);
            });

            test('Deve consultar a sala 2 com sucesso', async () => {
                const foundRoom = await roomService.findById(rooms[1].id);

                expect(foundRoom).toEqual(rooms[1]);
            });

            test('Deve consultar a sala 3 com sucesso', async () => {
                const foundRoom = await roomService.findById(rooms[2].id);

                expect(foundRoom).toEqual(rooms[2]);
            });

            test('Deve dar erro ao não encontrar uma sala inexistente', async () => {
                await expect(async () => {
                    await roomService.findById(-40);
                }).rejects.toThrowError(NotFoundError);
            });
        });

        describe('Multi consulta', () => {
            test('Deve consultar todas as três salas com sucesso', async () => {
                const findResult = await roomService.find();

                expect(findResult.items.length).toBe(3);
                expect(findResult.totalCount).toBe(3);
            });

            test('Deve consultar apenas duas salas por página com sucesso', async () => {
                let findResult = await roomService.find({
                    page: 1,
                    limit: 2,
                });

                expect(findResult.items.length).toBe(2);
                expect(findResult.totalCount).toBe(3);

                findResult = await roomService.find({
                    page: 2,
                    limit: 2,
                });

                expect(findResult.items.length).toBe(1);
                expect(findResult.totalCount).toBe(3);

                findResult = await roomService.find({
                    page: 3,
                    limit: 2,
                });

                expect(findResult.items.length).toBe(0);
                expect(findResult.totalCount).toBe(3);
            });

            test('Deve consultar as salas por dois códigos existentes com sucesso', async () => {
                let findResult = await roomService.find({
                    code: 'Labora',
                });

                expect(findResult.items.length).toBe(2);
                expect(findResult.totalCount).toBe(2);
                expect(findResult.items[0].code.includes('Laboratório')).toBeTruthy();
                expect(findResult.items[1].code.includes('Laboratório')).toBeTruthy();

                findResult = await roomService.find({
                    code: 'Sala',
                });

                expect(findResult.items.length).toBe(2);
                expect(findResult.totalCount).toBe(2);
                expect(findResult.items[0].code.includes('Sala')).toBeTruthy();
                expect(findResult.items[1].code.includes('Sala')).toBeTruthy();
            });

            test('Deve consultar um total de zero salas com um código inexistente', async () => {
                const findResult = await roomService.find({
                    code: '5',
                });

                expect(findResult.items.length).toBe(0);
                expect(findResult.totalCount).toBe(0);
            });
        });
    });

    describe('Alteração', () => {
        let roomData: {
            id: number;
            code: string;
            capacity: number;
            description: string;
        };

        beforeAll(async () => {
            const room = await roomRepository.save(new Room('Sala exemplo', 30));
            roomData = JSON.parse(JSON.stringify(room));
        });

        afterAll(async () => {
            await roomRepository.delete(roomData.id);
        });

        test('Deve alterar o código da sala com sucesso', async () => {
            const newCode = 'Sala teste';
            const updatedRoom = await roomService.edit(roomData.id, {
                code: newCode,
            });
            const selectedRoom = await roomRepository.findOne(roomData.id);

            expect(updatedRoom.code).toBe(newCode);
            expect(selectedRoom.code).toBe(newCode);
        });

        test('Deve alterar a capacidade da sala com sucesso', async () => {
            const newCapacity = 23;
            const updatedRoom = await roomService.edit(roomData.id, {
                capacity: newCapacity,
            });
            const selectedRoom = await roomRepository.findOne(roomData.id);

            expect(updatedRoom.capacity).toBe(newCapacity);
            expect(selectedRoom.capacity).toBe(newCapacity);
        });

        test('Deve falhar em alterar a capacidade para zero', async () => {
            const newCapacity = 0;
            await expect(async () => {
                await roomService.edit(roomData.id, {
                    capacity: newCapacity,
                });
            }).rejects.toThrowError(InvalidCapacityValue);
        });

        test('Deve falhar em alterar a capacidade para negativo', async () => {
            const newCapacity = -5;
            await expect(async () => {
                await roomService.edit(roomData.id, {
                    capacity: newCapacity,
                });
            }).rejects.toThrowError(InvalidCapacityValue);
        });

        test('Deve falhar em alterar uma sala inexistente', async () => {
            const newCapacity = 10;
            await expect(async () => {
                await roomService.edit(-20, {
                    capacity: newCapacity,
                });
            }).rejects.toThrowError(NotFoundError);
        });
    });

    describe('Exclusão', () => {
        let roomId: number;

        beforeEach(async () => {
            try {
                const room = await roomRepository.save(
                    new Room('Sala exemplo', 30)
                );
                roomId = room.id;
            } catch (err) {
                return;
            }
        });

        afterAll(async () => {
            await roomRepository.delete(roomId);
        });

        test('Deve excluir a sala cadastrada com sucesso', async () => {
            const deleteCount = await roomService.delete(roomId);
            expect(deleteCount).toBe(1);
        });

        test('Deve retornar zero alterações ao excluir uma sala inexistente', async () => {
            const deleteCount = await roomService.delete(-20);
            expect(deleteCount).toBe(0);
        });

        test('Deve falhar excluir a sala cadastrada com sucesso', async () => {
            const deleteCount = await roomService.delete(roomId);
            expect(deleteCount).toBe(1);
        });
    });

    describe('Verificar FK com atividade', () => {
        const rooms: Room[] = [];
        let activityCategory : ActivityCategory;
        let activity : Activity;
        let category : EventCategory;
        let event : Event;
        let user : User;

        beforeAll(async () => {
            rooms.push(await roomRepository.save(new Room('1 - Laboratório', 30)));
            rooms.push(
                await roomRepository.save(new Room('Sala 2 - Laboratório', 40))
            );

            user = await dataSource.getRepository(User).save(
                createMockUser('usuarioTesteUnitSala@teste.com', '63838085086', '88765930293', 'testeunitroom123')
            );
            category = await dataSource.getRepository(EventCategory).save(
                createMockEventCategory('Categoria Test Room Controller', 'ctrc232')
            );
            event = await dataSource.getRepository(Event).save(
                createMockEvent([user], category)
            );

            activityCategory = await dataSource.getRepository(ActivityCategory).save(
                new ActivityCategory('NX', 'nakjsdnasd')
            );

            activity = await dataSource.getRepository(Activity).save(
                new Activity('Atividade Teste Unit Sala', 'asdasdasd', 30, 90, event, [
                    new Schedule(createFutureDate(5), 90, rooms[1])
                ], [user], [], activityCategory)
            );
        });

        afterAll(async () => {
            await dataSource.getRepository(Activity).delete(activity.id);
            await dataSource.getRepository(ActivityCategory).delete(activityCategory.id);
            await roomRepository.delete(rooms[0].id);
            await roomRepository.delete(rooms[1].id);

            await dataSource.getRepository(Event).delete(event.id);
            await dataSource.getRepository(EventCategory).delete(category.id);
            await dataSource.getRepository(User).delete(user.id);
        });

        test('Espera-se com que a primeira sala não esteja relacionada com uma atividade', async () => {
            const result = await roomService.isAssociatedToActivity(rooms[0].id);
            expect(result).toBeFalsy();
        });

        test('Espera-se com que a segunda sala esteja relacionada com uma atividade', async () => {
            const result = await roomService.isAssociatedToActivity(rooms[1].id);
            expect(result).toBeTruthy();
        });
    });
});