import { RoomAPIModel, RoomType } from 'types/models';

const mapRoomFromAPI = (roomFromApi : RoomAPIModel) : RoomType => {
    const room = {
        ...roomFromApi,
    } as RoomType;

    return room;
};

export default mapRoomFromAPI;