import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { RoomAPIModel, RoomType } from 'types/models';
import mapRoomFromAPI from 'utils/mapFunctions/mapRoom';

export const fetchOneRoom = (
    tokenSource: CancelToken,
    id: number
): Promise<RoomType> => {
    return new Promise<RoomType>((resolve, reject) => {
        api.get<RoomAPIModel>(`/room/${id}`, {
            cancelToken: tokenSource,
        })
            .then((res) => {
                if (res) {
                    const roomFromApi = res.data;
                    resolve(mapRoomFromAPI(roomFromApi));
                }
            })
            .catch((err) => reject(err));
    });
};

export const fetchManyRooms = (
    tokenSource: CancelToken,
    options?: ServiceOptions.FindManyOptions
): Promise<{ rooms: RoomType[]; totalCount: number }> => {
    return new Promise((resolve) => {
        const params = {
            page: options?.page,
            limit: options?.limit,
        };
        api.get<RoomAPIModel[]>('/room', {
            cancelToken: tokenSource,
            params,
        }).then((res) => {
            if (res) {
                const roomsFromApi = res.data;
                const rooms = roomsFromApi.map((apiRoom) => {
                    return mapRoomFromAPI(apiRoom);
                });
                const totalCount = Number.parseInt(
                    res.headers['x-total-count']
                );
                resolve({
                    rooms,
                    totalCount,
                });
            }
        });
    });
};
