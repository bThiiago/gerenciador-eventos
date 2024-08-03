import React from 'react';
import PropTypes from 'prop-types';
import { ErrorMessageContainer } from './styled';

const ErrorMessage: React.FC = ({ children }) => {
    return (
        <ErrorMessageContainer>
            <p>{children}</p>
        </ErrorMessageContainer>
    );
};

ErrorMessage.propTypes = {
    children: PropTypes.any.isRequired,
};

export default ErrorMessage;
