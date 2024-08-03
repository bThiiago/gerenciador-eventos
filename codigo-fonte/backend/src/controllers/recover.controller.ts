import { EmailService } from '@services/email.service';
import { UserService } from '@services/user.service';
import { celebrate, Joi, Segments } from 'celebrate';
import { NextFunction, Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpPost } from 'inversify-express-utils';
import { EncryptionService } from '@services/encryption.service';

//classe para recuperação de senha via e-mail

@controller('/recover')
class RecoverController {
    @inject(UserService)
    private userService: UserService;

    @inject(EmailService)
    private emailService: EmailService;
    
    @inject(EncryptionService)
    private encryptionService: EncryptionService;

    //TODO: Teste
    @httpPost(
        '/',
        celebrate({
            [Segments.BODY]: Joi.object().keys({
                email: Joi.string().required().email()
            })
        })
    )
    async recoverPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;

            const user = await this.userService.findUserByEmail(email);

            //TODO: mockar isso globalmente nos testes
            //TODO: mover isso para um processamento assíncrono
            this.emailService.recoverAccount({
                id: user.id,
                userName: user.name,
                accountEmail: email,
            });

            return res.json({ message: 'Email enviado' });
        } catch (error) {
            return next(error);
        }
    }
}