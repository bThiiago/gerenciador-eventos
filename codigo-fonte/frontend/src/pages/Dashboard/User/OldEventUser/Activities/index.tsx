import React, { useEffect, useState } from 'react';
import {
    PageContentWrapper,
    PageSubtitle,
    PageTitle,
} from 'custom-style-components';
import { useParams } from 'react-router';
import { ActivityType, EventType } from 'types/models';

import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { useAuth } from 'hooks/auth';
import { fetchManyActivitiesByEvent } from 'services/fetch/activities';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchOneEvent } from 'services/fetch/events';
import { ResponseError } from 'errors/ResponseError';
import { GenericFrontError } from 'errors/GenericFrontError';
import OldEventActivityCard from './components/OldEventActivityCard';
import GoBackButton from 'components/GoBackButton';
import renderEventName from 'utils/renderEventName';

interface ParamTypes {
    eventId: string;
}

const OldEventMyActivitiesPage: React.FC = () => {
    const [activities, setActivities] = useState<ActivityType[]>();
    const [loading, setLoading] = useState(true);
    const [fetchActivitiesError, setFetchActivitiesError] = useState(false);
    const [event, setEvent] = useState<EventType>();
    const [error, setError] = useState<string>();

    const { eventId } = useParams<ParamTypes>();

    const { user } = useAuth();

    useEffect(() => {
        const source = createCancelTokenSource();
        setLoading(true);
        fetchOneEvent(source.token, eventId)
            .then((event) => {
                setEvent(event);
            })
            .catch((error) => {
                if (error instanceof GenericFrontError) {
                    let message = error.message;
                    if (error instanceof ResponseError && error.status === 404)
                        message = 'Evento não encontrado';
                    setError(message);
                }
            });
        return () => source.cancel();
    }, []);

    useEffect(() => {
        const source = createCancelTokenSource();
        if (event && user) {
            fetchManyActivitiesByEvent(source.token, event.id.toString(), {
                limit: Number.MAX_SAFE_INTEGER,
                fromUser: user.id,
            })
                .then(({ activities }) => {
                    setActivities(activities);
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
        if (activities && activities.length > 0) {
            const actReturn = activities.map((activity, index) => {
                return (
                    <OldEventActivityCard
                        key={index}
                        activity={activity}
                        userId={user?.id}
                    />
                );
            });

            return actReturn;
        }

        return (
            <p>
                Você não possui histórico de atividades de eventos anteriores.
            </p>
        );
    };

    return (
        <>
            <PageContentWrapper>
                <GoBackButton />
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : fetchActivitiesError ? (
                    <ErrorMessage>{fetchActivitiesError}</ErrorMessage>
                ) : loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <PageTitle>Minhas atividades</PageTitle>
                        <PageSubtitle>
                            {event && renderEventName(event)}
                        </PageSubtitle>

                        {renderActivities(activities)}
                    </>
                )}
            </PageContentWrapper>
        </>
    );
};

export default OldEventMyActivitiesPage;
