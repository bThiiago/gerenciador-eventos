import { DashboardPageContent } from 'custom-style-components';
import { Centralize } from 'pages/Main/NotFoundPage/styled';
import React from 'react';

const DashboardNotFoundPage: React.FC = () => {
    return (
        <DashboardPageContent>
            <Centralize>
                <div>
                    <span>404</span>
                    <span>Página não encontrada</span>
                </div>
            </Centralize>
        </DashboardPageContent>
    );
};

export default DashboardNotFoundPage;
