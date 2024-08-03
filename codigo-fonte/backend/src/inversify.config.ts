import { AsyncContainerModule } from 'inversify';
import { DB } from './database/connection';

export const getBindings = (databaseType= 'default'): AsyncContainerModule => {
    return new AsyncContainerModule(async bind => {
        await DB.connect(databaseType);

        await Promise.all([
            import('@services/activity.service'),
            import('@services/encryption.service'),
            import('@controllers/eventArea.controller'),
            import('@controllers/eventCategory.controller'),
            import('@controllers/activityCategory.controller'),
            import('@controllers/activity.controller'),
            import('@controllers/event.controller'),
            import('@controllers/responsibility.controller'),
            import('@controllers/room.controller'),
            import('@controllers/sessions.controller'),
            import('@controllers/user.controller'),
            import('@controllers/recover.controller'),
        ]);
    });
};