import { ScheduleType } from 'types/models';
import { renderDateAsDayMonth, renderDateAsTime } from './dateUtils';

export const stringifySchedule = (schedule : ScheduleType) : string => {
    const date = schedule.startDate;
    const endDate = new Date(date.getTime() + schedule.durationInMinutes * 60000);

    const stringifiedSchedule = `${renderDateAsDayMonth(date)}, ${renderDateAsTime(date)} - ${renderDateAsTime(endDate)}`;

    return stringifiedSchedule;
};