import { ActivityType } from 'types/models';

const getActivityCode = (activity : ActivityType) : string => {
    return activity.activityCategory.code + (activity.indexInCategory > 9 ? '' : '0') + activity.indexInCategory;
};

export default getActivityCode;