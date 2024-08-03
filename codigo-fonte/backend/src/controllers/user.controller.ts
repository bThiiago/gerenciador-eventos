import { expectAdmin } from '@middlewares/expectAdmin';
import { expectAdministratorOrganizerResponsibleUser } from '@middlewares/expectAdministratorOrganizerResponsibleUser';
import { expectAdminOrEventOrganizer } from '@middlewares/expectAdminOrEventOrganizer';
import { expectSameUserOrAdmin } from '@middlewares/expectSameUserOrAdmin';
import { requireAuthentication } from '@middlewares/requireAuthentication';
import { User } from '@models/User';
import { UserLevel } from '@models/UserLevel';
import { UserService } from '@services/user.service';
import { celebrate, Joi, Segments } from 'celebrate';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut } from 'inversify-express-utils';
import { QueryFailedError } from 'typeorm';

import { InvalidCpf } from '../errors/invalidErrors/InvalidCpf';
import ErrMessages from '../errors/messages/messages';
import { handleQueryFailedErorr } from '../utils/handleQueryFailedErorr';
import { InvalidCep } from '@errors/invalidErrors/invalidCep';
import { CepService } from '@services/cep.service';
import { CaptchaService } from '@services/reCaptcha.service';

const fourYearsInMs = 1000 * 60 * 60 * 24 * 30 * 12 * 4;

@controller('/user')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class UserController {
    @inject(UserService)
    private userService: UserService;

    @inject(CepService)
    private cepService: CepService;

    @httpGet(
        '/',
        requireAuthentication,
        expectAdministratorOrganizerResponsibleUser
    )
    async index(req: Request, res: Response) {
        let findResult: ServiceOptions.FindManyResult<User>;
        let limit: number;
        let page: number;

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

        if (req.user.level === UserLevel.ADMIN) {
            findResult = await this.userService.findAsAdmin({
                limit, page
            });
        } else {
            findResult = await this.userService.findAsResponsible({
                limit, page
            });
        }

        res.set('X-Total-Count', findResult.totalCount.toString());
        return res.json(findResult.items);

    }

    @httpGet(
        '/:id',
        requireAuthentication,
        expectSameUserOrAdmin,
    )
    async findById(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const user = await this.userService.findById(id);

        return res.json(user);
    }

    @httpGet(
        '/find_by_email/:email',
    )
    async findByEmail(req: Request, res: Response){
        const email = req.params.email;
        const user = await this.userService.findUserByEmail(email);
        return res.json(user);
    }

    @httpGet(
        '/event/:eventId',
        requireAuthentication,
        expectAdminOrEventOrganizer
    )
    async getUsersByEvent(req: Request, res: Response) {
        const eventId = parseInt(req.params.eventId);

        if (!isNaN(eventId)) {
            const users = await this.userService.findParticipatingUsersInfoById(eventId);
            return res.json(users);
        }
        return res.json([]);
    }

    @httpPost(
        '/',
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                name: Joi.string().required().max(150),
                email: Joi.string().required().trim().email().max(120),
                password: Joi.string().required().trim().min(6),
                cpf: Joi.string()
                    .required()
                    .trim()
                    .replace(/[^0-9]/g, '')
                    .length(11),
                cellphone: Joi.string()
                    .required()
                    .min(9)
                    .max(16)
                    .replace(/[^0-9]/g, ''),
                birthDate: Joi.date()
                    .required()
                    .max(new Date(new Date().getTime() - fourYearsInMs)),
                cep: Joi.string().optional().allow('').trim().replace('-', '').length(8),
                city: Joi.string().optional().allow('').max(120),
                uf: Joi.string().optional().allow('').length(2),
                address: Joi.string().optional().allow('').max(120),
                captcha: Joi.string().required()
            })
        }),
    )
    async create(req: Request, res: Response) {
        try {

            const isCaptchaValid = await CaptchaService.validateToken(req.body.captcha);
            if (!isCaptchaValid) {
                return res.status(400).json({ message: 'ReCAPTCHA inválido' });
            }

            if (req.body.cep != '') {
                if (!await this.cepService.validateCepCityAndUF(req.body.cep, req.body.city, req.body.uf)) throw new InvalidCep();
            }
            const userInstance = this.userService.getInstance(req.body);
            const createdUser = await this.userService.create(userInstance);

            return res.status(201).json(createdUser);
        } catch (err) {
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }

            if (err instanceof InvalidCpf || err instanceof InvalidCep) {
                return res.status(400).json({ message: err.message });
            }

            return res
                .status(400)
                .json({ message: ErrMessages.userRoutes.creationError });
        }
    }

    @httpPut(
        '/:id',
        requireAuthentication,
        expectSameUserOrAdmin,
        celebrate({
            [Segments.BODY]: Joi.object()
                .keys({
                    name: Joi.string().optional().max(150),
                    email: Joi.string().optional().trim().email().max(120),
                    cpf: Joi.string().optional().trim().replace(/[^0-9]/g, '').length(11),
                    cellphone: Joi.string().optional().min(9).max(16),
                    birthDate: Joi.date()
                        .required()
                        .max(new Date(new Date().getTime() - fourYearsInMs)),
                    cep: Joi.string().optional().allow('').trim().replace('-', '').length(8),
                    city: Joi.string().optional().allow('').max(120),
                    uf: Joi.string().optional().allow('').length(2),
                    address: Joi.string().optional().allow('').max(120)
                })
                .min(1),
        }),
    )
    async edit(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        
        try {

            if (req.body.cep != '') { //validando cep se ele não for vazio
                if (!await this.cepService.validateCepCityAndUF(req.body.cep, req.body.city, req.body.uf)) throw new InvalidCep();
            }
            const userInstance = this.userService.getInstance(req.body);
            await this.userService.edit(id, userInstance);
            return res.status(200).send();
        } catch (err) {
            console.log(err);
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }

            if (err instanceof InvalidCpf) {
                return res.status(400).json({ message: err.message });
            }

            if (err instanceof InvalidCep) {
                return res.status(400).json({ message: err.message });
            }
            return res
                .status(400)
                .json({ message: ErrMessages.userRoutes.creationError });
        }
    }

    @httpPut(
        '/edit_password/:id',
        requireAuthentication,
        celebrate({
            [Segments.BODY]: Joi.object()
                .keys({
                    password: Joi.string().required().trim().min(6),
                })
                .min(1),
        }),
    )
    async editPassword(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const userInstance = this.userService.getInstance(req.body);
            await this.userService.edit(id, userInstance);
            return res.status(200).send();
        } catch (err) {
            console.log(err);
            if (err instanceof QueryFailedError) {
                return handleQueryFailedErorr(err, req, res);
            }

            return res
                .status(400)
                .json({ message: ErrMessages.userRoutes.creationError });
        }
    }


    @httpDelete(
        '/:userId',
        requireAuthentication,
        expectAdmin,
    )
    async delete(req: Request, res: Response) {
        const id = parseInt(req.params.userId);
        if (isNaN(id)) return res.status(404).send();
        await this.userService.delete(id);
        return res.status(201).send();
    }

    @httpDelete(
        '/disable/:userId',
        requireAuthentication,
        expectAdmin,
    )
    async disable(req: Request, res: Response) {
        const id = parseInt(req.params.userId);
        if (isNaN(id)) return res.status(404).send();
        await this.userService.disable(id);
        return res.status(201).send();
    }

    @httpPost(
        '/reenable/:userId',
        requireAuthentication,
        expectAdmin,
    )
    async reenable(req: Request, res: Response) {
        const id = parseInt(req.params.userId);
        if (isNaN(id)) return res.status(404).send();
        await this.userService.reenable(id);
        return res.status(201).send();
    }

    @httpGet(
        '/dataAtual'
    )
    async GetData(req: Request, res: Response) {
        const currentDate = new Date();
        
        res.json({ currentDate });
    }
}