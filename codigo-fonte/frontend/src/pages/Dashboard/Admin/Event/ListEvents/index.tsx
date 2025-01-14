import React, { useEffect, useRef, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';

import { renderDateAsDayMonth } from 'utils/dateUtils';
import { EventType, People } from 'types/models';
import { api } from 'services/axios';

import CustomButton from 'components/Button';
import { IconButton, Switch, Tooltip, useToast } from '@chakra-ui/react';
import {
    CalendarIcon,
    CheckIcon,
    CloseIcon,
    DeleteIcon,
    DownloadIcon,
    EditIcon,
    ViewIcon,
} from '@chakra-ui/icons';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { fetchManyEvents } from 'services/fetch/events';
import { fetchManyUsersFromEvent } from 'services/fetch/users';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import TOAST from 'constants/TOAST';
import { ResponseError } from 'errors/ResponseError';
import { GenericFrontError } from 'errors/GenericFrontError';
import COLORS from 'constants/COLORS';
import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';
import ShowParticipatingUsers from 'pages/Dashboard/Organizer/components/ShowParticipatingUsers';
import renderEventName from 'utils/renderEventName';

const ListEvents: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const [eventList, setEvenList] = useState<EventType[]>();
    const [eventData, setEventData] = useState({} as EventType);

    const [participatingUsers, setParticipatingUsers] = useState<People[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    const [summaryIsLoading, setSummaryIsLoading] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(-1);

    const { path } = useRouteMatch();
    const source = useRef(createCancelTokenSource());

    const openModal = (eventId: number) => {
        setModalOpen(true);
        setSummaryIsLoading(true);
        setSummaryError(null);
        const source = createCancelTokenSource();
        fetchManyUsersFromEvent(eventId, source.token)
            .then((users) => {
                setParticipatingUsers(users);
            })
            .catch((error) => setSummaryError(error.message))
            .finally(() => setSummaryIsLoading(false));
    };

    const loadEvents = () => {
        source.current = createCancelTokenSource();
        setLoading(true);
        fetchManyEvents(source.current.token, {
            limit: Number.MAX_SAFE_INTEGER,
            all: true,
        })
            .then(({ events }) => {
                setEvenList(events);
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
        loadEvents();
        return () => source.current.cancel();
    }, []);

    const changeVisibleStatus = async (id: number, status: boolean) => {
        if (!eventList) return;

        try {
            await api.put(`/sge/update_status/${id}`, {
                statusVisible: status,
            });

            const updatedList = eventList.map((e) => {
                if (e.id === id) {
                    e.statusVisible = status;
                }
                return e;
            });

            toast({
                title: status ? 'Evento visível' : 'Evento invisível',
                status: 'info',
                duration: 2000,
            });

            setEvenList(updatedList);
        } catch (err) {
            let message = 'Erro inesperado';
            if (err instanceof GenericFrontError) {
                message = err.message;
            }
            toast({
                title: message,
                status: 'error',
            });
        }
    };

    const changeActiveStatus = async (id: number, status: boolean) => {
        if (!eventList) return;

        try {
            await api.put(`/sge/update_status/${id}`, {
                statusActive: status,
            });

            const updatedList = eventList.map((e) => {
                if (e.id === id) {
                    e.statusActive = status;
                }
                return e;
            });

            toast({
                title: status ? 'Evento ativo' : 'Evento inativo',
                status: 'info',
                duration: 2000,
            });

            setEvenList(updatedList);
        } catch (err) {
            let message = 'Erro inesperado';
            if (err instanceof GenericFrontError) {
                message = err.message;
            }
            toast({
                title: message,
                status: 'error',
            });
        }
    };

    const deleteEvent = async (id: number) => {
        try {
            await api.delete(`/sge/${id}`);
            if (eventList) {
                setEvenList([...eventList.filter((ev) => ev.id != id)]);
                toast({
                    title: 'Edição excluida',
                    description: `Exclusão da edição ${id}`,
                    status: 'success',
                });
            }
            loadEvents();
        } catch (err) {
            let message = 'Erro';
            if (err instanceof GenericFrontError) {
                message = err.message;
                if (err instanceof ResponseError && err.status === 404)
                    message = 'Edição não encontrada';
            }
            toast({
                title: 'Erro na exclusão',
                description: message,
                status: 'error',
            });
        } finally {
            setConfirmDeleteModalOpen(false);
        }
    };

    const renderTableElements = () => {
        return eventList && eventList.length > 0 ? (
            eventList.map((event, index) => {
                return (
                    <tr key={index}>
                        <CustomTd>{renderEventName(event)}</CustomTd>
                        <CustomTd align="center">
                            {renderDateAsDayMonth(event.startDate)}
                        </CustomTd>
                        <CustomTd align="center">
                            {renderDateAsDayMonth(
                                event.endDate ?? event.startDate
                            )}
                        </CustomTd>
                        <CustomTd align="center">
                            <Switch
                                colorScheme="blue"
                                size="lg"
                                defaultChecked={event.statusActive}
                                isChecked={event.statusActive}
                                onChange={() =>
                                    changeActiveStatus(
                                        event.id,
                                        !event.statusActive
                                    )
                                }
                            />
                        </CustomTd>
                        <CustomTd align="center">
                            <Switch
                                colorScheme="blue"
                                size="lg"
                                defaultChecked={event.statusVisible}
                                isChecked={event.statusVisible}
                                onChange={() =>
                                    changeVisibleStatus(
                                        event.id,
                                        !event.statusVisible
                                    )
                                }
                            />
                        </CustomTd>
                        <CustomTd align="center">
                            {event &&
                                event.responsibleUsers &&
                                event.responsibleUsers.map((r) => (
                                    <div key={r.id}>{r.name}</div>
                                ))}
                        </CustomTd>
                        <CustomTd align="center">
                            {event.readyForCertificate ? (
                                <CheckIcon color={COLORS.success} />
                            ) : (
                                <CloseIcon color={COLORS.danger} />
                            )}
                        </CustomTd>
                        <CustomTd>
                            <CustomTableButtonWrapper>
                                {event.canExclude && (
                                    <Tooltip
                                        hasArrow
                                        fontSize="1.2rem"
                                        label="Excluir edição"
                                    >
                                        <IconButton
                                            variant="ghost"
                                            color="red.600"
                                            fontSize="1.5rem"
                                            icon={<DeleteIcon />}
                                            aria-label="Excluir edição"
                                            onClick={() => {
                                                setIdToDelete(event.id);
                                                setConfirmDeleteModalOpen(true);
                                            }}
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Ver participantes"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        icon={<DownloadIcon />}
                                        aria-label="Ver participantes"
                                        onClick={() => {
                                            setEventData(event);
                                            openModal(event.id);
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.2rem"
                                    label="Alterar evento"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<EditIcon />}
                                        aria-label="Alterar evento"
                                        to={path + `/${event.id}/alterar`}
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Alterar programação"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<CalendarIcon />}
                                        aria-label="Alterar programação"
                                        to={path + `/${event.id}/programacao`}
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.2rem"
                                    label="Ir até evento"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<ViewIcon />}
                                        aria-label="Ir até evento"
                                        to={`/evento/${event.eventCategory.url_src}/${event.id}`}
                                    />
                                </Tooltip>
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
            <ShowParticipatingUsers
                event={eventData}
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
                users={participatingUsers}
                error={summaryError}
                loading={summaryIsLoading}
            />
            <FormWrapper>
                <ConfirmDeleteComponent
                    modalOpen={confirmDeleteModalOpen}
                    setModalOpen={setConfirmDeleteModalOpen}
                    handleDelete={() => deleteEvent(idToDelete)}
                />
                <PageTitle>Edições</PageTitle>
                <CustomButton link={'edicoes/cadastrar'}>
                    Cadastrar nova edição
                </CustomButton>

                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : eventList && eventList.length > 0 ? (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Edição</th>
                                    <th>Início</th>
                                    <th>Fim</th>
                                    <th>Ativo</th>
                                    <th>Visível</th>
                                    <th>Organizadores</th>
                                    <th>Certificados</th>
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

export default ListEvents;
