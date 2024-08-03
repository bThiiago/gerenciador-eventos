import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FiltersWrapper,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';

import { renderDateAsDayMonth } from 'utils/dateUtils';
import { EventType, People } from 'types/models';
import { api } from 'services/axios';

import { IconButton, Select, Tooltip, useToast } from '@chakra-ui/react';
import {
    CalendarIcon,
    CheckIcon,
    CloseIcon,
    DeleteIcon,
    DownloadIcon,
    ViewIcon,
} from '@chakra-ui/icons';
import CustomButton from 'components/Button';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';
import { fetchManyOldEvents } from 'services/fetch/events';
import { fetchManyUsersFromEvent } from 'services/fetch/users';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import TOAST from 'constants/TOAST';
import COLORS from 'constants/COLORS';
import { ResponseError } from 'errors/ResponseError';
import { GenericFrontError } from 'errors/GenericFrontError';
import renderEventName from 'utils/renderEventName';
import ShowParticipatingUsers from 'pages/Dashboard/Organizer/components/ShowParticipatingUsers';

const ListOldEvents: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const [startYear, setStartYear] = useState<number>();
    const [eventListYear, setEventYears] = useState<number[]>();

    const [oldEventName, setOldEventName] = useState('');
    const [oldEventData, setOldEventData] = useState({} as EventType);
    const [oldEventShow, setOldEventShow] = useState<EventType[]>([]);
    const [oldEventList, setOldEventList] = useState<EventType[]>([]);

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
        setLoading(true);
        source.current = createCancelTokenSource();
        fetchManyOldEvents(source.current.token, {
            startYear,
            limit: Number.MAX_SAFE_INTEGER,
            all: true,
        })
            .then(({ oldEvents }) => {
                setOldEventList(oldEvents);
                setOldEventShow(oldEvents);
            })
            .catch((err) => {
                setError(err.message);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() => setLoading(false));

        return () => source.current.cancel();
    };

    useEffect(() => {
        loadEvents();
        return () => source.current.cancel();
    }, [startYear]);

    useEffect(() => {
        setLoading(true);
        source.current = createCancelTokenSource();
        fetchManyOldEvents(source.current.token, {
            startYear: undefined,
            limit: Number.MAX_SAFE_INTEGER,
            all: true,
        })
            .then(({ oldEvents }) => {
                let y = oldEvents.map((e) => e.startDate.getFullYear());
                y = y.filter(function (elem, pos) {
                    return y.indexOf(elem) == pos;
                });

                setEventYears(y);
            })
            .catch((err) => {
                setError(err.message);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() => setLoading(false));

        return () => source.current.cancel();
    }, [startYear]);

    useEffect(() => {
        const filteredEvent = oldEventList.filter((event) => {
            const lowerCaseName = event.eventCategory.category.toLowerCase();
            const lowerCaseEventName = oldEventName.toLowerCase();

            if (
                event.eventCategory.category &&
                event.eventCategory.category
                    .toLowerCase()
                    .includes(lowerCaseEventName)
            ) {
                return true;
            }

            if (
                event.eventArea.sigla &&
                event.eventArea.sigla.toLowerCase().includes(lowerCaseEventName)
            ) {
                return true;
            }

            return lowerCaseName.includes(lowerCaseEventName);
        });

        setOldEventShow(filteredEvent);
    }, [oldEventName]);

    const deleteEvent = async (id: number) => {
        try {
            await api.delete(`/sge/${id}`);
            if (oldEventList) {
                setOldEventList([...oldEventList.filter((ev) => ev.id != id)]);
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
        return oldEventShow && oldEventShow.length > 0 ? (
            oldEventShow.map((event, index) => {
                return (
                    <tr key={index}>
                        <CustomTd>{renderEventName(event)}</CustomTd>
                        <CustomTd>{event.eventArea.sigla}</CustomTd>
                        <CustomTd align="center">
                            {renderDateAsDayMonth(event.startDate)}
                        </CustomTd>
                        <CustomTd align="center">
                            {event.endDate
                                ? renderDateAsDayMonth(event.endDate)
                                : renderDateAsDayMonth(event.startDate)}
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
                                            setOldEventData(event);
                                            openModal(event.id);
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Ver programação"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<CalendarIcon />}
                                        aria-label="Ver programação"
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
                            </CustomTableButtonWrapper>
                        </CustomTd>
                    </tr>
                );
            })
        ) : (
            <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
        );
    };

    let timeout: number;
    async function changeYear(
        ev: ChangeEvent<HTMLSelectElement>
    ): Promise<void> {
        if (ev.target.value != undefined) {
            setLoading(true);

            if (timeout) {
                clearTimeout(timeout);
            }

            timeout = setTimeout(() => {
                const year = ev.target.value;
                setStartYear(year === '' ? undefined : parseInt(year));
            }, 200);
        }
    }

    return (
        <DashboardPageContent>
            <ShowParticipatingUsers
                event={oldEventData}
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
                <PageTitle>Edições anteriores</PageTitle>
                <CustomButton link={'edicoes/cadastrar'}>
                    Cadastrar nova edição
                </CustomButton>
                {oldEventList && oldEventList.length > 0 && (
                    <FiltersWrapper>
                        <div className="select">
                            <span>Ano de início</span>
                            <Select
                                background="white"
                                size="bg"
                                placeholder="Qualquer ano"
                                variant="outline"
                                onChange={changeYear}
                                style={{
                                    borderRadius: '5px',
                                    borderColor: '#bebebe',
                                    width: '100%',
                                    fontSize: 'max(16px,1em)',
                                    backgroundColor: '#fff',
                                    minHeight: '3.8rem',
                                    padding: '0 1rem',
                                }}
                            >
                                {eventListYear && eventListYear.length > 0 ? (
                                    eventListYear.map((y) => (
                                        <option key={y}>{y}</option>
                                    ))
                                ) : (
                                    <option>Sem Opções</option>
                                )}
                            </Select>
                        </div>
                        <div
                            style={{
                                justifyContent: 'left',
                                margin: '2rem auto 3rem',
                            }}
                        >
                            <label htmlFor="search">
                                Pesquisar Edições Anteriores
                            </label>
                            <input
                                id="search"
                                type="text"
                                value={oldEventName}
                                onChange={(e) =>
                                    setOldEventName(e.target.value)
                                }
                                placeholder="Pesquise por nome ou sigla da área."
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
                    </FiltersWrapper>
                )}

                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : oldEventShow && oldEventShow.length > 0 ? (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Edição</th>
                                    <th>Área</th>
                                    <th>Início</th>
                                    <th>Fim</th>
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

export default ListOldEvents;
