import React, { createContext, useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './auth';
import { EventType } from 'types/models';
import renderEventName from 'utils/renderEventName';

export interface NavComponent {
    title: string;
    style?: React.CSSProperties;

    link?: {
        url: string;
    };

    button?: {
        onClick?: { (): void };
        link?: string;
    };
}

interface INavContext {
    items: NavComponent[];
    updateNavbarHome: { (): void };
    updateNavbarAdmin: { (): void };
    updateNavbarOrganizer: { (): void };
    updateNavbarResponsible: { (): void };
    updateNavbarEvent: {
        (event: EventType | undefined, eventId: string, loading ?: boolean, error?: string): void;
    };
}

const NavBarContext = createContext<INavContext>({} as INavContext);

const NavProvider: React.FC = ({ children }) => {
    const [items, setItems] = useState<NavComponent[]>([]);

    const { user } = useAuth();

    const updateNavbarAdmin = useCallback(() => {
        const components: NavComponent[] = [
            {
                title: 'Eventos',
                link: {
                    url: '/',
                },
            },
        ];
        setItems(components);
    }, []);

    const updateNavbarOrganizer = useCallback(() => {
        const components: NavComponent[] = [
            {
                title: 'Eventos',
                link: {
                    url: '/',
                },
            },
        ];
        setItems(components);
    }, []);

    const updateNavbarResponsible = useCallback(() => {
        const components: NavComponent[] = [
            {
                title: 'Eventos',
                link: {
                    url: '/',
                },
            },
        ];
        setItems(components);
    }, []);

    const updateNavbarEvent = useCallback(
        (event: EventType | undefined, eventId: string, loading ?: boolean, error?: string) => {
            let components: NavComponent[];
            if (error) {
                components = [
                    {
                        title: 'Voltar para eventos',
                        link: {
                            url: '/',
                        },
                        style: {
                            marginLeft: 'auto',
                        },
                    },
                ];
            } else if (event && !loading) {
                components = [
                    {
                        title: renderEventName(event),
                        link: {
                            url: `/evento/${event.eventCategory.url_src}/${eventId}`,
                        },
                    },
                    {
                        title: 'Programação',
                        link: {
                            url: `/evento/${event.eventCategory.url_src}/${eventId}/programacao`,
                        },
                    },
                    {
                        title: 'Inscrição',
                        link: {
                            url: `/evento/${event.eventCategory.url_src}/${eventId}/inscricao`,
                        },
                    },
                    {
                        title: 'Voltar para eventos',
                        link: {
                            url: '/',
                        },
                        style: {
                            marginLeft: 'auto',
                        },
                    },
                ];
            } else {
                components = [
                    {
                        title: 'Carregando...',
                        link: {
                            url: `/evento/${eventId}`,
                        },
                    },
                    {
                        title: 'Voltar para eventos',
                        link: {
                            url: '/',
                        },
                        style: {
                            marginLeft: 'auto',
                        },
                    },
                ];
            }
            
            setItems(components);
        },
        []
    );

    const updateNavbarHome = useCallback(() => {
        let components: NavComponent[] = [
            {
                title: 'Eventos',
                link: {
                    url: '/home',
                },
            },
        ];

        if (user) {
            components = [...components];
        }

        setItems(components);
    }, [user]);

    return (
        <NavBarContext.Provider
            value={{
                updateNavbarHome,
                updateNavbarEvent,
                updateNavbarAdmin,
                updateNavbarOrganizer,
                updateNavbarResponsible,
                items,
            }}
        >
            {children}
        </NavBarContext.Provider>
    );
};

NavProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

function useNav(): INavContext {
    const context = useContext(NavBarContext);

    return context;
}

export { NavProvider, useNav };
