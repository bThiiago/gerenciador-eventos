import { EventCategory, EventCategoryAPIModel } from 'types/models';

const mapEventCategoryFromAPI = (categoryFromApi : EventCategoryAPIModel) : EventCategory => {
    const category = {
        ...categoryFromApi,
    } as EventCategory;

    return category;
};

export default mapEventCategoryFromAPI;