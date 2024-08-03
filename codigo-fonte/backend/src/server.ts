import 'reflect-metadata';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errors } from 'celebrate';
import morgan from 'morgan';
import { InversifyExpressServer } from 'inversify-express-utils';

import { container } from './core/container';
import verifyForAdmin from './utils/verifyForAdmin';
import { getBindings } from './inversify.config';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import ErrMessages from '@errors/messages/messages';
import { QueryFailedError } from 'typeorm';
import { handleQueryFailedErorr } from './utils/handleQueryFailedErorr';
import { InsufficientPermissionsError } from '@errors/services/InsufficientPermissions';
import { NotAuthenticatedError } from '@errors/services/NotAuthenticatedError';
import { DateConflictError } from '@errors/specialErrors/DateConflictError';
import { UserCannotBeDisabled } from '@errors/specialErrors/UserCannotBeDisabled';
import { NoVacancyOnActivity } from '@errors/specialErrors/NoVacancyOnActivity';
import { SERVER_CONFIG } from './config/server.config';
import { ConflictingEditionError } from '@errors/specialErrors/ConflictingEditionError';
import { InvisibleEventError } from '@errors/specialErrors/InvisibleEventError';
import { UserCannotBeDeleted } from '@errors/specialErrors/UserCannotBeDeleted';

interface IApplication {
    getApp: () => express.Application;
    createApp: () => express.Application;
    start: (databaseType: string) => Promise<express.Application>;
}

// Garante que sempre existirá um único app
let app: express.Application;

export function Server(): IApplication {
    const getApp = (): express.Application => {
        return app;
    };

    const createApp = (): express.Application => {
        if (!app) {
            const server = new InversifyExpressServer(container, null, {
                rootPath: SERVER_CONFIG.ROOTPATH || '/api/v1',
            });

            server.setConfig((app) => {
                // Permite acesso de qualquer origin, no momento
                app.use(
                    cors({
                        origin: '*',
                        exposedHeaders: 'x-total-count',
                    })
                );

                app.use(morgan('dev'));

                // Diversas configurações de seguranças prontas para express
                app.use(helmet());

                app.use(express.json({ limit: '5mb' }));

                app.use(errors());
            });

            server.setErrorConfig((app) => {
                app.use((_, res: Response) => {
                    res.status(404).json({ message: 'Route not found' });
                });

                app.use(errors());

                app.use((err: any, req: Request, res: Response, _) => {
                    if (err instanceof NotAuthenticatedError) {
                        return res.status(400).json({ message: err.message });
                    }

                    if (err instanceof InvisibleEventError) {
                        return res.status(401).json({ message: err.message });
                    }

                    if (err instanceof InsufficientPermissionsError) {
                        return res.status(403).json({ message: err.message });
                    }

                    if (err instanceof UserCannotBeDeleted) {
                        return res.status(408).json({ message: err.message });
                    }

                    if (err instanceof DateConflictError) {
                        return res
                            .status(409)
                            .json({ message: err.message, data: err.data });
                    }

                    if (err instanceof ConflictingEditionError) {
                        return res.status(409).json({ message: err.message });
                    }

                    if (err instanceof NoVacancyOnActivity) {
                        return res.status(409).json({ message: err.message });
                    }

                    if (err instanceof UserCannotBeDisabled) {
                        return res.status(409).json({ message: err.message });
                    }

                    if (err instanceof BusinessRuleError) {
                        return res.status(400).json({ message: err.message });
                    }

                    if (err instanceof QueryFailedError) {
                        return handleQueryFailedErorr(err, req, res);
                    }

                    if (err instanceof NotFoundError) {
                        return res.status(404).json({ message: err.message });
                    }

                    console.error(err);

                    return res
                        .status(500)
                        .json({ message: ErrMessages.internalError });
                });
            });

            app = server.build();
            return app;
        }
    };

    const start = async (
        databaseType = 'default'
    ): Promise<express.Application> => {
        await container.loadAsync(getBindings(databaseType));
        await verifyForAdmin();

        if (!app) {
            createApp();
        }

        return app;
    };

    return {
        getApp,
        createApp,
        start,
    };
}
