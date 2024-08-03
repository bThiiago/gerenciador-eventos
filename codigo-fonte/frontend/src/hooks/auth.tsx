import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import PropTypes from 'prop-types';
import { api } from 'services/axios';
import { useToast } from '@chakra-ui/react';
import { ResponseError } from 'errors/ResponseError';
import TOAST from 'constants/TOAST';

interface ICredentials {
    email: string;
    password: string;
}

interface ICCredentials {
    cpf: string;
    password: string;
}

interface IUser {
    id: number;
    level: number;
    name: string;
}

interface IAuthState {
    token: string;
    user: IUser;
}

interface IAuthContext {
    signIn(credentials: ICredentials): Promise<void>;
    signInCpf(credentials: ICCredentials): Promise<void>;
    signOut(): void;
    user?: IUser;
}

interface ApiSessionRequest {
    token: string;
    user: IUser;
}

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

const AuthProvider: React.FC = ({ children }) => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const [data, setData] = useState<IAuthState>(() => {
        // Carrega os tokens do localStorage e seta os valores do Provider
        const token = localStorage.getItem('@ifspEventos:token');
        const user = localStorage.getItem('@ifspEventos:user');

        if (token && user) {
            api.defaults.headers.authorization = `Bearer ${token}`;

            return {
                token,
                user: JSON.parse(user),
            };
        }

        return {} as IAuthState;
    });

    const signIn = useCallback(async (credentials: ICredentials) => {
        const res = await api.post<ApiSessionRequest>('/sessions', {
            email: credentials.email,
            password: credentials.password,
        });

        const { token, user } = res.data;

        localStorage.setItem('@ifspEventos:token', token);
        localStorage.setItem('@ifspEventos:user', JSON.stringify(user));

        api.defaults.headers.authorization = `Bearer ${token}`;

        setData({ token, user });
    }, []);

    const signInCpf = useCallback(async (credentials: ICCredentials) => {
        const res = await api.post<ApiSessionRequest>('/sessions/cpf', {
            cpf: credentials.cpf,
            password: credentials.password,
        });

        const { token, user } = res.data;

        localStorage.setItem('@ifspEventos:token', token);
        localStorage.setItem('@ifspEventos:user', JSON.stringify(user));

        api.defaults.headers.authorization = `Bearer ${token}`;

        setData({ token, user });
    }, []);

    const signOut = useCallback(() => {
        localStorage.removeItem('@ifspEventos:token');
        localStorage.removeItem('@ifspEventos:user');

        setData({} as IAuthState);
    }, []);

    useEffect(() => {
        if (!data.token) {
            return;
        }

        api.get('/sessions/validate')
            .then(() => {
                console.log('[Auth Hook] Logado');
            })
            .catch((err) => {
                signOut();
                let message: string;
                if (err instanceof ResponseError) {
                    message = 'Sessão expirada, entre novamente.';
                } else {
                    message =
                        'O servidor não teve resposta. Entre novamente mais tarde.';
                }
                toast({
                    description: message,
                    status: 'error',
                });
            });
    }, [data.token, signOut]);

    return (
        <AuthContext.Provider value={{ signIn, signInCpf, signOut, user: data.user }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

function useAuth(): IAuthContext {
    const context = useContext(AuthContext);

    return context;
}

export { AuthProvider, useAuth };
