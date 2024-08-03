import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Tooltip, useToast } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Link, useRouteMatch } from 'react-router-dom';

import COLORS from 'constants/COLORS';

import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';
import CustomButton from 'components/Button';
import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';

import { EventArea } from 'types/models';
import { api } from 'services/axios';
import { fetchManyAreas } from 'services/fetch/eventAreas';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import createCancelTokenSource from 'utils/createCancelTokenSource';

const ListEventAreas: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const [areaName, setAreaName] = useState('');
    const [areaShow, setAreaShow] = useState<EventArea[]>([]);
    const [areaList, setAreaList] = useState<EventArea[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(-1);

    const { path } = useRouteMatch();
    const source = useRef(createCancelTokenSource());

    const loadAreas = () => {
        source.current = createCancelTokenSource();
        setLoading(true);
        fetchManyAreas(source.current.token, {
            limit: Number.MAX_SAFE_INTEGER,
        })
            .then(({ areas }) => {
                setAreaList(areas);
                setAreaShow(areas);
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
        loadAreas();
        return () => source.current.cancel();
    }, []);

    useEffect(() => {
        const filteredArea = areaList.filter((area) => {
            const lowerCaseName = area.name.toLowerCase();
            const lowerCaseAreaName = areaName.toLowerCase();

            if (
                area.name &&
                area.name.toLowerCase().includes(lowerCaseAreaName)
            ) {
                return true;
            }

            if (
                area.sigla &&
                area.sigla.toLowerCase().includes(lowerCaseAreaName)
            ) {
                return true;
            }

            return lowerCaseName.includes(lowerCaseAreaName);
        });

        setAreaShow(filteredArea);
    }, [areaName]);

    const deleteArea = async (id: number) => {
        try {
            await api.delete(`/event_area/${id}`);

            if (areaList) {
                setAreaList([...areaList.filter((area) => area.id != id)]);
            }

            toast({
                title: 'Área excluída',
                status: 'success',
            });
            loadAreas();
        } catch (err) {
            if (err instanceof GenericFrontError) {
                toast({
                    title: err.message,
                    status: 'error',
                });
            }
        } finally {
            setConfirmDeleteModalOpen(false);
        }
    };

    const renderTableElements = () => {
        return areaShow && areaShow.length > 0 ? (
            areaShow.map((item, index) => {
                return (
                    <tr key={index}>
                        <CustomTd align="center">{item.name}</CustomTd>
                        <CustomTd align="center">{item.sigla}</CustomTd>
                        <CustomTd>
                            <CustomTableButtonWrapper>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.2rem"
                                    label="Alterar área"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<EditIcon />}
                                        aria-label="Alterar dados"
                                        to={path + `/${item.id}/alterar`}
                                    />
                                </Tooltip>
                                {item.canExclude && (
                                    <Tooltip
                                        hasArrow
                                        fontSize="1.2rem"
                                        label="Excluir área"
                                    >
                                        <IconButton
                                            variant="ghost"
                                            color={COLORS.danger}
                                            fontSize="1.5rem"
                                            icon={<DeleteIcon />}
                                            aria-label="Excluir área"
                                            onClick={() => {
                                                setIdToDelete(item.id);
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
                    handleDelete={() => deleteArea(idToDelete)}
                />
                <PageTitle>Áreas</PageTitle>
                <CustomButton link={'areas/cadastrar'}>
                    Cadastrar nova área
                </CustomButton>

                {areaList && areaList.length > 0 && (
                    <div
                        style={{
                            justifyContent: 'left',
                            margin: '2rem auto 3rem',
                        }}
                    >
                        <label htmlFor="search">Pesquisar área de Evento</label>
                        <input
                            id="search"
                            type="text"
                            value={areaName}
                            onChange={(e) => setAreaName(e.target.value)}
                            placeholder="Pesquise por nome ou sigla."
                            style={{
                                borderRadius: '5px',
                                borderColor: '#bebebe',
                                width: '100%',
                                fontSize: 'max(16px,1em)',
                                backgroundColor: '#fff',
                                minHeight: '3.8rem',
                                padding: '0 1rem',
                            }}
                        />
                    </div>
                )}

                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : areaShow && areaShow.length > 0 ? (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Sigla</th>
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
        </DashboardPageContent>
    );
};

export default ListEventAreas;
