import React, { ReactElement, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { DashboardWrapper } from 'custom-style-components';
import { useNav } from 'hooks/navbar';
import ListEvents from 'pages/Dashboard/Organizer/Event/ListEvents';
import ListOldEvents from 'pages/Dashboard/Organizer/OldEvent/ListEvents';
import ListOldActivities from 'pages/Dashboard/Organizer/OldEvent/Activities/ListActivities';
import EditEvent from 'pages/Dashboard/Organizer/Event/EditEvent';
import CreateActivity from 'pages/Dashboard/Organizer/Event/Activities/CreateActivity';
import ListActivities from 'pages/Dashboard/Organizer/Event/Activities/ListActivities';
import { api } from 'services/axios';
import { useAuth } from 'hooks/auth';
import { LoadingSpinnerContainer } from 'components/LoadingSpinner/styled';
import axios from 'axios';
import AddUser from 'pages/Dashboard/Responsible/Activities/AddUser';
import DashboardNotFoundPage from 'pages/Dashboard/DashboardNotFoundPage';
import EditActivity from 'pages/Dashboard/Organizer/Event/Activities/EditActivity';
import MarkPresences from 'pages/Dashboard/Responsible/Activities/MarkPresences';

const EventOrganizerRoute: React.FC<RouteComponentProps> = () => {
    const { user } = useAuth();
    const { updateNavbarOrganizer } = useNav();

    const [canRender, setCanRender] = useState(false);
    const [redirect, setRedirect] = useState<ReactElement>();

    const { path } = useRouteMatch();

    const source = axios.CancelToken.source();

    document.title = 'Controle Organizador do Evento';

    useEffect(() => {
        if (user) {
            api.get(`/user/responsibility/permissions/${user.id}`, {
                cancelToken: source.token,
            })
                .then((res) => {
                    if (res.data.isEventOrganizer) setCanRender(true);
                    else setRedirect(<Redirect to="/" />);
                })
                .catch(() => setRedirect(<Redirect to="/" />));
        }
        return () => {
            source.cancel();
        };
    }, []);

    useEffect(() => {
        if (canRender) {
            updateNavbarOrganizer();
        }
    }, [canRender]);

    return (
        <>
            {redirect}
            {!canRender ? (
                <LoadingSpinnerContainer />
            ) : (
                <DashboardWrapper>
                    <Switch>
                        <Route
                            exact
                            path={path + '/edicoes'}
                            component={ListEvents}
                        />
                        <Route
                            path={path + '/edicoes/:eventId/alterar'}
                            component={EditEvent}
                        />

                        <Route
                            path={path + '/edicoes/:eventId/programacao'}
                            exact
                            component={ListActivities}
                        />
                        <Route
                            path={
                                path +
                                '/edicoes/:eventId/programacao/:activityId/presencas'
                            }
                            exact
                            component={MarkPresences}
                        />
                        <Route
                            path={
                                path +
                                '/edicoes/:eventId/programacao/:activityId/adicionar'
                            }
                            component={AddUser}
                        />
                        <Route
                            path={
                                path +
                                '/edicoes/:eventId/programacao/criar_atividade'
                            }
                            component={CreateActivity}
                        />
                        <Route
                            path={
                                path +
                                '/edicoes/:eventId/programacao/:activityId/alterar'
                            }
                            component={EditActivity}
                        />

                        <Route
                            exact
                            path={path + '/edicoes_anteriores'}
                            component={ListOldEvents}
                        />
                        <Route
                            path={
                                path +
                                '/edicoes_anteriores/:eventId/programacao'
                            }
                            exact
                            component={ListOldActivities}
                        />
                        <Route
                            path={
                                path +
                                '/edicoes_anteriores/:eventId/programacao/:activityId/inscritos'
                            }
                            exact
                            component={MarkPresences}
                        />

                        <Redirect from={path} to={path + '/edicoes'} exact />
                        <Route path="*" component={DashboardNotFoundPage} />
                    </Switch>
                </DashboardWrapper>
            )}
        </>
    );
};

export default EventOrganizerRoute;
