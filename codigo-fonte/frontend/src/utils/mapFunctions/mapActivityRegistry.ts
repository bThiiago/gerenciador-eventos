import { ActivityRegistry, ActivityRegistryAPIModel } from 'types/models';
import mapActivityFromAPI from './mapActivity';
import mapPeopleFromAPI from './mapPeople';

const mapActivityRegistryFromAPI = (activityRegistryFromApi : ActivityRegistryAPIModel) : ActivityRegistry => {
    const activityRegistry = {
        ...activityRegistryFromApi,
        registryDate : new Date(activityRegistryFromApi.registryDate),
        user : activityRegistryFromApi.user ? mapPeopleFromAPI(activityRegistryFromApi.user) : undefined,
        activity : activityRegistryFromApi.activity ? mapActivityFromAPI(activityRegistryFromApi.activity) : undefined,
    } as ActivityRegistry;

    return activityRegistry;
};

export default mapActivityRegistryFromAPI;