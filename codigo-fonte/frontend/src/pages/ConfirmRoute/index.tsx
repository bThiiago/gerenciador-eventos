import React, { useEffect } from 'react';
import Navbar from 'components/Navbar';
import LoadingSpinner from 'components/LoadingSpinner';
import { Wrapper } from './styled';
import { api } from 'services/axios';
import { useHistory, useLocation } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import TOAST from 'constants/TOAST';
import { ResponseError } from 'errors/ResponseError';
import { GenericFrontError } from 'errors/GenericFrontError';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export const ConfirmRoute: React.FC = () => {
    const query = useQuery();
    const history = useHistory();
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable : TOAST.CLOSABLE_BY_DEFAULT,
    });

    useEffect(() => {
        const token = query.get('token');

        if (!token) {
            history.push('/');
            return;
        }

        api.get(`/confirm?token=${token}`).then(() => {
            history.push('/login');
            toast({
                title: 'Usuário confirmado',
                status: 'success'
            });
        }).catch((err) => {
            if (err instanceof GenericFrontError) {
                let message = err.message;
                if (err instanceof ResponseError) {
                    if (err.status === 400) {
                        history.push('/');
                        message = 'Não foi possível confirmar sua conta';
                    }
                }

                toast({
                    title: message,
                    status: 'error',
                });
            }
        });
    }, []);

    return (
        <>
            <Navbar activeItemUrl="home"/>
            <Wrapper>
                <LoadingSpinner />
            </Wrapper>
        </>
    );
};
