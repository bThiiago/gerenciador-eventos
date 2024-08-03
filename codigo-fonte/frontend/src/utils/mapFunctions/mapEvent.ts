import { EventAPIModel, EventType, People } from 'types/models';

const mapEventFromAPI = (eventFromAPI : EventAPIModel) : EventType => {
    const event = {
        ...eventFromAPI,
        startDate : eventFromAPI.startDate ? new Date(eventFromAPI.startDate) : undefined,
        endDate : eventFromAPI.endDate ? new Date(eventFromAPI.endDate) : undefined,
        responsibleUsers : eventFromAPI.responsibleUsers?.map(responsibleFromAPI => {
            const modeledResponsible = {
                ...responsibleFromAPI,
                birthDate : responsibleFromAPI.birthDate ? new Date(responsibleFromAPI.birthDate) : undefined,
            } as People;
            return modeledResponsible;
        }),
        registryStartDate : eventFromAPI.registryStartDate ? new Date(eventFromAPI.registryStartDate) : undefined,
        registryEndDate : eventFromAPI.registryEndDate ? new Date(eventFromAPI.registryEndDate) : undefined,
    } as EventType;

    return event;
};

export default mapEventFromAPI;