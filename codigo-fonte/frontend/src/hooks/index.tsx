import React from 'react';
import { AuthProvider } from './auth';
import PropTypes from 'prop-types';
import { NavProvider } from './navbar';
import { ChakraProvider } from '@chakra-ui/react';


const Providers: React.FC = ({ children }) => {
    return (
        <ChakraProvider>
            <AuthProvider>
                <NavProvider>
                    { children }
                </NavProvider>
            </AuthProvider>
        </ChakraProvider>
    );
};

Providers.propTypes = { 
    children: PropTypes.node.isRequired,
};

export default Providers;