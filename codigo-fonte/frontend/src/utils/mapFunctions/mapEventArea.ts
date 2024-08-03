import { EventArea, EventAreaAPIModel } from 'types/models';

const mapEventAreaFromAPI = (areaFromApi: EventAreaAPIModel): EventArea => {
    const area = {
        ...areaFromApi,
    } as EventArea;

    return area;
};

export default mapEventAreaFromAPI;
