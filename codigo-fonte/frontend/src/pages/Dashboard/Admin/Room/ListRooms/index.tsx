import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Tooltip, useToast } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Link, useRouteMatch } from 'react-router-dom';

import COLORS from 'constants/COLORS';

import CustomButton from 'components/Button';
import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';

import { RoomType } from 'types/models';
import { api } from 'services/axios';
import { fetchManyRooms } from 'services/fetch/rooms';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { GenericFrontError } from 'errors/GenericFrontError';
import TOAST from 'constants/TOAST';
import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';

const ListRooms: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const [roomName, setRoomName] = useState('');
    const [roomShow, setRoomShow] = useState<RoomType[]>([]);
    const [roomList, setRoomList] = useState<RoomType[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(-1);

    const { path } = useRouteMatch();
    const source = useRef(createCancelTokenSource());

    const loadRooms = () => {
        source.current = createCancelTokenSource();
        setLoading(true);
        fetchManyRooms(source.current.token, { limit: Number.MAX_SAFE_INTEGER })
            .then(({ rooms }) => {
                setRoomList(rooms);
                setRoomShow(rooms);
            })
            .catch((err) => {
                setError(err.message);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRooms();
        return () => source.current.cancel();
    }, []);

    useEffect(() => {
        const filteredRoom = roomList.filter((room) => {
            const lowerCaseName = room.code.toLowerCase();
            const lowerCaseRoomName = roomName.toLowerCase();

            if (
                room.code &&
                room.code.toLowerCase().includes(lowerCaseRoomName)
            ) {
                return true;
            }

            if (
                room.capacity &&
                room.capacity.toString().includes(lowerCaseRoomName)
            ) {
                return true;
            }

            return lowerCaseName.includes(lowerCaseRoomName);
        });

        setRoomShow(filteredRoom);
    }, [roomName]);

    const deleteRoom = async (id: number) => {
        try {
            await api.delete(`/room/${id}`);

            if (roomList) {
                setRoomList([...roomList.filter((room) => room.id != id)]);
            }

            toast({
                title: 'Sala excluída',
                status: 'success',
            });
            loadRooms();
        } catch (err) {
            if (err instanceof GenericFrontError) {
                toast({
                    title: err.message,
                    status: 'error',
                });
            }
        } finally {
            setConfirmDeleteModalOpen(false);
        }
    };

    const renderTableElements = () => {
        return roomShow && roomShow.length > 0 ? (
            roomShow.map((item, index) => {
                return (
                    <tr key={index}>
                        <CustomTd>{item.code} - {item.description}</CustomTd>
                        <CustomTd align="center">{item.capacity}</CustomTd>
                        <CustomTd>
                            <CustomTableButtonWrapper>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.2rem"
                                    label="Alterar sala"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<EditIcon />}
                                        aria-label="Alterar dados"
                                        to={path + `/${item.id}/alterar`}
                                    />
                                </Tooltip>
                                {item.canExclude && (
                                    <Tooltip
                                        hasArrow
                                        fontSize="1.2rem"
                                        label="Excluir sala"
                                    >
                                        <IconButton
                                            variant="ghost"
                                            color={COLORS.danger}
                                            fontSize="1.5rem"
                                            icon={<DeleteIcon />}
                                            aria-label="Excluir sala"
                                            onClick={() => {
                                                setIdToDelete(item.id);
                                                setConfirmDeleteModalOpen(true);
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </CustomTableButtonWrapper>
                        </CustomTd>
                    </tr>
                );
            })
        ) : (
            <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
        );
    };

    return (
        <DashboardPageContent>
            <FormWrapper>
                <ConfirmDeleteComponent
                    modalOpen={confirmDeleteModalOpen}
                    setModalOpen={setConfirmDeleteModalOpen}
                    handleDelete={() => deleteRoom(idToDelete)}
                />
                <PageTitle>Salas</PageTitle>
                <CustomButton link={'salas/cadastrar'}>
                    Cadastrar nova sala
                </CustomButton>

                {roomList && roomList.length > 0 && (
                    <div
                        style={{
                            justifyContent: 'left',
                            margin: '2rem auto 3rem',
                        }}
                    >
                        <label htmlFor="search">Pesquisar Salas</label>
                        <input
                            id="search"
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Pesquise por nome ou capacidade."
                            style={{
                                borderRadius: '5px',
                                borderColor: '#bebebe',
                                width: '100%',
                                fontSize: 'max(16px,1em)',
                                backgroundColor: '#fff',
                                minHeight: '3.8rem',
                                padding: '0 1rem',
                            }}
                        />
                    </div>
                )}

                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : roomShow && roomShow.length > 0 ? (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Nome da sala</th>
                                    <th>Capacidade</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>{!loading && renderTableElements()}</tbody>
                        </CustomTable>
                        {loading && <LoadingSpinner />}
                    </>
                ) : loading ? (
                    <LoadingSpinner />
                ) : (
                    <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default ListRooms;
