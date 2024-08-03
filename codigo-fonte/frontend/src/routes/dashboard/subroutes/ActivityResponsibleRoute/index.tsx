import React, { ReactElement, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Route, Switch, useRouteMatch, } from 'react-router-dom';

import { DashboardWrapper } from 'custom-style-components';
import { useNav } from 'hooks/navbar';
import ListActivities from 'pages/Dashboard/Responsible/Activities/ListActivities';
import ListOldActivities from 'pages/Dashboard/Responsible/OldActivities/ListActivities';
import { api } from 'services/axios';
import { useAuth } from 'hooks/auth';
import { LoadingSpinnerContainer } from 'components/LoadingSpinner/styled';
import axios from 'axios';
import DashboardNotFoundPage from 'pages/Dashboard/DashboardNotFoundPage';
import EditActivity from 'pages/Dashboard/Responsible/Activities/EditActivity';
import AddUser from 'pages/Dashboard/Responsible/Activities/AddUser';
import MarkPresences from 'pages/Dashboard/Responsible/Activities/MarkPresences';


const ActivityResponsibleRoute: React.FC<RouteComponentProps> = () => {
    const { user } = useAuth();
    const { updateNavbarResponsible } = useNav();

    const [canRender, setCanRender] = useState(false);
    const [redirect, setRedirect] = useState<ReactElement>();

    const { path } = useRouteMatch();

    const source = axios.CancelToken.source();

    document.title = 'Controle Responsável da Atividade';

    useEffect(() => {
        if (user) {
            api.get(`/user/responsibility/permissions/${user.id}`, {
                cancelToken: source.token,
            })
                .then((res) => {
                    if (res.data.isActivityResponsible) setCanRender(true);
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
            updateNavbarResponsible();
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
                            path={path + '/atividades'}
                            component={ListActivities}
                        />
                        <Route
                            path={path + '/atividades/:activityId/alterar'}
                            component={EditActivity}
                        />
                        <Route
                            path={path + '/atividades/:activityId/presencas'}
                            component={MarkPresences}
                        />
                        <Route
                            path={path + '/atividades/:activityId/adicionar'}
                            component={AddUser}
                        />
                        <Route
                            exact
                            path={path + '/atividades_anteriores'}
                            component={ListOldActivities}
                        />
                        <Route
                            path={path + '/atividades_anteriores/:activityId/presencas'}
                            component={MarkPresences}
                        />
                        <Redirect from={path} to={path + '/atividades'} exact />
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

export default ActivityResponsibleRoute;
