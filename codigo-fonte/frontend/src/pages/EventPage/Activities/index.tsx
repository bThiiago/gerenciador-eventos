import React, { useEffect, useState } from 'react';
import Navbar from 'components/Navbar';
import {
    PageContentWrapper,
    PageSubtitleLight,
    PageTitle,
    TextNormal,
} from 'custom-style-components';
import { useLocation } from 'react-router';
import { ActivityCategory, ActivityType } from 'types/models';
import { useEvent } from 'hooks/EventProvider';
import ActivityCardGroup from './components/ActivityCardGroup';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { useAuth } from 'hooks/auth';
import { fetchManyActivitiesByEvent } from 'services/fetch/activities';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { renderDateRange, getDate } from 'utils/dateUtils';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Switch } from '@chakra-ui/switch';

const EventActivitiesPage: React.FC = () => {
    const [activities, setActivities] = useState<ActivityType[]>();
    const [userActivities, setUserActivities] = useState<ActivityType[]>([]);
    const [vacanActivities, setVacanActivities] = useState<ActivityType[]>([]);

    const [loading, setLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(false);
    const [fetchActivitiesError, setFetchActivitiesError] = useState(false);

    const [show, setShow] = useState(false);
    const [showVacancie, setShowVacancie] = useState(false);

    const [moreActivities, setMoreActivities] = useState(false);
    const [pendingRatings, setPendingRatings] = useState(false);

    const { event, error } = useEvent();
    const { pathname } = useLocation();

    const { user } = useAuth();

    useEffect(() => {
        const source = createCancelTokenSource();
        if (event && event.endDate) {
            if (event.endDate > getDate() && !event.statusActive) {
                setLoading(false);
                setMoreActivities(true);
                return;
            }
            setMoreActivities(false);
            fetchManyActivitiesByEvent(source.token, event.id.toString(), {
                limit: Number.MAX_SAFE_INTEGER,
            })
                .then(({ activities }) => {
                    setActivities(activities);
                    if (user) {
                        return fetchManyActivitiesByEvent(
                            source.token,
                            event.id.toString(),
                            {
                                limit: Number.MAX_SAFE_INTEGER,
                                fromUser: user.id,
                            }
                        );
                    }
                    return new Promise<{
                        activities: ActivityType[];
                        totalCount: number;
                    }>((resolve) =>
                        resolve({
                            activities: [] as ActivityType[],
                            totalCount: 0,
                        })
                    );
                })
                .then(({ activities }) => {
                    setUserActivities(activities);
                    setPendingRatings(
                        activities.some(
                            (x) =>
                                x.activityRegistration &&
                                x.activityRegistration.some(
                                    (y) => y.rating == 0
                                )
                        )
                    );
                })
                .catch((err) => {
                    setFetchActivitiesError(err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [event]);

    const renderActivities = (activities: ActivityType[] | undefined) => {
        if (event && activities && activities.length > 0) {
            const actGroup: {
                category: ActivityCategory;
                group: ActivityType[];
            }[] = [];
            activities.forEach((activity) => {
                const category = activity.activityCategory;
                const group = actGroup.find(
                    (x) => x.category.id === category.id
                );
                if (group) {
                    group.group.push(activity);
                } else {
                    actGroup.push({
                        category,
                        group: [activity],
                    });
                }
            });

            return actGroup.map((group) => {
                return (
                    <ActivityCardGroup
                        key={group.category.code}
                        title={group.category.description}
                        activities={group.group}
                        event={event}
                        user={user}
                        userActivities={userActivities}
                        vacancyActivities={vacanActivities}
                    />
                );
            });
        }

        if (show) {
            return (
                <p>
                    Você não está inscrito em nenhuma atividades deste evento.
                </p>
            );
        }
        return <p>Não há atividades neste evento.</p>;
    };

    const renderRegistryDateInfo = (initDate: Date, endDate?: Date) => {
        let title = 'Período de inscrição: ';
        if (
            !endDate ||
            (initDate.getDate() === endDate.getDate() &&
                initDate.getMonth() === endDate.getMonth() &&
                initDate.getFullYear() === endDate.getFullYear())
        ) {
            title = 'Data de inscrição: ';
        }
        title += renderDateRange(initDate, endDate);
        return title;
    };

    const filterHandle = (status: boolean) => {
        setShow(status);
        const source = createCancelTokenSource();
        setActivityLoading(true);
        if (event && user) {
            fetchManyActivitiesByEvent(source.token, event.id.toString(), {
                limit: Number.MAX_SAFE_INTEGER,
            })
                .then(({ activities }) => {
                    setActivities(activities);
                    if (user) {
                        return fetchManyActivitiesByEvent(
                            source.token,
                            event.id.toString(),
                            {
                                limit: Number.MAX_SAFE_INTEGER,
                                fromUser: user.id,
                            }
                        );
                    }
                    return new Promise<{
                        activities: ActivityType[];
                        totalCount: number;
                    }>((resolve) =>
                        resolve({
                            activities: [] as ActivityType[],
                            totalCount: 0,
                        })
                    );
                })
                .then(({ activities }) => {
                    setUserActivities(activities);
                    setPendingRatings(
                        activities.some(
                            (x) =>
                                x.activityRegistration &&
                                x.activityRegistration.some(
                                    (y) => y.rating == 0
                                )
                        )
                    );
                })
                .catch((err) => {
                    setFetchActivitiesError(err.message);
                })
                .finally(() => {
                    setActivityLoading(false);
                });
        }
    };

    const filterVacanciesHandle = (status: boolean) => {
        setShowVacancie(status);
        const source = createCancelTokenSource();
        setActivityLoading(true);

        if (event) {
            fetchManyActivitiesByEvent(source.token, event.id.toString(), {
                limit: Number.MAX_SAFE_INTEGER,
            })
                .then(({ activities }) => {
                    const availableVaccineActivities = activities.filter(
                        (activity) => {
                            const totalRegistry = activity.totalRegistry ?? 0;
                            return totalRegistry < activity.vacancy;
                        }
                    );
                    setVacanActivities(availableVaccineActivities);
                    setActivities(activities);

                    if (user) {
                        return fetchManyActivitiesByEvent(
                            source.token,
                            event.id.toString(),
                            {
                                limit: Number.MAX_SAFE_INTEGER,
                                fromUser: user.id,
                            }
                        );
                    }
                    return new Promise<{
                        activities: ActivityType[];
                        totalCount: number;
                    }>((resolve) =>
                        resolve({
                            activities: [] as ActivityType[],
                            totalCount: 0,
                        })
                    );
                })
                .then(({ activities }) => {
                    setUserActivities(activities);
                    setPendingRatings(
                        activities.some(
                            (x) =>
                                x.activityRegistration &&
                                x.activityRegistration.some(
                                    (y) => y.rating == 0
                                )
                        )
                    );
                })
                .catch((err) => {
                    setFetchActivitiesError(err.message);
                })
                .finally(() => {
                    setActivityLoading(false);
                });
        }
    };

    return (
        <>
            <Navbar activeItemUrl={pathname} />
            <p style={{ fontSize: '1em', color: '#888', textAlign: 'center', margin: '1em 0' }}>
                Todos os horários estão no fuso horário de Brasília (GMT-3)
            </p>
            <PageContentWrapper>
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : fetchActivitiesError ? (
                    <ErrorMessage>{fetchActivitiesError}</ErrorMessage>
                ) : loading ? (
                    <LoadingSpinner />
                ) : moreActivities ? (
                    <PageTitle>Em breve!</PageTitle>
                ) : (
                    <>
                        <PageTitle>Atividades</PageTitle>
                        <PageSubtitleLight>
                            {event &&
                                renderRegistryDateInfo(
                                    event.registryStartDate,
                                    event.registryEndDate
                                )}
                        </PageSubtitleLight>
                        <FormControl mb={6} display="flex" alignItems="center">
                            <FormLabel fontSize="3xl" mb="0">
                                Ocultar vagas esgotadas
                            </FormLabel>
                            <Switch
                                size="lg"
                                id="filter"
                                defaultChecked={showVacancie}
                                isChecked={showVacancie}
                                onChange={() => {
                                    filterVacanciesHandle(!showVacancie);
                                }}
                            />
                        </FormControl>
                        {user ? (
                            <FormControl
                                mb={6}
                                display="flex"
                                alignItems="center"
                            >
                                <FormLabel fontSize="3xl" mb="0">
                                    Minhas atividades
                                </FormLabel>
                                <Switch
                                    size="lg"
                                    id="filter"
                                    defaultChecked={show}
                                    isChecked={show}
                                    onChange={() => filterHandle(!show)}
                                />
                                {pendingRatings ? (
                                    <TextNormal
                                        style={{
                                            color: '#ffbb00',
                                            fontWeight: 'bold',
                                            marginLeft: '15px',
                                        }}
                                    >
                                        Você possui avaliações pendentes!
                                    </TextNormal>
                                ) : undefined}
                            </FormControl>
                        ) : (
                            <></>
                        )}
                        {activityLoading ? (
                            <LoadingSpinner />
                        ) : show ? (
                            renderActivities(userActivities)
                        ) : showVacancie ? (
                            renderActivities(vacanActivities)
                        ) : (
                            renderActivities(activities)
                        )}
                    </>
                )}
            </PageContentWrapper>
        </>
    );
};

export default EventActivitiesPage;
