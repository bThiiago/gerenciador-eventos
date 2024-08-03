import React from 'react';

import { Spinner } from '@chakra-ui/react';
import { LoadingSpinnerContainer } from './styled';

const LoadingSpinner: React.FC = () => {
    return (
        <LoadingSpinnerContainer>
            <Spinner size="lg" speed="0.90s" />
            <span>Carregando...</span>
        </LoadingSpinnerContainer>
    );
};

export default LoadingSpinner;
