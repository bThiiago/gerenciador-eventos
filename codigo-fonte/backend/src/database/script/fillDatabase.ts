import { DB } from '../connection';

import { container } from '@core/container';
import { RoomService } from '@services/room.service';
import { EventAreaService } from '@services/eventArea.service';
import { ActivityCategoryService } from '@services/activityCategory.service';
import { UserService } from '@services/user.service';
import { EventCategoryService } from '@services/eventCategory.service';
import ListRoom from './fillRoom';
import ListEventArea from './fillEventArea';
import ListActivityCategory from './fillActivityCategory';
import ListUser from './fillUser';
import ListEventCategory from './fillEventCategory';

let roomService: RoomService;
let eventAreaService: EventAreaService;
let activityCategoryService: ActivityCategoryService;
let userService: UserService;
let eventCategoryService: EventCategoryService;

const eventAreaList = ListEventArea;
const activityCategoryList = ListActivityCategory;
const roomList = ListRoom;
const userList = ListUser;
const eventCategoryList = ListEventCategory;

async function fillDB() {
    await DB.connect();
    roomService = container.get(RoomService);
    eventAreaService = container.get(EventAreaService);
    activityCategoryService = container.get(ActivityCategoryService);
    userService = container.get(UserService);
    eventCategoryService = container.get(EventCategoryService);

    const eventAreaPromises = () => {
        return eventAreaList.map((area) => {
            return new Promise<void>((resolve) => {
                console.log(`[SCRIPT BD] AREA - "${area.name}"`);
                eventAreaService.create(area).then(() => {
                    resolve();
                });
            });
        });
    };

    const eventCategoryPromises = () => {
        return eventCategoryList.map((category) => {
            return new Promise<void>((resolve) => {
                console.log(`[SCRIPT BD] CATEGORY - "${category.category}"`);
                eventCategoryService.create(category).then(() => {
                    resolve();
                });
            });
        });
    };

    const roomPromises = () => {
        return roomList.map((room) => {
            return new Promise<void>((resolve) => {
                console.log(`[SCRIPT BD] ROOM - "${room.code}"`);
                roomService.create(room).then(() => {
                    resolve();
                });
            });
        });
    };

    const userPromises = () => {
        return userList.map((user) => {
            return new Promise<void>((resolve) => {
                console.log(
                    `[SCRIPT BD] USER - "${user.email}"`
                );
                userService.create(user).then(() => {
                    resolve();
                });
            });
        });
    };

    const activityCategoryPromises = () => {
        return activityCategoryList.map((category) => {
            return new Promise<void>((resolve) => {
                console.log(`[SCRIPT BD] CATEGORY - "${category.description}"`);
                activityCategoryService.create(category).then(() => {
                    resolve();
                });
            });
        });
    };

    console.log('[SCRIPT BD] FILLING DATABASE');

    await Promise.all(eventAreaPromises());
    await Promise.all(eventCategoryPromises());
    await Promise.all(roomPromises());
    await Promise.all(userPromises());
    await Promise.all(activityCategoryPromises());

    console.log('[SCRIPT BD] FINISHED');

    await DB.close();
}

fillDB().then(() => process.exit(0));
