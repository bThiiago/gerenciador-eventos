import PropTypes from 'prop-types';
import { Bars, Nav, StyledBurger } from 'components/Navbar/styled';
import NavbarLink from 'components/NavbarItems/NavbarLink';
import { useNav } from 'hooks/navbar';
import LoginInfo from 'components/LoginInfo';
import React, { useEffect, useState } from 'react';
import { useAuth } from 'hooks/auth';
import axios from 'axios';
import { api } from 'services/axios';
import { useHistory } from 'react-router-dom';
import COLORS from 'constants/COLORS';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
    MenuItem,
    MenuButton,
    Button,
    Menu,
    MenuList,
} from '@chakra-ui/react';

interface Responsibities {
    activities: boolean;
    events: boolean;
}

export type SideNavProps = {
    activeItemUrl?: string;
};

const NavbarControl: React.FC<SideNavProps> = ({ activeItemUrl }) => {
    const [responsibility, setResponsibility] = useState<Responsibities>({
        activities: false,
        events: false,
    });

    const { user } = useAuth();
    const history = useHistory();

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

    const { items } = useNav();

    const [open, setOpen] = useState(false);

    const renderMenuItems = () => {
        if (!user) {
            return null;
        }

        if (user.level === 9) {
            // Admin
            const basePath = '/dashboard/admin';
            return (
                <>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Edições
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/edicoes')
                                }>
                                Listar edições
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/edicoes/cadastrar')
                                }>
                                Cadastrar edição
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Edições Anteriores
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/edicoes_anteriores')
                                }>
                                Listar edições
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Áreas
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/areas')
                                }>
                                Listar áreas
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/areas/cadastrar')
                                }>
                                Cadastrar área
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Eventos
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/eventos')
                                }>
                                Listar eventos
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/eventos/cadastrar')
                                }>
                                Cadastrar evento
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Salas
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/salas')
                                }>
                                Listar salas
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/salas/cadastrar')
                                }>
                                Cadastrar sala
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Categorias
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/categoria_atividade')
                                }>
                                Listar categorias
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/categoria_atividade/cadastrar')
                                }>
                                Cadastrar categoria
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Usuários
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/usuarios')
                                }>
                                Listar usuários
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/usuarios/cadastrar')
                                }>
                                Cadastrar usuário
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </>
            );
        } else if (responsibility.events) {
            // Organizer
            const basePath = '/dashboard/organizador';
            return (
                <>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Edições
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/edicoes')
                                }>
                                Listar edições
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Edições Anteriores
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/edicoes_anteriores')
                                }>
                                Listar edições
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </>
            );
        } else if (responsibility.activities) {
            // Responsible
            const basePath = '/dashboard/responsavel';
            return (
                <>
                    <Menu>
                        <MenuButton
                            bgColor={COLORS.primary}
                            color={COLORS.white}
                            px={4}
                            py={2}
                            transition="all 0.2s"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'gray.400' }}
                            fontSize="1.5rem"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                        >
                            Atividades
                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                onClick={() =>
                                    history.push(basePath + '/atividades')
                                }>
                                Listar atividades
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </>
            );
        }

    };

    return (
        <>
            {items.length > 0 && (
                <Nav tabIndex={0} onMouseLeave={() => setOpen(false)} role="navigation" aria-label="side-navigation">
                    <StyledBurger open={open} onClick={() => setOpen(!open)}>
                        <div />
                        <div />
                        <div />
                    </StyledBurger>
                    <Bars open={open}>
                        <NavbarLink title={'Eventos'} url={'/home'} active={true}/>
                        {renderMenuItems()}
                        <LoginInfo />
                    </Bars>
                </Nav>
            )}
        </>
    );


};

NavbarControl.propTypes = {
    activeItemUrl: PropTypes.string,
};

export default NavbarControl;

