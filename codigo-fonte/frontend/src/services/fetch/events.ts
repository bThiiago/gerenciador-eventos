import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { EventAPIModel, EventType } from 'types/models';
import mapEventFromAPI from 'utils/mapFunctions/mapEvent';

interface FindManyEventOptions extends ServiceOptions.FindManyOptions {
    all?: boolean;
    old?: boolean;
}


interface IEventFilters {
    startYear?: number;
}

type FindManyEventOptionsWithFilter = FindManyEventOptions & IEventFilters;

export const fetchOneEvent = (
    tokenSource: CancelToken,
    id: string
): Promise<EventType> => {
    return new Promise((resolve, reject) => {
        api.get<EventAPIModel>(`/sge/${id}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const event = mapEventFromAPI(data);
                    resolve(event);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchOneEventByIdAndCategory = (
    tokenSource: CancelToken,
    id: string,
    category: string,
): Promise<EventType> => {
    return new Promise((resolve, reject) => {
        api.get<EventAPIModel>(`/sge/${category}/${id}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const event = mapEventFromAPI(data);
                    resolve(event);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyEventsByResponsibleUser = (
    tokenSource: CancelToken,
    userId: number,
    options?: ServiceOptions.FindManyOptions
): Promise<{ events: EventType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
        };
        api.get<EventAPIModel[]>(`/user/responsibility/${userId}/event/`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const events = data.map((eventFromApi) =>
                        mapEventFromAPI(eventFromApi)
                    );
                    resolve({
                        events,
                        totalCount,
                    });
                }

                resolve({
                    events: [],
                    totalCount: 0
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyOldEventsByResponsibleUser = (
    tokenSource: CancelToken,
    userId: number,
    options?: FindManyEventOptionsWithFilter
): Promise<{ events: EventType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            startYear: options?.startYear
        };
        api.get<EventAPIModel[]>(
            `/user/responsibility/${userId}/event/?old=true`,
            {
                cancelToken: tokenSource,
                params,
            }
        )
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const events = data.map((eventFromApi) =>
                        mapEventFromAPI(eventFromApi)
                    );
                    resolve({
                        events,
                        totalCount,
                    });
                }

                resolve({
                    events: [],
                    totalCount: 0
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyEvents = (
    tokenSource: CancelToken,
    options?: FindManyEventOptions
): Promise<{ events: EventType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            all: options?.all,
        };
        api.get<EventAPIModel[]>('/sge/', {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const events = data.map((eventFromApi) =>
                        mapEventFromAPI(eventFromApi)
                    );
                    resolve({
                        events,
                        totalCount,
                    });
                }

                resolve({
                    events: [],
                    totalCount: 0
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyOldEventsByCategory = (
    tokenSource: CancelToken,
    categoryUrl: string,
    options?: FindManyEventOptionsWithFilter
): Promise<{ oldEvents: EventType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            startYear: options?.startYear
        };

        api.get<EventAPIModel[]>(`/sge/old/category/${categoryUrl}`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const oldEvents = data.map((eventFromApi) =>
                        mapEventFromAPI(eventFromApi)
                    );
                    resolve({
                        oldEvents,
                        totalCount,
                    });
                }

                resolve({
                    oldEvents: [],
                    totalCount: 0
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyOldEvents = (
    tokenSource: CancelToken,
    options?: FindManyEventOptionsWithFilter
): Promise<{ oldEvents: EventType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            startYear: options?.startYear,
            all: options?.all,
        };
        api.get<EventAPIModel[]>('/sge/old', {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const oldEvents = data.map((eventFromApi) =>
                        mapEventFromAPI(eventFromApi)
                    );
                    resolve({
                        oldEvents,
                        totalCount,
                    });
                }

                resolve({
                    oldEvents: [],
                    totalCount: 0
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
};

export const fetchManyEventsByRegistry = (
    tokenSource: CancelToken,
    userId: number,
    options?: FindManyEventOptions
): Promise<{ events: EventType[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
            old: options?.old,
        };
        api.get<EventAPIModel[]>(`/sge/activity/activity_registry/regstry_user/${userId}`, {
            cancelToken: tokenSource,
            params,
        })
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const events = data.map((eventFromApi) =>
                        mapEventFromAPI(eventFromApi)
                    );
                    resolve({
                        events,
                        totalCount,
                    });
                }

                resolve({
                    events: [],
                    totalCount: 0,
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
};
