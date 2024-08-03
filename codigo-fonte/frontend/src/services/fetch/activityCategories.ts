import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { ActivityCategory } from 'types/models';
import mapActivityCategoryFromAPI from 'utils/mapFunctions/mapActivityCategory';

export const fetchOneCategory = (
    tokenSource: CancelToken,
    id: string
): Promise<ActivityCategory> => {
    return new Promise((resolve, reject) => {
        api.get<ActivityCategory>(`/activity_category/${id}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const category = mapActivityCategoryFromAPI(data);
                    resolve(category);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyCategories = (
    tokenSource: CancelToken,
    options?: ServiceOptions.FindManyOptions
): Promise<{ categories: ActivityCategory[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
        };
        api.get<ActivityCategory[]>('/activity_category', {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const categories = data.map((eventFromApi) =>
                        mapActivityCategoryFromAPI(eventFromApi)
                    );
                    resolve({
                        categories,
                        totalCount,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};
