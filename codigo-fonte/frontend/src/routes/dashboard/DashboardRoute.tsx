import NavbarControl from 'components/NavbarControl';
import { useAuth } from 'hooks/auth';
import DashboardNotFoundPage from 'pages/Dashboard/DashboardNotFoundPage';
import { DashboardWrapper } from 'custom-style-components';
import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import Admin from './subroutes/AdminRoute';
import EventOrganizerRoute from './subroutes/EventOrganizerRoute';
import ActivityResponsibleRoute from './subroutes/ActivityResponsibleRoute';
import UserDataRoute from './subroutes/UserDataRoute';
import UserEventRoute from './subroutes/UserEventRoute';

const DashboardRoute: React.FC = () => {
    const { path } = useRouteMatch();
    const { user } = useAuth();

    return (
        <>
            <NavbarControl />
            <DashboardWrapper>
                <Switch>
                    <Route
                        path={`${path}/admin`}
                        render={(props) => {
                            if (user) {
                                if (user.level == 9)
                                    return <Admin {...props} />;
                                return <Redirect to="/" />;
                            }

                            return <Redirect to="/login" />;
                        }}
                    />
                    <Route
                        path={`${path}/organizador`}
                        render={(props) => {
                            if (user) {
                                return <EventOrganizerRoute {...props} />;
                            }
                            return <Redirect to="/login" />;
                        }}
                    />
                    <Route
                        path={`${path}/responsavel`}
                        render={(props) => {
                            if (user) {
                                return <ActivityResponsibleRoute {...props} />;
                            }
                            return <Redirect to="/login" />;
                        }}
                    />
                    <Route
                        path={`${path}/usuario`}
                        render={(props) => {
                            if (user) {
                                return <UserDataRoute {...props} />;
                            }
                            return <Redirect to="/login" />;
                        }}
                    />
                    <Route
                        path={`${path}/eventos_usuario`}
                        render={(props) => {
                            if (user) {
                                return <UserEventRoute {...props} />;
                            }
                            return <Redirect to="/login" />;
                        }}
                    />
                    <Route path="*" component={DashboardNotFoundPage} />
                </Switch>
            </DashboardWrapper>
        </>
    );
};

export default DashboardRoute;
