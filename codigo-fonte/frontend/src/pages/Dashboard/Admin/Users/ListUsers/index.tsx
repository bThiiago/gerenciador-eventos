import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Switch, Tooltip, useToast } from '@chakra-ui/react';
import { DeleteIcon, EditIcon, LockIcon } from '@chakra-ui/icons';
import { Link, useRouteMatch } from 'react-router-dom';

import COLORS from 'constants/COLORS';

import CustomButton from 'components/Button';
import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';

import { People } from 'types/models';
import { api } from 'services/axios';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { GenericFrontError } from 'errors/GenericFrontError';
import TOAST from 'constants/TOAST';
import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';
import { fetchManyUsers } from 'services/fetch/users';
import { maskCpf } from 'utils/maskCpf';
import { ResponseError } from 'errors/ResponseError';
import ConfirmReenableComponent from 'components/ConfirmReenableComponent';

const ListUsers: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const [userList, setUserList] = useState<People[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [userName, setUserName] = useState('');
    const [userShow, setUserShow] = useState<People[]>([]);

    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(-1);

    const [confirmDisableModalOpen, setConfirmDisableModalOpen] =
        useState(false);
    const [idToDisable, setIdToDisable] = useState(-1);

    const [confirmReenableModalOpen, setConfirmReenableModalOpen] =
        useState(false);
    const [idToReenable, setIdToReenable] = useState(-1);

    const { path } = useRouteMatch();

    const source = useRef(createCancelTokenSource());

    const loadUsers = () => {
        source.current = createCancelTokenSource();
        setLoading(true);
        fetchManyUsers(source.current.token, {
            limit: Number.MAX_SAFE_INTEGER,
        })
            .then(({ users }) => {
                setUserList(users);
                setUserShow(users);
            })
            .catch((err) => {
                setError(err.message);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUsers();
        return () => source.current.cancel();
    }, []);

    useEffect(() => {
        const filteredUsers = userList.filter((user) => {
            const lowerCaseName = user.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const lowerCaseUserName = userName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            //função: normalize('NFD').replace(/[\u0300-\u036f]/g, '') serve para ignorar acentos na busca
            if (
                user.email &&
                user.email.toLowerCase().includes(lowerCaseUserName)
            ) {
                return true;
            }

            if (
                user.cpf &&
                user.cpf.toLowerCase().includes(lowerCaseUserName)
            ) {
                return true;
            }

            return lowerCaseName.includes(lowerCaseUserName);
        });

        setUserShow(filteredUsers);
    }, [userName]);


    const handleSearch = () => {
        setUserName(searchTerm);
    };

    const deleteUser = async (id: number) => {
        try {
            await api.delete(`/user/${id}`);

            if (userList) {
                setUserList([...userList.filter((user) => user.id != id)]);
            }

            toast({
                title: 'Usuário deletado',
                status: 'success',
            });
            loadUsers();
        } catch (err) {
            let message = 'Erro não tratado';
            if (err instanceof GenericFrontError) {
                message = err.message;
                if (err instanceof ResponseError) {
                    if (err.status === 408)
                        message =
                            'Esse usuário está ativo no momento, para deletá-lo, desative-o primeiro';
                    if (err.status === 400)
                        message =
                            'Esse usuário organiza um evento ou uma atividade';
                }
            }
            toast({
                title: message,
                status: 'error',
            });
        } finally {
            setConfirmDeleteModalOpen(false);
        }
    };

    const disableUser = async (id: number) => {
        try {
            await api.delete(`/user/disable/${id}`);

            if (userList) {
                setUserList([...userList.filter((user) => user.id != id)]);
            }

            toast({
                title: 'Usuário desativado',
                status: 'success',
            });
            loadUsers();
        } catch (err) {
            let message = 'Erro não tratado';
            if (err instanceof GenericFrontError) {
                message = err.message;
                if (err instanceof ResponseError) {
                    if (err.status === 409)
                        message =
                            'Esse usuário está organizando um evento ou uma atividade no momento';
                }
            }
            toast({
                title: message,
                status: 'error',
            });
        } finally {
            setConfirmDisableModalOpen(false);
        }
    };

    const reenableUser = async (id: number) => {
        try {
            await api.post(`/user/reenable/${id}`);

            if (userList) {
                setUserList([...userList.filter((user) => user.id != id)]);
            }

            toast({
                title: 'Usuário reativado',
                status: 'success',
            });
            loadUsers();
        } catch (err) {
            let message = 'Erro não tratado';
            if (err instanceof GenericFrontError) {
                message = err.message;
                if (err instanceof ResponseError) {
                    if (err.status === 409)
                        message =
                            'Esse usuário não pode ser reativado pois já está ativo';
                }
            }
            toast({
                title: message,
                status: 'error',
            });
        } finally {
            setConfirmReenableModalOpen(false);
        }
    };

    const renderTableElements = () => {
        return userShow && userShow.length > 0 ? (
            userShow.map((user, index) => {
                return (
                    <tr key={index}>
                        <CustomTd>{user.name}</CustomTd>
                        <CustomTd align="center">
                            {user.cpf && maskCpf(user.cpf)}
                        </CustomTd>
                        <CustomTd align="center">{user.email}</CustomTd>
                        <CustomTd align="center">
                            <Switch
                                colorScheme="blue"
                                defaultChecked={user.active}
                                isChecked={user.active}
                                onChange={() => {
                                    if (user.active) {
                                        setIdToDisable(user.id);
                                        setConfirmDisableModalOpen(true);
                                    } else {
                                        setIdToReenable(user.id);
                                        setConfirmReenableModalOpen(true);
                                    }
                                }}
                            />
                        </CustomTd>
                        <CustomTd>
                            <CustomTableButtonWrapper>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.2rem"
                                    label="Alterar dados do usuário"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<EditIcon />}
                                        aria-label="Alterar dados do usuário"
                                        to={path + `/${user.id}/alterar`}
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.2rem"
                                    label="Trocar senha do usuário"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<LockIcon />}
                                        aria-label="Trocar senha do usuário"
                                        to={path + `/${user.id}/alterar_senha`}
                                    />
                                </Tooltip>
                                {!user.active && (
                                    <Tooltip
                                        hasArrow
                                        fontSize="1.2rem"
                                        label="Excluir usuário"
                                    >
                                        <IconButton
                                            variant="ghost"
                                            color="red.600"
                                            fontSize="1.5rem"
                                            icon={<DeleteIcon />}
                                            aria-label="Excluir usuário"
                                            onClick={() => {
                                                setIdToDelete(user.id);
                                                setConfirmDeleteModalOpen(true);
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </CustomTableButtonWrapper>
                        </CustomTd>
                    </tr>
                );
            })
        ) : (
            <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
        );
    };

    return (
        <DashboardPageContent>
            <FormWrapper>
                <ConfirmDeleteComponent
                    modalOpen={confirmDeleteModalOpen}
                    setModalOpen={setConfirmDeleteModalOpen}
                    handleDelete={() => deleteUser(idToDelete)}
                    customTitle="Deletar este usuário?"
                    customMessage="Seus dados serão apagados do sistema."
                />
                <ConfirmDeleteComponent
                    modalOpen={confirmDisableModalOpen}
                    setModalOpen={setConfirmDisableModalOpen}
                    handleDelete={() => disableUser(idToDisable)}
                    customTitle="Desativar este usuário?"
                    customMessage="Ele será impossibilitado de acessar o sistema."
                />
                <ConfirmReenableComponent
                    modalOpen={confirmReenableModalOpen}
                    setModalOpen={setConfirmReenableModalOpen}
                    handleReenable={() => reenableUser(idToReenable)}
                    customTitle="Reativar este usuário?"
                    customMessage="Ele poderá acessar o sistema novamente."
                />
                <PageTitle>Usuários</PageTitle>
                <CustomButton link={'usuarios/cadastrar'}>
                    Cadastrar novo usuário
                </CustomButton>

                {userList && userList.length > 0 && (
                    <div
                        style={{
                            justifyContent: 'left',
                            margin: '2rem auto 3rem',
                        }}
                    >
                        <label htmlFor="search">Pesquisar usuário</label>
                        <input
                            id="search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Pesquise por Nome, E-mail ou CPF."
                            style={{
                                borderRadius: '5px',
                                borderColor: '#bebebe',
                                width: '50%',
                                fontSize: 'max(16px,1em)',
                                backgroundColor: '#fff',
                                minHeight: '3.8rem',
                                padding: '0 1rem',
                            }}
                        />
                        <CustomButton
                            onClick={handleSearch}
                            style={{
                                marginLeft: '20px',
                                padding: '20px'
                            }}
                        >
                            Pesquisar
                        </CustomButton>
                    </div>

                )}

                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : userShow && userShow.length > 0 ? (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>CPF</th>
                                    <th>E-mail</th>
                                    <th>Ativo</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>{!loading && renderTableElements()}</tbody>
                        </CustomTable>
                        {loading && <LoadingSpinner />}
                    </>
                ) : loading ? (
                    <LoadingSpinner />
                ) : (
                    <ErrorMessage>Nenhum resultado encontrado.</ErrorMessage>
                )}
            </FormWrapper>
        </DashboardPageContent >
    );
};

export default ListUsers;
