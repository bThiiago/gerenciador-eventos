import { Request, Response } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import {
    controller,
    httpDelete,
    httpGet,
    httpPost,
    httpPut,
} from 'inversify-express-utils';
import { QueryFailedError } from 'typeorm';
import ErrMessages from '../errors/messages/messages';
import { NotFoundError } from '../errors/specialErrors/NotFoundError';
import { handleQueryFailedErorr } from '../utils/handleQueryFailedErorr';

import { expectAdmin } from '@middlewares/expectAdmin';
import { expectAdminOrEventOrganizer } from '@middlewares/expectAdminOrEventOrganizer';
import { requireAuthentication } from '@middlewares/requireAuthentication';
import { RoomService } from '@services/room.service';
import { inject } from 'inversify';

@controller('/room')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class RoomController {
    @inject(RoomService)
    private roomService: RoomService;

    @httpGet('/', requireAuthentication, expectAdminOrEventOrganizer)
    async getRoom(req: Request, res: Response) {
        let limit: number;
        let page: number;
        let code: string;

        if (
            typeof req.query.limit == 'string' &&
            !isNaN(parseInt(req.query.limit))
        ) {
            limit = Number(req.query.limit);
        }

        if (
            typeof req.query.page == 'string' &&
            !isNaN(parseInt(req.query.page))
        ) {
            page = Number(req.query.page);
        }

        if (typeof req.query.code == 'string') {
            code = req.query.code;
        }

        const findResult = await this.roomService.find({
            limit,
            page,
            code,
        });
        const mappedRooms = findResult.items.map(async (room) => {
            const isAssociated = await this.roomService.isAssociatedToActivity(
                room.id
            );
            return { ...room, canExclude: !isAssociated };
        });
        res.set('x-total-count', findResult.totalCount.toString());
        await Promise.all(mappedRooms).then((rooms) => {
            return res.status(200).json(rooms);
        });
    }

    @httpGet('/:id', requireAuthentication, expectAdminOrEventOrganizer)
    async findRoomById(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const room = await this.roomService.findById(id);
            return res.status(200).json(room);
        } catch (err) {
            //TODO: rever este tratamento de erro
            if (err instanceof NotFoundError) {
                return res
                    .status(404)
                    .json({ message: ErrMessages.roomRoutes.notFoundError });
            }
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }

            console.error('Error', err);
            return res.status(500).json({ message: ErrMessages.internalError });
        }
    }

    @httpPost(
        '/',
        requireAuthentication,
        expectAdmin,
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                code: Joi.string().required().length(4),
                capacity: Joi.number().required().min(1),
                description: Joi.string().required().max(50).min(1)
            }),
        })
    )
    async create(req: Request, res: Response) {
        const room = this.roomService.getInstance(req.body);

        try {
            const createdRoom = await this.roomService.create(room);
            return res.status(201).json(createdRoom);
        } catch (err) {
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }
            console.error('Error', err);
            return res
                .status(500)
                .json({ message: ErrMessages.roomRoutes.creationError });
        }
    }

    @httpPut(
        '/:id',
        requireAuthentication,
        expectAdmin,
        celebrate({
            [Segments.PARAMS]: Joi.object().keys({
                id: Joi.number().required().min(1),
            }),
            [Segments.BODY]: Joi.object()
                .keys({
                    code: Joi.string().optional().length(4),
                    capacity: Joi.number().optional().min(1),
                    description: Joi.string().optional().max(50).min(1)
                })
                .min(1),
        })
    )
    async edit(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const room = this.roomService.getInstance(req.body);
            const changedRoom = await this.roomService.edit(id, room);
            return res.status(200).json(changedRoom);
        } catch (err) {
            //TODO: rever este tratamento de erro
            if (err instanceof NotFoundError) {
                return res
                    .status(404)
                    .json({ message: ErrMessages.roomRoutes.notFoundError });
            }
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }
            console.error('Error', err);
            return res
                .status(500)
                .json({ message: ErrMessages.roomRoutes.editError });
        }
    }

    @httpDelete(
        '/:id',
        requireAuthentication,
        expectAdmin,
        celebrate({
            [Segments.PARAMS]: Joi.object().keys({
                id: Joi.number().required().min(1),
            }),
        })
    )
    async delete(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const affected = await this.roomService.delete(id);
            if (affected > 0) return res.status(204).send();
            return res
                .status(404)
                .send({ message: ErrMessages.roomRoutes.notFoundError });
        } catch (err) {
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }
            return res.status(500).json({ message: ErrMessages.internalError });
        }
    }
}
