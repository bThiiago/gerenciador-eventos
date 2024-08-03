import { ActivityCategory, ActivityCategoryAPIModel } from 'types/models';

const mapActivityCategoryFromAPI = (categoryFromApi : ActivityCategoryAPIModel) : ActivityCategory => {
    const category = {
        ...categoryFromApi,
    } as ActivityCategory;

    return category;
};

export default mapActivityCategoryFromAPI;