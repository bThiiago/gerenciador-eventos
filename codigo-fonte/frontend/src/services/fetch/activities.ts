import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { ActivityAPIModel, ActivityType } from 'types/models';
import mapActivityFromAPI from 'utils/mapFunctions/mapActivity';

interface FindManyActivitiesFromEventOptions
    extends ServiceOptions.FindManyOptions {
    fromUser?: number;
}

interface CategoryPerEventFilter {
    category?: number;
}

export const fetchOneActivity = (
    tokenSource: CancelToken,
    id: string
): Promise<ActivityType> => {
    return new Promise((resolve, reject) => {
        api.get<ActivityAPIModel>(`/activity/${id}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {
                const data = response.data;
                const activity = mapActivityFromAPI(data);
                resolve(activity);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyActivitiesByUser = (
    tokenSource: CancelToken,
    userId: string,
    options?: ServiceOptions.FindManyOptions & CategoryPerEventFilter
): Promise<{ activities: ActivityType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            category: options?.category
        };
        api.get<ActivityAPIModel[]>(`/user/responsibility/${userId}/activity`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                const data = response.data;
                const totalCount = response.headers['x-total-count'];
                const activities = data.map((activityFromApi) =>
                    mapActivityFromAPI(activityFromApi)
                );
                resolve({
                    activities,
                    totalCount,
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyOldActivitiesByUser = (
    tokenSource: CancelToken,
    userId: string,
    options?: ServiceOptions.FindManyOptions & CategoryPerEventFilter
): Promise<{ activities: ActivityType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            category: options?.category,
            old: true,
        };
        api.get<ActivityAPIModel[]>(`/user/responsibility/${userId}/activity`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const activities = data.map((activityFromApi) =>
                        mapActivityFromAPI(activityFromApi)
                    );
                    resolve({
                        activities,
                        totalCount,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyActivitiesByEvent = (
    tokenSource: CancelToken,
    eventId: string,
    options?: FindManyActivitiesFromEventOptions & CategoryPerEventFilter
): Promise<{ activities: ActivityType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            fromUser: options?.fromUser,
            category: options?.category
        };
        api.get<ActivityAPIModel[]>(`/sge/${eventId}/activities`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const activities = data.map((activityFromApi) =>
                        mapActivityFromAPI(activityFromApi)
                    );
                    resolve({
                        activities,
                        totalCount,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyOldActivitiesByEvent = (
    tokenSource: CancelToken,
    eventId: string,
    options?: ServiceOptions.FindManyOptions & CategoryPerEventFilter
): Promise<{ oldActivities: ActivityType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            category: options?.category
        };
        api.get<ActivityAPIModel[]>(`/sge/${eventId}/activities?old`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const oldActivities = data.map((activityFromApi) =>
                        mapActivityFromAPI(activityFromApi)
                    );
                    resolve({
                        oldActivities,
                        totalCount,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};
