import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { PresentationWrapper } from './styled';
import Banner from 'components/Banner';
import Navbar from 'components/Navbar';
import { ActivityType } from 'types/models';
import { useEvent } from 'hooks/EventProvider';
import {
    PageContentWrapper,
    PageSubtitleLight,
    PageTitle,
} from 'custom-style-components';
import LoadingSpinner from 'components/LoadingSpinner';
import ErrorMessage from 'components/ErrorMessage';
import renderEventName from 'utils/renderEventName';
import { renderDateRange, getDate } from 'utils/dateUtils';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchManyActivitiesByEvent } from 'services/fetch/activities';

let description: string;
let bannerUrl: string | null;

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
                .catch((err) => {
                    setFetchActivitiesError(err.message);
                })
                .finally(() => setEventFetchLoading(false));
        }
    }, [event]);

    if (event) {
        renderEventName(event);
        bannerUrl = event.banner ?? 'https://i.imgur.com/j0inyhG.jpeg';
    }

    const renderDateInfo = (initDate: Date, endDate?: Date) => {
        let title = 'Período do evento: ';
        if (
            !endDate ||
            (initDate.getDate() === endDate.getDate() &&
                initDate.getMonth() === endDate.getMonth() &&
                initDate.getFullYear() === endDate.getFullYear())
        ) {
            title = 'Data do evento: ';
        }
        title += renderDateRange(initDate, endDate);
        return title;
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

    const renderDescription = (description: string) => {
        const items = description.split('\n');
        return items.map((paragraph, index) => <p key={index}>{paragraph}</p>);
    };

    return (
        <>
            <Navbar activeItemUrl={pathname} />
            <PageContentWrapper>
                <p style={{ fontSize: '1em', color: '#888', textAlign: 'center', margin: '1em 0' }}>
                    Todos os horários estão no fuso horário de Brasília (GMT-3)
                </p>
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : fetchActivitiesError ? (
                    <ErrorMessage>{fetchActivitiesError}</ErrorMessage>
                ) : moreActivities ? (
                    <PageTitle>Em breve!</PageTitle>
                ) : eventFetchLoading || loading ? (
                    <LoadingSpinner />
                ) : activities && activities.length > 0 ? (
                    <PresentationWrapper>
                        {bannerUrl && <Banner bannerUrl={bannerUrl} />}
                        <PageTitle>
                            {event && renderEventName(event).toUpperCase()}
                        </PageTitle>

                        <PageSubtitleLight>
                            {event &&
                                renderDateInfo(event.startDate, event.endDate)}
                        </PageSubtitleLight>
                        <PageSubtitleLight>
                            {event &&
                                renderRegistryDateInfo(
                                    event.registryStartDate,
                                    event.registryEndDate
                                )}
                        </PageSubtitleLight>

                        <PageTitle>Apresentação</PageTitle>
                        {event &&
                            renderDescription(
                                event.description?.length > 0
                                    ? event.description
                                    : description
                            )}
                    </PresentationWrapper>
                ) : (
                    <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
                )}
                {error && <ErrorMessage>{error}</ErrorMessage>}
            </PageContentWrapper>
        </>
    );
};

export default EventPage;
