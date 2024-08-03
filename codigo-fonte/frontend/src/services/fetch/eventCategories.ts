import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { EventCategory, EventCategoryAPIModel } from 'types/models';
import mapEventCategoryFromAPI from 'utils/mapFunctions/mapEventCategory';

export const fetchOneCategory = (
    tokenSource: CancelToken,
    id: string
): Promise<EventCategory> => {
    return new Promise((resolve, reject) => {
        api.get<EventCategoryAPIModel>(`/event_category/${id}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const category = mapEventCategoryFromAPI(data);
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
): Promise<{ categories: EventCategory[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
        };
        api.get<EventCategoryAPIModel[]>('/event_category', {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const categories = data.map((eventFromApi) =>
                        mapEventCategoryFromAPI(eventFromApi)
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
