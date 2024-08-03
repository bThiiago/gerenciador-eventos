import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { EventArea, EventAreaAPIModel } from 'types/models';
import mapEventAreaFromAPI from 'utils/mapFunctions/mapEventArea';

export const fetchOneArea = (
    tokenSource: CancelToken,
    id: string
): Promise<EventArea> => {
    return new Promise((resolve, reject) => {
        api.get<EventAreaAPIModel>(`/event_area/${id}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const area = mapEventAreaFromAPI(data);
                    resolve(area);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyAreas = (
    tokenSource: CancelToken,
    options?: ServiceOptions.FindManyOptions
): Promise<{ areas: EventArea[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
        };
        api.get<EventAreaAPIModel[]>('/event_area', {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const areas = data.map((eventFromApi) =>
                        mapEventAreaFromAPI(eventFromApi)
                    );
                    resolve({
                        areas,
                        totalCount,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};
