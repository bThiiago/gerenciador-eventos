import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Route, Switch, useRouteMatch, } from 'react-router-dom';

import { DashboardWrapper } from 'custom-style-components';

import { useNav } from 'hooks/navbar';

import { useAuth } from 'hooks/auth';
import { LoadingSpinnerContainer } from 'components/LoadingSpinner/styled';
import axios from 'axios';
import DashboardNotFoundPage from 'pages/Dashboard/DashboardNotFoundPage';
import EventUser from 'pages/Dashboard/User/EventUser';
import EventMyActivitiesPage from 'pages/Dashboard/User/EventUser/Activities';
import OldEventUser from 'pages/Dashboard/User/OldEventUser';
import OldEventMyActivitiesPage from 'pages/Dashboard/User/OldEventUser/Activities';

const UserDataRoute: React.FC<RouteComponentProps> = () => {
    const { user } = useAuth();
    const { updateNavbarOrganizer } = useNav();

    const [canRender, setCanRender] = useState(false);

    const { path } = useRouteMatch();

    const source = axios.CancelToken.source();

    document.title = 'Controle do Usuário';

    useEffect(() => {
        if (user) {
            setCanRender(true);
        }
        return () => {
            source.cancel();
        };
    }, []);

    return (
        <>
            {!canRender ? (
                <LoadingSpinnerContainer />
            ) : (
                <DashboardWrapper>
                    <Switch>
                        <Route
                            exact
                            path={path + '/'}
                            component={EventUser}
                        />

                        <Route
                            exact path={path + '/:eventId/minhas_atividades'}
                            component={EventMyActivitiesPage}
                        />

                        <Route
                            exact path={path + '/eventos_anteriores/:eventId/minhas_atividades'}
                            component={OldEventMyActivitiesPage}
                        />

                        <Route
                            exact path={path + '/eventos_anteriores'}
                            component={OldEventUser}
                        />  

                        <Redirect from={path} to={path + '/eventos_usuario'} exact />
                        <Route
                            path="*"
                            component={DashboardNotFoundPage}
                        />
                    </Switch>
                </DashboardWrapper>
            )}
        </>
    );
};

export default UserDataRoute;
