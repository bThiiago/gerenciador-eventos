import React, { useEffect, useState } from 'react';
import { useAuth } from 'hooks/auth';
import { Container } from './styled';
import { Link, useHistory } from 'react-router-dom';
import { Button as ButtonChakra, Menu, MenuButton, MenuDivider, MenuItem, MenuList, useToast, } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import COLORS from 'constants/COLORS';
import { api } from 'services/axios';
import axios from 'axios';
import TOAST from 'constants/TOAST';

interface Responsibities {
    activities: boolean;
    events: boolean;
}

const LoginInfo: React.FC = () => {
    const [responsibility, setResponsibility] = useState<Responsibities>({
        activities: false,
        events: false,
    });

    const { user, signOut } = useAuth();
    const history = useHistory();
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const source = axios.CancelToken.source();

    useEffect(() => {
        if (user) {
            api.get(`/user/responsibility/permissions/${user.id}`, {
                cancelToken: source.token,
            }).then((res) => {
                if (!res || res.status != 200) return;

                const { data } = res;
                const responsible: Responsibities = {
                    activities: data.isActivityResponsible,
                    events: data.isEventOrganizer,
                };

                setResponsibility(responsible);
            });
        }
        return () => source.cancel();
    }, []);

    const deslogar = () => {
        signOut();
        toast({
            title: 'Sessão encerrada',
            status: 'success',
        });
        history.push('/');
    };

    return (
        <Container>
            {user ? (
                <Menu>
                    <MenuButton
                        bgColor={COLORS.primary}
                        px={4}
                        py={2}
                        transition="all 0.2s"
                        borderRadius="md"
                        borderWidth="1px"
                        _hover={{ bg: 'gray.400' }}
                        fontSize="1.5rem"
                        as={ButtonChakra}
                        color={COLORS.white}
                        rightIcon={<ChevronDownIcon />}
                    >
                        {user.name.split(' ')[0]}
                    </MenuButton>
                    <MenuList>
                        {user.level == 9 && (
                            <MenuItem
                                onClick={() =>
                                    history.push('/dashboard/admin')
                                }
                            >
                                Controle admin
                            </MenuItem>
                        )}
                        {responsibility.events && (
                            <MenuItem
                                onClick={() =>
                                    history.push('/dashboard/organizador')
                                }
                            >
                                Controle organizador
                            </MenuItem>
                        )}
                        {responsibility.activities && (
                            <MenuItem
                                onClick={() =>
                                    history.push('/dashboard/responsavel')
                                }
                            >
                                Controle responsável
                            </MenuItem>
                        )}
                        {
                            <MenuItem
                                onClick={() =>
                                    history.push('/dashboard/usuario')
                                }
                            >
                                Meus dados
                            </MenuItem>
                        }
                        {user.level != 9 && (
                            <MenuItem
                                onClick={() =>
                                    history.push('/dashboard/eventos_usuario')
                                }
                            >
                                Meus eventos
                            </MenuItem>
                        )}
                        

                        <MenuDivider />
                        <MenuItem color="red" onClick={deslogar}>
                            Sair
                        </MenuItem>
                    </MenuList>
                </Menu>
            ) : (
                <>
                    <ButtonChakra
                        as={Link}
                        variant="solid"
                        fontSize="1.5rem"
                        style={{
                            width: '100%',
                            backgroundColor: COLORS.primary,
                            color: COLORS.white
                        }}
                        to="/login"
                    >
                        Entrar
                    </ButtonChakra>
                </>
            )}
        </Container>
    );
};

export default LoginInfo;
