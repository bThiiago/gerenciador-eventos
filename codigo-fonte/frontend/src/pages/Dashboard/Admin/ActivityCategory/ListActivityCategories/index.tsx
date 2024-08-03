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

import { ActivityCategory } from 'types/models';
import { api } from 'services/axios';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { fetchManyCategories } from 'services/fetch/activityCategories';
import createCancelTokenSource from 'utils/createCancelTokenSource';

const ListActivityCategories: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const [categoryName, setCategoryName] = useState('');
    const [categoryShow, setCategoryShow] = useState<ActivityCategory[]>([]);
    const [categoryList, setCategoryList] = useState<ActivityCategory[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(-1);

    const { path } = useRouteMatch();
    const source = useRef(createCancelTokenSource());

    const loadCategories = () => {
        source.current = createCancelTokenSource();
        setLoading(true);
        fetchManyCategories(source.current.token, {
            limit: Number.MAX_SAFE_INTEGER,
        })
            .then(({ categories }) => {
                setCategoryList(categories);
                setCategoryShow(categories);
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
        loadCategories();
        return () => source.current.cancel();
    }, []);

    useEffect(() => {
        const filteredCategory = categoryList.filter((category) => {
            const lowerCaseName = category.code.toLowerCase();
            const lowerCaseCategoryName = categoryName.toLowerCase();

            if (
                category.code &&
                category.code.toLowerCase().includes(lowerCaseCategoryName)
            ) {
                return true;
            }

            if (
                category.description &&
                category.description
                    .toLowerCase()
                    .includes(lowerCaseCategoryName)
            ) {
                return true;
            }

            return lowerCaseName.includes(lowerCaseCategoryName);
        });

        setCategoryShow(filteredCategory);
    }, [categoryName]);

    const deleteCategory = async (id: number) => {
        try {
            await api.delete(`/activity_category/${id}`);

            if (categoryList) {
                setCategoryList([
                    ...categoryList.filter((category) => category.id != id),
                ]);
            }

            toast({
                title: 'Categoria da atividade excluída',
                status: 'success',
            });
            loadCategories();
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
        return categoryShow && categoryShow.length > 0 ? (
            categoryShow.map((item, index) => {
                return (
                    <tr key={index}>
                        <CustomTd align="center">{item.code}</CustomTd>
                        <CustomTd align="center">{item.description}</CustomTd>
                        <CustomTd align="center">
                            <CustomTableButtonWrapper>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.2rem"
                                    label="Alterar categoria"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<EditIcon />}
                                        aria-label="Alterar categoria"
                                        to={path + `/${item.id}/alterar`}
                                    />
                                </Tooltip>
                                {item.canExclude && (
                                    <Tooltip
                                        hasArrow
                                        fontSize="1.2rem"
                                        label="Excluir categoria"
                                    >
                                        <IconButton
                                            variant="ghost"
                                            color={COLORS.danger}
                                            fontSize="1.5rem"
                                            icon={<DeleteIcon />}
                                            aria-label="Excluir categoria"
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
                    handleDelete={() => deleteCategory(idToDelete)}
                />
                <PageTitle>Categorias de atividade</PageTitle>
                <CustomButton link={'categoria_atividade/cadastrar'}>
                    Cadastrar nova categoria de atividade
                </CustomButton>

                <div
                    style={{
                        justifyContent: 'left',
                        margin: '2rem auto 3rem',
                    }}
                >
                    <label htmlFor="search">
                        Pesquisar categoria de Atividade
                    </label>
                    <input
                        id="search"
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Pesquise por código ou descrição"
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

                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : categoryShow && categoryShow.length > 0 ? (
                    <>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Descrição</th>
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

export default ListActivityCategories;
