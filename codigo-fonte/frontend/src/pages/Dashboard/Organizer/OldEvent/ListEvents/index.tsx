import React, { ChangeEvent, useEffect, useState } from 'react';
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

import { IconButton, Select, Tooltip, useToast } from '@chakra-ui/react';
import {
    CalendarIcon,
    CheckIcon,
    DownloadIcon,
    ViewIcon,
} from '@chakra-ui/icons';
import COLORS from 'constants/COLORS';
import TOAST from 'constants/TOAST';
import { useAuth } from 'hooks/auth';
import { fetchManyOldEventsByResponsibleUser } from 'services/fetch/events';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import ShowParticipatingUsers from '../../components/ShowParticipatingUsers';
import { fetchManyUsersFromEvent } from 'services/fetch/users';
import renderEventName from 'utils/renderEventName';

const ListOldEvents: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const [eventListYear, setEventYears] = useState<number[]>();

    const [startYear, setStartYear] = useState<number>();
    const [eventList, setEvenList] = useState<EventType[]>([]);
    const [eventShow, setEventShow] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [oldEventName, setOldEventName] = useState('');

    const { path } = useRouteMatch();

    const [summaryIsLoading, setSummaryIsLoading] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [participatingUsers, setParticipatingUsers] = useState<People[]>([]);
    const [eventData, setEventData] = useState<EventType>({} as EventType);

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
            fetchManyOldEventsByResponsibleUser(source.token, user.id, {
                limit: Number.MAX_SAFE_INTEGER,
                startYear: undefined,
            })
                .then(({ events }) => {
                    let y = events.map((e) => e.startDate.getFullYear());
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
        }
        return () => source.cancel();
    }, [startYear]);

    useEffect(() => {
        const source = createCancelTokenSource();
        if (user) {
            setLoading(true);
            fetchManyOldEventsByResponsibleUser(source.token, user.id, {
                limit: Number.MAX_SAFE_INTEGER,
                startYear,
            })
                .then(({ events }) => {
                    setEvenList(events);
                    setEventShow(events);
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
    }, [startYear]);

    useEffect(() => {
        const filteredEvent = eventList.filter((event) => {
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

        setEventShow(filteredEvent);
    }, [oldEventName]);

    const renderTableElements = () => {
        return eventShow && eventShow.length > 0 ? (
            eventShow.map((event, index) => {
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
                            <CheckIcon color={COLORS.success} />
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
                setStartYear(
                    year === '' ? undefined : parseInt(ev.target.value)
                );
            }, 200);
        }
    }

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
                <PageTitle>Edições anteriores</PageTitle>
                {eventList && eventList.length > 0 && (
                    <FiltersWrapper>
                        <div className="select">
                            <span>Ano de início</span>
                            <Select
                                background="white"
                                size="bg"
                                placeholder="Qualquer ano"
                                variant="outline"
                                onChange={changeYear}
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
                                placeholder="Pesquise por nome ou sigla da área"
                                className="search"
                                onChange={(e) =>
                                    setOldEventName(e.target.value)
                                }
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
                ) : eventShow && eventShow.length > 0 ? (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Nome do evento</th>
                                    <th>Área</th>
                                    <th>Início</th>
                                    <th>Fim</th>
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
