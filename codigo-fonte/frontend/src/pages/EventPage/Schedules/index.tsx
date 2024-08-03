import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import Navbar from 'components/Navbar';
import { ActivityType } from 'types/models';
import { useEvent } from 'hooks/EventProvider';
import { PageContentWrapper, PageTitle } from 'custom-style-components';
import { Container, Title, Category, Time, ContentWrapper } from './styled';
import LoadingSpinner from 'components/LoadingSpinner';
import ErrorMessage from 'components/ErrorMessage';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchManyActivitiesByEvent } from 'services/fetch/activities';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { format, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { renderDateAsTime, getDate } from 'utils/dateUtils';

const EventPage: React.FC = () => {
    const { pathname } = useLocation();
    const { event, loading, error } = useEvent();
    const [fetchActivitiesError, setFetchActivitiesError] = useState(false);
    const [eventFetchLoading, setEventFetchLoading] = useState<boolean>(true);
    const [moreActivities, setMoreActivities] = useState(true);
    const [activities, setActivities] = useState<ActivityType[]>();

    useEffect(() => {
        const source = createCancelTokenSource();
        if (event && event.endDate) {
            if (event.endDate > getDate() && !event.statusActive) {
                setMoreActivities(true);
                return;
            }
            setMoreActivities(false);
            fetchManyActivitiesByEvent(source.token, event.id.toString(), {
                limit: Number.MAX_SAFE_INTEGER,
            })
                .then(({ activities }) => {
                    setActivities(activities);
                })
                .catch((err) => {
                    setFetchActivitiesError(err.message);
                })
                .finally(() => setEventFetchLoading(false));
        }
    }, [event]);

    const renderTabElements = () => {
        if (!activities || activities.length === 0) {
            return (
                <Tabs>
                    <TabList>
                        <Tab>Nenhuma atividade</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <div style={{ color: 'red', fontWeight: 'bold' }}>
                                Nenhuma atividade
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            );
        }

        const daysOfWeek = [
            'Domingo',
            'Segunda',
            'Terça',
            'Quarta',
            'Quinta',
            'Sexta',
            'Sábado',
        ];

        return (
            <Tabs
                isFitted
                size="lg"
                colorScheme="green"
                defaultIndex={activities[0].schedules[0].startDate.getDay()}
                sx={{
                    '.chakra-tabs__tablist': {
                        borderBottom: '1px solid #00bd96',
                        '@media (max-width: 550px)': {
                            display: 'grid',
                            justifyContent: 'center',
                        },
                    },
                }}
            >
                <TabList mt={10} backgroundColor={'white'} borderRadius={40}>
                    {daysOfWeek.map((day, index) => {
                        const dayActivities = activities.filter((activity) => {
                            const startDate = new Date(
                                activity.schedules[0].startDate
                            );
                            const activityDayOfWeek = getDay(startDate);
                            return activityDayOfWeek === index;
                        });

                        if (dayActivities.length > 0) {
                            const formattedDate = format(
                                dayActivities[0].schedules[0].startDate,
                                'MMM d',
                                { locale: ptBR }
                            );
                            return (
                                <Tab
                                    fontSize="1.6rem"
                                    key={index}
                                    _selected={{
                                        color: '#00bd96',
                                        borderBottom: '2px solid #00bd96',
                                        borderRadius: '30px',
                                    }}
                                    _hover={{
                                        color: '#00bd96',
                                        borderBottom: '2px solid #00bd96',
                                        borderRadius: '30px',
                                    }}
                                >{`${day}, ${formattedDate}`}</Tab>
                            );
                        } else {
                            return (
                                <Tab
                                    fontSize="1.6rem"
                                    key={index}
                                    _selected={{
                                        color: '#00bd96',
                                        borderBottom: '2px solid #00bd96',
                                        borderRadius: '30px',
                                    }}
                                    isDisabled
                                >
                                    {`${day}`}
                                </Tab>
                            );
                        }
                    })}
                </TabList>
                <TabPanels>
                    {daysOfWeek.map((day, dayIndex) => (
                        <TabPanel key={dayIndex}>
                            <ContentWrapper>
                                {activities
                                    .filter((activity) => {
                                        const startDate = new Date(
                                            activity.schedules[0].startDate
                                        );
                                        const activityDayOfWeek =
                                            getDay(startDate);
                                        return activityDayOfWeek === dayIndex;
                                    })
                                    .map((activity, activityIndex) => (
                                        <Container key={activityIndex}>
                                            <div>
                                                <Category>
                                                    {
                                                        activity
                                                            .activityCategory
                                                            .description
                                                    }
                                                </Category>
                                                <Title>{activity.title}</Title>
                                                {activity.schedules?.map(
                                                    (
                                                        schedule,
                                                        scheduleIndex
                                                    ) => (
                                                        <Time
                                                            key={scheduleIndex}
                                                        >
                                                            {renderDateAsTime(
                                                                schedule.startDate
                                                            )}{' '}
                                                            -{' '}
                                                            {renderDateAsTime(
                                                                new Date(
                                                                    schedule.startDate.getTime() +
                                                                    schedule.durationInMinutes *
                                                                    60000
                                                                )
                                                            )}
                                                            <p style={{ fontSize: '0.8em', color: '#888' }}>
                                                                Horário de Brasília
                                                            </p>
                                                        </Time>
                                                    )
                                                )}
                                            </div>
                                        </Container>
                                    ))}
                                {activities.filter((activity) => {
                                    const startDate = new Date(
                                        activity.schedules[0].startDate
                                    );
                                    const activityDayOfWeek = getDay(startDate);
                                    return activityDayOfWeek === dayIndex;
                                }).length === 0 && (
                                    <div
                                        style={{
                                            color: 'red',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Nenhuma atividade
                                    </div>
                                )}
                            </ContentWrapper>
                        </TabPanel>
                    ))}
                </TabPanels>
            </Tabs>
        );
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
                ) : moreActivities ? (
                    <PageTitle>Em breve!</PageTitle>
                ) : eventFetchLoading || loading ? (
                    <LoadingSpinner />
                ) : !activities || activities.length === 0 ? (
                    <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
                ) : (
                    <>
                        <PageTitle>Calendário da Programação</PageTitle>
                        {!loading && renderTabElements()}
                    </>
                )}
                {error && <ErrorMessage>{error}</ErrorMessage>}
            </PageContentWrapper>
        </>
    );
};

export default EventPage;
