import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { People, PeopleAPIModel } from 'types/models';
import mapPeopleFromAPI from 'utils/mapFunctions/mapPeople';


export const fetchManyUsers = (
    tokenSource: CancelToken,
    options?: ServiceOptions.FindManyOptions,
): Promise<{ users: People[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params: ServiceOptions.FindManyOptions = {
            page: options?.page,
            limit: options?.limit,
        };

        api.get<PeopleAPIModel[]>('/user', {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const users = data.map((eventFromApi) =>
                        mapPeopleFromAPI(eventFromApi)
                    );
                    resolve({
                        users,
                        totalCount,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};


export const fetchOneUser = (
    tokenSource: CancelToken,
    id: number
): Promise<People> => {
    return new Promise((resolve, reject) => {
        api.get<PeopleAPIModel>(`/user/${id}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {
                
                const data = response.data;
                const user = mapPeopleFromAPI(data);

                resolve(user);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyUsersFromEvent = (
    eventId : number,
    tokenSource: CancelToken,
    options?: ServiceOptions.FindManyOptions,
): Promise<People[]> => {
    return new Promise((resolve, reject) => {
        const params: ServiceOptions.FindManyOptions = {
            page: options?.page,
            limit: options?.limit,
        };

        api.get<PeopleAPIModel[]>(`/user/event/${eventId}`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const users = data.map((eventFromApi) =>
                        mapPeopleFromAPI(eventFromApi)
                    );
                    resolve(users);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};
