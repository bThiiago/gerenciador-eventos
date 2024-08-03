import React, { useEffect, useState } from 'react';
import Navbar from 'components/Navbar';

import { PageContentWrapper, PageTitle } from 'custom-style-components';
import EventPresentationCard from '../../../components/EventPresentationCard';

import { EventType } from 'types/models';
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import LoadingSpinner from 'components/LoadingSpinner';
import ErrorMessage from 'components/ErrorMessage';
import { fetchManyEvents, fetchManyOldEvents, fetchManyOldEventsByCategory } from 'services/fetch/events';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import Footer from 'components/Footer';
import { CancelTokenSource } from 'axios';
import { useParams } from 'react-router-dom';
import { useEvent } from 'hooks/EventProvider';


interface FetchOptions {
    eventCategory: string;
    startYear?: number;
    limit?: number;
    page?: number;
}

interface ParamTypes {
    eventId: string;
    eventCategory: string;
}


const asyncEventFetch = (source: CancelTokenSource, options: FetchOptions) => {
    return new Promise<{ oldEvents: EventType[]; totalCount: number }>(
        (resolve, reject) => {
            if (!options.eventCategory) {
                fetchManyOldEvents(source.token, {
                    startYear: options.startYear,
                    limit: options.limit,
                    page: options.page,
                })
                    .then((result) => resolve(result))
                    .catch((err) => reject(err));
            } else {
                fetchManyOldEventsByCategory(
                    source.token,
                    options.eventCategory,
                    {
                        startYear: options.startYear,
                        page: options.page,
                        limit: options.limit,
                    }
                )
                    .then((result) => resolve(result))
                    .catch((err) => reject(err));
            }
        }
    );
};

const Home: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const [eventList, setEventList] = useState<EventType[]>();
    const [oldEventList, setOldEventList] = useState<EventType[]>();
    const [eventsFetchLoading, setEventsFetchLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>();
    const { eventCategory } = useParams<ParamTypes>();
    const { event } = useEvent();

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchManyEvents(source.token)
            .then(({ events }) => setEventList(events))
            .catch((err) => setError(err.message))
            .finally(() => setEventsFetchLoading(false));

        return () => {
            source.cancel();
        };
    }, []);

    const renderEvents = (eventList: EventType[]) => {
        return eventList.map((event) => {
            event.icon = event.icon ?? 'https://i.imgur.com/E7igTan.jpeg';
            event.startDate = new Date(event.startDate);
            event.endDate = event.endDate ? new Date(event.endDate) : undefined;
            return <EventPresentationCard key={event.id} event={event} />;
        });
    };

    useEffect(() => {
        if (error) {
            toast({
                title: error,
                status: 'error',
            });
        }
    }, [error]);

    useEffect(() => {
        const source = createCancelTokenSource();
        setEventsFetchLoading(true);
        asyncEventFetch(source, {
            eventCategory,
            limit: Number.MAX_SAFE_INTEGER,
        })
            .then(({ oldEvents }) => {
                setOldEventList(oldEvents);
            })
            .catch((err) => setError(err.message))
            .finally(() => setEventsFetchLoading(false));

        return () => {
            source.cancel();
        };
    }, [event]);

    return (
        <>
            <Navbar activeItemUrl="/home" />
            <p style={{ fontSize: '1em', color: '#888', textAlign: 'center', margin: '1em 0' }}>
                Todos os horários estão no fuso horário de Brasília (GMT-3)
            </p>
            <PageContentWrapper>
                <PageTitle>Eventos ativos</PageTitle>
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : eventsFetchLoading ? (
                    <LoadingSpinner />
                ) : eventList && eventList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {renderEvents(eventList)}
                    </div>
                ) : (
                    <span>Não há eventos ativos no momento.</span>
                )}
            </PageContentWrapper>

            <PageContentWrapper>
                <PageTitle>
                    Eventos anteriores{' '}
                    {event?.eventCategory &&
                        ' - ' + event.eventCategory.category}
                </PageTitle>
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : eventsFetchLoading ? (
                    <LoadingSpinner />
                ) : oldEventList && oldEventList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {renderEvents(oldEventList)}
                    </div>
                ) : (
                    <span>Não há eventos passados no momento.</span>
                )}
            </PageContentWrapper>
            <Footer />
        </>
    );
};

export default Home;
