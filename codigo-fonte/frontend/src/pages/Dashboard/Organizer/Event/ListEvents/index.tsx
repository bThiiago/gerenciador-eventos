import React, { useEffect, useState } from 'react';
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

import { IconButton, Switch, Tooltip, useToast } from '@chakra-ui/react';
import {
    CalendarIcon,
    CheckIcon,
    CloseIcon,
    DownloadIcon,
    EditIcon,
    ViewIcon,
} from '@chakra-ui/icons';
import COLORS from 'constants/COLORS';
import TOAST from 'constants/TOAST';
import { useAuth } from 'hooks/auth';
import { fetchManyEventsByResponsibleUser } from 'services/fetch/events';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { GenericFrontError } from 'errors/GenericFrontError';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { fetchManyUsersFromEvent } from 'services/fetch/users';
import ShowParticipatingUsers from '../../components/ShowParticipatingUsers';
import renderEventName from 'utils/renderEventName';

const ListEvents: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const [eventList, setEvenList] = useState<EventType[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [summaryIsLoading, setSummaryIsLoading] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [participatingUsers, setParticipatingUsers] = useState<People[]>([]);
    const [eventData, setEventData] = useState({} as EventType);

    const { path } = useRouteMatch();

    const [modalOpen, setModalOpen] = useState(false);

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

    useEffect(() => {
        const source = createCancelTokenSource();
        if (user) {
            setLoading(true);
            fetchManyEventsByResponsibleUser(source.token, user.id, {
                limit: Number.MAX_SAFE_INTEGER,
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
        }
        return () => source.cancel();
    }, []);

    const changeVisibleStatus = async (id: number, status: boolean) => {
        if (!eventList) return;

        try {
            await api.put(`/sge/${id}`, {
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
            await api.put(`/sge/${id}`, {
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

    const renderTableElements = () => {
        if (!eventList || eventList.length == 0) {
            return <tbody />;
        }

        return (
            <tbody>
                {eventList.map((event, index) => (
                    <tr key={index}>
                        <CustomTd>{renderEventName(event)}</CustomTd>
                        <CustomTd align="center">
                            {renderDateAsDayMonth(event.startDate)}
                        </CustomTd>
                        <CustomTd align="center">
                            {event.endDate
                                ? renderDateAsDayMonth(event.endDate)
                                : renderDateAsDayMonth(event.startDate)}
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
                            {event.readyForCertificate ? (
                                <CheckIcon color={COLORS.success} />
                            ) : (
                                <CloseIcon color={COLORS.danger} />
                            )}
                        </CustomTd>
                        <CustomTd>
                            <CustomTableButtonWrapper>
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
                                    fontSize="1.3rem"
                                    label="Alterar dados do evento"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<EditIcon />}
                                        aria-label="Alterar dados"
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
                ))}
            </tbody>
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
                <PageTitle>Edições</PageTitle>
                {!eventList || eventList.length == 0 ? (
                    <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
                ) : (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Nome do evento</th>
                                    <th>Início</th>
                                    <th>Fim</th>
                                    <th>Ativo</th>
                                    <th>Visível</th>
                                    <th>Certificados</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            {!loading && renderTableElements()}
                        </CustomTable>
                        {loading && <LoadingSpinner />}
                    </>
                )}

                {error && <ErrorMessage>{error}</ErrorMessage>}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default ListEvents;
