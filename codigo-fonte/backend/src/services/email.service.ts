import { container } from '@core/container';
import { injectable, inject } from 'inversify';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { EMAIL_CONFIG } from '@config/server.config';
import { UserService } from './user.service';

interface IMail {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

interface IAccountMail {
    id: number;
    userName: string;
    accountEmail: string;
}

function generatePassword() {
    return Math.random().toString(36).slice(-10);
}

@injectable()
export class EmailService {

    @inject(UserService)
    private userService: UserService;

    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;
    private readonly fromEmail: string;

    constructor() {
        this.fromEmail = EMAIL_CONFIG.EMAIL,

            this.transporter = nodemailer.createTransport({
                host: EMAIL_CONFIG.HOST,
                port: EMAIL_CONFIG.PORT,
                secure: false,
                service: EMAIL_CONFIG.HOST.includes('gmail') ? 'gmail' : undefined,
                auth: {
                    user: EMAIL_CONFIG.AUTH_USER,
                    pass: EMAIL_CONFIG.AUTH_PASS
                }
            });
    }

    public async sendMail(email: IMail): Promise<void> {
        try {
            console.log('Sending email', email);
            await this.transporter.sendMail({
                ...email,
                from: this.fromEmail,
            });
            console.log('Email enviado com sucesso');
        } catch (error) {
            console.log(error);
        }
    }

    async recoverAccount(data: IAccountMail): Promise<void> {
        const newPassword = generatePassword();

        try {
            const user = await this.userService.findById(data.id);
            if (user) {
                user.password = newPassword; 
                await this.userService.edit(data.id, user); 
                this.sendMail({
                    to: data.accountEmail,
                    subject: 'Recuperação de senha do sistema de eventos',
                    html: [
                        `Olá ${data.userName}, estamos te enviando uma nova senha para acesso ao sistema de eventos.`,
                        `Sua nova senha é:
                        <p>${newPassword}</p> 
                        Pedimos que entre no sistema com ela e altere para uma nova senha, por questões de segurança.`
                    ].join('\n'),
                });
            } else {
                throw new Error('Usuário não encontrado');
            }
        } catch (error) {
            console.log(error);
        }
    }
}

container.bind(EmailService).toSelf();