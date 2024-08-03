import React, { useEffect } from 'react';
import { useNav } from 'hooks/navbar';
import {
    Redirect,
    Route,
    RouteComponentProps,
    Switch,
    useRouteMatch,
} from 'react-router-dom';

import CreateEvent from 'pages/Dashboard/Admin/Event/CreateEvent';
import ListEvents from 'pages/Dashboard/Admin/Event/ListEvents';
import ListRooms from 'pages/Dashboard/Admin/Room/ListRooms';

import ListEventAreas from 'pages/Dashboard/Admin/EventArea/ListEventAreas';
import CreateEventArea from 'pages/Dashboard/Admin/EventArea/CreateEventArea';
import EditEventArea from 'pages/Dashboard/Admin/EventArea/EditEventArea';

import ListEventCategories from 'pages/Dashboard/Admin/EventCategory/ListEventCategories';
import CreateEventCategory from 'pages/Dashboard/Admin/EventCategory/CreateEventCategory';
import EditEventCategory from 'pages/Dashboard/Admin/EventCategory/EditEventCategory';

import DashboardNotFoundPage from 'pages/Dashboard/DashboardNotFoundPage';
import ListOldEvents from 'pages/Dashboard/Admin/OldEvent/ListEvents';
import EditEvent from 'pages/Dashboard/Admin/Event/EditEvent';
import CreateActivityCategory from 'pages/Dashboard/Admin/ActivityCategory/CreateActivityCategory';
import ListActivityCategories from 'pages/Dashboard/Admin/ActivityCategory/ListActivityCategories';
import EditActivityCategory from 'pages/Dashboard/Admin/ActivityCategory/EditActivityCategory';
import ListActivities from 'pages/Dashboard/Admin/Event/Activities/ListActivities';
import AddUser from 'pages/Dashboard/Responsible/Activities/AddUser';
import ListUsers from 'pages/Dashboard/Admin/Users/ListUsers';
import EditUser from 'pages/Dashboard/Admin/Users/EditUser';
import CreateOrEditRoom from '../../../../pages/Dashboard/Admin/Room/CreateOrEditRoom';
import CreateUser from 'pages/Dashboard/Admin/Users/CreateUser';
import EditActivity from 'pages/Dashboard/Admin/Event/Activities/EditActivity';
import MarkPresences from 'pages/Dashboard/Responsible/Activities/MarkPresences';
import CreateActivity from 'pages/Dashboard/Admin/Event/Activities/CreateActivity';
import EditUserPassword from 'pages/Dashboard/Admin/Users/EditUser/editPassword';

const AdminRoute: React.FC<RouteComponentProps> = () => {
    const { updateNavbarAdmin } = useNav();
    const { path } = useRouteMatch();

    document.title = 'Controle Admin';

    useEffect(() => {
        updateNavbarAdmin();
    }, []);

    return (
        <>
            <Switch>
                <Route exact path={path + '/edicoes'} component={ListEvents} />
                <Route
                    path={path + '/edicoes/:eventId/alterar'}
                    component={EditEvent}
                />
                <Route
                    path={path + '/edicoes/cadastrar'}
                    component={CreateEvent}
                />

                <Route
                    path={path + '/edicoes/:eventId/programacao'}
                    exact
                    component={ListActivities}
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
                        '/edicoes/:eventId/programacao/:activityId/inscritos'
                    }
                    exact
                    component={MarkPresences}
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
                        path + '/edicoes/:eventId/programacao/criar_atividade'
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
                        '/edicoes_anteriores/:eventId/programacao/:activityId/alterar'
                    }
                    component={EditActivity}
                />

                <Route
                    exact
                    path={path + '/edicoes_anteriores/:eventId/programacao'}
                    component={ListActivities}
                />
                <Route
                    path={
                        path +
                        '/edicoes_anteriores/:eventId/programacao/:activityId/adicionar'
                    }
                    component={AddUser}
                />
                <Route
                    path={
                        path +
                        '/edicoes_anteriores/:eventId/programacao/:activityId/presencas'
                    }
                    exact
                    component={MarkPresences}
                />
                <Route
                    path={
                        path +
                        '/edicoes_anteriores/:eventId/programacao/:activityId/inscritos'
                    }
                    exact
                    component={MarkPresences}
                />

                <Route
                    exact
                    path={path + '/areas'}
                    component={ListEventAreas}
                />
                <Route
                    exact
                    path={path + '/areas/cadastrar'}
                    component={CreateEventArea}
                />
                <Route
                    exact
                    path={path + '/areas/:areaId/alterar'}
                    component={EditEventArea}
                />

                <Route
                    exact
                    path={path + '/eventos'}
                    component={ListEventCategories}
                />
                <Route
                    exact
                    path={path + '/eventos/cadastrar'}
                    component={CreateEventCategory}
                />
                <Route
                    exact
                    path={path + '/eventos/:categoryId/alterar'}
                    component={EditEventCategory}
                />

                <Route exact path={path + '/salas'} component={ListRooms} />
                <Route
                    exact
                    path={path + '/salas/cadastrar'}
                    component={CreateOrEditRoom}
                />
                <Route
                    exact
                    path={path + '/salas/:roomId/alterar'}
                    component={CreateOrEditRoom}
                />

                <Route
                    exact
                    path={path + '/categoria_atividade'}
                    component={ListActivityCategories}
                />
                <Route
                    exact
                    path={path + '/categoria_atividade/cadastrar'}
                    component={CreateActivityCategory}
                />
                <Route
                    exact
                    path={path + '/categoria_atividade/:categoryId/alterar'}
                    component={EditActivityCategory}
                />

                <Route exact path={path + '/usuarios'} component={ListUsers} />
                <Route
                    exact
                    path={path + '/usuarios/:userId/alterar'}
                    component={EditUser}
                />


                <Route
                    exact path={path + '/usuarios/:userId/alterar_senha'}
                    component={EditUserPassword}
                />
                <Route
                    exact
                    path={path + '/usuarios/cadastrar'}
                    component={CreateUser}
                />

                <Redirect from={path} to={path + '/edicoes'} exact />
                <Route path="*" component={DashboardNotFoundPage} />
            </Switch>
        </>
    );
};

export default AdminRoute;
