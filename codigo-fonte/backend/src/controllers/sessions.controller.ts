import { Request, Response } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { SERVER_CONFIG } from '../config/server.config';
import ErrMessages from '../errors/messages/messages';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

import { requireAuthentication } from '@middlewares/requireAuthentication';
import { inject } from 'inversify';
import { UserService } from '@services/user.service';
import { EncryptionService } from '@services/encryption.service';

export interface DecodedJWTContent {
    id: number;
    level: number;
}

const {
    JWT_CONFIG
} = SERVER_CONFIG;

@controller('/sessions')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SessionController {
    @inject(UserService)
    private userService: UserService;
    @inject(EncryptionService)
    private encryptionService: EncryptionService;

    @httpPost(
        '/',
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                email: Joi.string().required().trim().email(),
                password: Joi.string().required().min(5),
            }),
        }),
    )
    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            const valid = await this.userService.login(email, password);

            if (!valid) {
                return res.status(400).json({ message: ErrMessages.sessionRoute.wrongCredentials });
            }

            if (!valid.active) {
                return res.status(403).json({
                    message: ErrMessages.sessionRoute.disabled,
                });
            }
			
            const data: DecodedJWTContent = { 
                id: valid.id, 
                level: valid.level,
            };

            const token = this.encryptionService.sign(data);

            const userInResponse = { 
                ...data,
                name: valid.name,
            };

            return res.json({ token, user: userInResponse });
        } catch (err) {
            return res.status(400).json({ message: ErrMessages.sessionRoute.genericError });
        }
    }

    @httpPost(
        '/cpf',
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                cpf: Joi.string().required().trim().replace(/[^0-9]/g, '').length(11),
                password: Joi.string().required().min(5),
            }),
        }),
    )
    async loginCpf(req: Request, res: Response) {
        const { cpf, password } = req.body;

        try {
            const valid = await this.userService.loginCpf(cpf, password);

            if (!valid) {
                return res.status(400).json({ message: ErrMessages.sessionRoute.wrongCredentials });
            }

            if (!valid.active) {
                return res.status(403).json({
                    message: ErrMessages.sessionRoute.disabled,
                });
            }
			
            const data: DecodedJWTContent = { 
                id: valid.id, 
                level: valid.level,
            };

            const token = this.encryptionService.sign(data);

            const userInResponse = { 
                ...data,
                name: valid.name,
            };

            return res.json({ token, user: userInResponse });
        } catch (err) {
            return res.status(400).json({ message: ErrMessages.sessionRoute.genericError });
        }
    }

    @httpGet('/validate', requireAuthentication)
    validate(_, res: Response) {
        res.status(200).send();
    }
}
