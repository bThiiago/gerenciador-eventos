import React from 'react';
import { Route, Switch } from 'react-router-dom';

import DashboardRoute from 'routes/dashboard/DashboardRoute';
import EventRoute from './event/EventRoute';
import MainRoute from './main/MainRoute';

const Routes: React.FC = () => {
    document.title = 'Eventos IFSP';
    return (
        <Switch>
            {/* Subrotas */}
            <Route path="/evento/:eventCategory/:eventId" component={EventRoute} />
            <Route path="/dashboard" component={DashboardRoute} />

            {/* Rotas main, funcionando como fallback */}
            <Route path="/" component={MainRoute} />
        </Switch>
    );
};

export default Routes;
