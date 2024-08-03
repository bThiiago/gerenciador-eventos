import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { ActivityRegistry, ActivityRegistryAPIModel } from 'types/models';
import mapActivityRegistryFromAPI from 'utils/mapFunctions/mapActivityRegistry';

export const fetchManyRegistriesByActivity = (
    tokenSource: CancelToken,
    activityId: string,
    options?: ServiceOptions.FindManyOptions
): Promise<{ registries: ActivityRegistry[]; totalCount: number }> => {
    return new Promise((resolve, reject) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
        };
        api.get<ActivityRegistryAPIModel[]>(
            `/activity/${activityId}/registry`,
            {
                cancelToken: tokenSource,
                params,
            }
        )
            .then((response) => {
                if (response) {
                    const data = response.data;
                    const totalCount = response.headers['x-total-count'];
                    const registries = data.map((registryFromApi) =>
                        mapActivityRegistryFromAPI(registryFromApi)
                    );
                    resolve({
                        registries,
                        totalCount,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};
