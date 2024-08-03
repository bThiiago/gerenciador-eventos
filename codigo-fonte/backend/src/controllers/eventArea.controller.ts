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
import { requireAuthentication } from '@middlewares/requireAuthentication';
import { inject } from 'inversify';
import { EventAreaService } from '@services/eventArea.service';

@controller('/event_area')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class EventAreaController {
    @inject(EventAreaService)
    private areaService: EventAreaService;

    @httpGet('/')
    async getArea(req: Request, res: Response) {
        let limit: number, page: number;

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

        const findResult = await this.areaService.find({
            limit,
            page,
        });

        const mappedAreas = findResult.items.map(async (area) => {
            const isAssociated = await this.areaService.isAssociatedToEvent(
                area.id
            );
            return { ...area, canExclude: !isAssociated };
        });
        res.set('x-total-count', findResult.totalCount.toString());
        await Promise.all(mappedAreas).then((areas) => {
            return res.status(200).json(areas);
        });
    }

    @httpGet('/:id')
    async findAreaById(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(404).send('Not found');
        }

        const event = await this.areaService.findById(id);

        return res.json(event);
    }

    @httpPost(
        '/',
        requireAuthentication,
        expectAdmin,
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                name: Joi.string().required().min(1).max(80),
                sigla: Joi.string()
                    .required()
                    .min(2)
                    .max(20)
                    .regex(/^[a-zA-Z0-9-_]+$/),
            }),
        })
    )
    async create(req: Request, res: Response) {
        try {
            const createdArea = await this.areaService.create(req.body);

            return res.status(201).json(createdArea);
        } catch (err) {
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }

            return res
                .status(400)
                .json({ message: ErrMessages.categoryRoutes.creationError });
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
                    name: Joi.string().optional().min(1).max(80),
                    sigla: Joi.string()
                        .optional()
                        .min(2)
                        .max(20)
                        .regex(/^[a-zA-Z0-9-_]+$/),
                })
                .min(1),
        })
    )
    async edit(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const changedArea = await this.areaService.edit(id, req.body);
            return res.status(200).json(changedArea);
        } catch (err) {
            if (err instanceof NotFoundError) {
                return res
                    .status(404)
                    .json({ message: ErrMessages.areaRoutes.notFoundError });
            }
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }
            console.error('Error', err);
            return res
                .status(500)
                .json({ message: ErrMessages.areaRoutes.editError });
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
        const affected = await this.areaService.delete(id);
        if (affected > 0) {
            return res.status(204).send();
        }

        throw new NotFoundError('Event area');
    }
}
