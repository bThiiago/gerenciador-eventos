import { ActivityAPIModel, ActivityType, People, ScheduleType } from 'types/models';
import mapActivityCategoryFromAPI from './mapActivityCategory';
import mapEventFromAPI from './mapEvent';

const mapActivityFromAPI = (activityFromAPI : ActivityAPIModel) : ActivityType => {
    const activity = {
        ...activityFromAPI,
        event : activityFromAPI.event ? mapEventFromAPI(activityFromAPI.event) : undefined,
        schedules : activityFromAPI.schedules?.map(scheduleFromAPI => {
            const modeledSchedule = {
                ...scheduleFromAPI,
                startDate : new Date(scheduleFromAPI.startDate),
            } as ScheduleType;
            return modeledSchedule;
        }),
        responsibleUsers : activityFromAPI.responsibleUsers?.map(responsibleFromAPI => {
            const modeledResponsible = {
                ...responsibleFromAPI,
                birthDate : responsibleFromAPI.birthDate ? new Date(responsibleFromAPI.birthDate) : undefined,
            } as People;
            return modeledResponsible;
        }),
        teachingUsers : activityFromAPI.teachingUsers?.map(teachingFromAPI => {
            const modeledTeaching = {
                ...teachingFromAPI,
                birthDate : teachingFromAPI.birthDate ? new Date(teachingFromAPI.birthDate) : undefined,
            } as People;
            return modeledTeaching;
        }),
        activityCategory : mapActivityCategoryFromAPI(activityFromAPI.activityCategory),
    } as ActivityType;


    return activity;
};

export default mapActivityFromAPI;