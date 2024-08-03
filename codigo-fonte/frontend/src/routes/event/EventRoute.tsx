import React, { useEffect, useState } from 'react';
import { EventProvider } from 'hooks/EventProvider';
import { useNav } from 'hooks/navbar';
import EventPage from 'pages/EventPage';
import NotFound from 'pages/Main/NotFoundPage';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { EventType } from 'types/models';
import EventActivitiesPage from 'pages/EventPage/Activities';
import EventSchedulesPage from 'pages/EventPage/Schedules';
import { fetchOneEventByIdAndCategory } from 'services/fetch/events';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { ResponseError } from 'errors/ResponseError';
import renderEventName from 'utils/renderEventName';

interface ParamTypes {
    eventId: string;
    eventCategory: string;
}

const EventRoute: React.FC = () => {
    const { eventId, eventCategory } = useParams<ParamTypes>();
    const { path } = useRouteMatch();
    const { updateNavbarEvent } = useNav();

    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);
    const [event, setEvent] = useState<EventType>();

    useEffect(() => {
        setLoading(true);
        const source = createCancelTokenSource();
        fetchOneEventByIdAndCategory(source.token, eventId, eventCategory)
            .then((event) => {
                setEvent(event);
            })
            .catch((err) => {
                let message = err.message;
                if (err instanceof ResponseError && err.status == 404)
                    message = 'Evento não encontrado';
                setError(message);
            })
            .finally(() => setLoading(false));
    }, [eventId]);

    useEffect(() => {
        document.title = event ?  renderEventName(event) : 'Carregando evento...';
        updateNavbarEvent(event, eventId, loading, error);
    }, [event, loading, error]);

    return (
        <EventProvider event={event} error={error} loading={loading}>
            <Switch>
                <Route exact path={`${path}`} component={EventPage} />
                <Route
                    exact
                    path={`${path}/programacao`}
                    component={EventSchedulesPage}
                />
                <Route
                    exact
                    path={`${path}/inscricao`}
                    component={EventActivitiesPage}
                />
                <Route path="*" component={NotFound} />
            </Switch>
        </EventProvider>
    );
};

export default EventRoute;
