import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Route, Switch, useRouteMatch, } from 'react-router-dom';

import { DashboardWrapper } from 'custom-style-components';

import { useNav } from 'hooks/navbar';

import { useAuth } from 'hooks/auth';
import { LoadingSpinnerContainer } from 'components/LoadingSpinner/styled';
import axios from 'axios';
import DashboardNotFoundPage from 'pages/Dashboard/DashboardNotFoundPage';
import EditUser from 'pages/Dashboard/User/EditUser';
import ReadUser from 'pages/Dashboard/User/ReadUser';
import EditUserPassword from 'pages/Dashboard/User/EditUser/editPassword';

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
                            component={ReadUser}
                        />

                        <Route
                            exact path={path + '/:userId/alterar'}
                            component={EditUser}
                        />
                        
                        <Route
                            exact path={path + '/:userId/alterar_senha'}
                            component={EditUserPassword}
                        />

                        <Redirect from={path} to={path + '/usuario'} exact />
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
