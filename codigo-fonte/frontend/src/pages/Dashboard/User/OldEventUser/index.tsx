import React, { useEffect, useState } from 'react';
import { PageContentWrapper, PageTitle } from 'custom-style-components';

import { EventType } from 'types/models';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { useAuth } from 'hooks/auth';

import { fetchManyEventsByRegistry } from 'services/fetch/events';
import EventPresentationCardUser from 'components/EventPresentationCardUser';

const OldEventUser: React.FC = () => {
    const [error, setError] = useState<string>();
    const [eventList, setEventList] = useState<EventType[]>();
    const [eventsFetchLoading, setEventsFetchLoading] = useState<boolean>(true);

    const { user } = useAuth();
    useEffect(() => {
        if (user) {
            const source = createCancelTokenSource();
            fetchManyEventsByRegistry(source.token, user.id, { limit: Number.MAX_SAFE_INTEGER, old: true })
                .then(({ events }) => setEventList(events))
                .catch((err) => setError(err.message))
                .finally(() => setEventsFetchLoading(false));

            return () => {
                source.cancel();
            };
        }
    }, []);

    const renderEvents = (eventList: EventType[]) => {
        return eventList.map((event) => {
            event.icon = event.icon ?? 'https://i.imgur.com/E7igTan.jpeg';
            event.startDate = new Date(event.startDate);
            event.endDate = event.endDate ? new Date(event.endDate) : undefined;
            return (
                <EventPresentationCardUser
                    key={event.id}
                    event={event}
                    link={`/dashboard/eventos_usuario/eventos_anteriores/${event.id}/minhas_atividades`}
                />
            );
        });
    };

    return (
        <>
            {user ? (
                <PageContentWrapper>
                    <PageTitle>
                        Eventos em que {user?.name} participou
                    </PageTitle>
                    {error ? (
                        <ErrorMessage>{error}</ErrorMessage>
                    ) : eventsFetchLoading ? (
                        <LoadingSpinner />
                    ) : eventList && eventList.length > 0 ? (
                        <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            {renderEvents(eventList)}
                        </div>
                    ) : (
                        <span>
                            Você não participou de nenhum evento anterior.
                        </span>
                    )}
                </PageContentWrapper>
            ) : (
                <></>
            )}
        </>
    );
};

export default OldEventUser;
