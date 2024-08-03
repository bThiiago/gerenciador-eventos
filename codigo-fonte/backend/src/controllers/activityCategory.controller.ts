import { Request, Response } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { controller, httpDelete, httpGet, httpPost, httpPut, } from 'inversify-express-utils';
import { QueryFailedError } from 'typeorm';
import ErrMessages from '../errors/messages/messages';
import { NotFoundError } from '../errors/specialErrors/NotFoundError';
import { handleQueryFailedErorr } from '../utils/handleQueryFailedErorr';

import { expectAdmin } from '@middlewares/expectAdmin';
import { requireAuthentication } from '@middlewares/requireAuthentication';
import { inject } from 'inversify';
import { ActivityCategoryService } from '@services/activityCategory.service';

@controller('/activity_category')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ActivityCategoryController {
    @inject(ActivityCategoryService)
    private categoryService: ActivityCategoryService;

    @httpGet('/')
    async getCategory(req: Request, res: Response) {
        let limit : number, page : number;
        let code : string;

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

        if (
            typeof req.query.code == 'string'
        ) {
            code = req.query.code;
        }

        const findResult = await this.categoryService.find({ limit, page, code });
        const mappedCategories = findResult.items.map(async (category) => {
            const isAssociated = await this.categoryService.isAssociatedToActivity(
                category.id
            );
            return { ...category, canExclude: !isAssociated };
        });
        res.set('x-total-count', findResult.totalCount.toString());
        await Promise.all(mappedCategories).then((rooms) => {
            return res.status(200).json(rooms);
        });
    }

    @httpGet('/:id')
    async findCategoryById(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(404).send('Not found');
        }

        const event = await this.categoryService.findById(id);

        return res.json(event);
    }

    @httpPost(
        '/',
        requireAuthentication,
        expectAdmin,
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                code: Joi.string().required().min(1).max(2).regex(/^[a-zA-Z]+$/),
                description: Joi.string().required().min(1).max(200),
            }),
        })
    )
    async create(req: Request, res: Response) {
        try {
            const createdCategory = await this.categoryService.create(req.body);

            return res.status(201).json(createdCategory);
        } catch (err) {
            //TODO: Remover este tratamento de erro do repository
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
            [Segments.BODY]: Joi.object().keys({
                code: Joi.string().optional().min(1).max(2).regex(/^[a-zA-Z]+$/),
                description: Joi.string().optional().min(1).max(200),
            }).min(1),
        })
    )
    async edit(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const changedCategory = await this.categoryService.edit(id, req.body);
            return res.status(200).json(changedCategory);
        } catch (err) {
            if (err instanceof NotFoundError) {
                return res
                    .status(404)
                    .json({ message: ErrMessages.categoryRoutes.notFoundError });
            }
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }
            console.error('Error', err);
            return res
                .status(500)
                .json({ message: ErrMessages.categoryRoutes.editError });
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
        const affected = await this.categoryService.delete(id);
        if (affected > 0) { 
            return res.status(204).send(); 
        }

        throw new NotFoundError('Activity category');
    }
}
