import { ActivityType } from 'types/models';

const getActivityTitle = (activity : ActivityType) : string => {
    return activity.title;
};

export default getActivityTitle;