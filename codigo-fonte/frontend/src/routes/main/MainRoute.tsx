import React, { useEffect } from 'react';
import { useNav } from 'hooks/navbar';
import { Redirect, Route, Switch } from 'react-router-dom';
import Home from 'pages/Main/Home';
import SignIn from 'pages/Main/SignIn';
import CreateUser from 'pages/Main/CreateUser';
import RecuperarSenha from 'pages/Main/RecoverPassword';
import NotFound from 'pages/Main/NotFoundPage';
import { ConfirmRoute } from 'pages/ConfirmRoute';
import TeamPage from 'pages/Main/TeamPage';


const MainRoute: React.FC = () => {
    const { updateNavbarHome } = useNav();
    useEffect(updateNavbarHome, []);

    return (
        <Switch>
            <Route
                exact
                path="/home"
                render={() => {
                    document.title = 'Página inicial';
                    return <Home />;
                }}
            />
            <Route
                exact
                path="/login"
                render={() => {
                    document.title = 'Login';
                    return <SignIn />;
                }}
            />
            <Route
                exact
                path="/cadastrar"
                render={() => {
                    document.title = 'Cadastrar';
                    return <CreateUser />;
                }}
            />
            <Route
                exact
                path="/recuperar_senha"
                render={() => {
                    document.title = 'Recuperação de senha';
                    return <RecuperarSenha />;
                }}
            />
            <Route
                exact
                path="/desenvolvedores"
                render={() => {
                    document.title = 'Desenvolvedores';
                    return <TeamPage />;
                }}
            />

            <Route 
                exact path="/confirm" 
                component={ConfirmRoute} 
            />

            <Redirect from="/" to="/home" exact />
            <Route
                path="*"
                render={() => {
                    document.title = 'Página não encontrada';
                    return <NotFound />;
                }}
            />
        </Switch>
    );
};

export default MainRoute;
