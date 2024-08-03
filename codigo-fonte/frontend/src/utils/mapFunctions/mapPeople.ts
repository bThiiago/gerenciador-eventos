import { People, PeopleAPIModel } from 'types/models';
import mapActivityRegistryFromAPI from './mapActivityRegistry';

const mapPeopleFromAPI = (peopleFromApi : PeopleAPIModel) : People => {
    const people = {
        ...peopleFromApi,
        birthDate : peopleFromApi.birthDate ? new Date(peopleFromApi.birthDate) : undefined,
        activityRegistration : peopleFromApi.activityRegistration?.map(registry => {
            return mapActivityRegistryFromAPI(registry);
        }),
    } as People;

    return people;
};

export default mapPeopleFromAPI;