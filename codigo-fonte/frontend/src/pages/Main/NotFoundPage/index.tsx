import Footer from 'components/Footer';
import Navbar from 'components/Navbar';
import React from 'react';
import { Centralize } from './styled';

const NotFoundPage: React.FC = () => {
    return (
        <>
            <Navbar />
            <Centralize>
                <div>
                    <span>404</span>
                    <span>Página não encontrada</span>
                </div>
            </Centralize>
            <Footer />
        </>
    );
};

export default NotFoundPage;
