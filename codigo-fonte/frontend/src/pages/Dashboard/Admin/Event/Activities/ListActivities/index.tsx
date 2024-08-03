import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FiltersWrapper,
    FormWrapper,
    PageSubtitle,
    PageTitle,
} from 'custom-style-components';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import { api } from 'services/axios';
import {
    fetchManyActivitiesByEvent,
    fetchOneActivity,
} from 'services/fetch/activities';
import { fetchManyCategories } from 'services/fetch/activityCategories';
import { fetchOneEvent } from 'services/fetch/events';
import { fetchManyRegistriesByActivity } from 'services/fetch/registries';
import { ActivityCategory, ActivityType, EventType } from 'types/models';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import renderEventName from 'utils/renderEventName';
import { stringifySchedule } from 'utils/stringifySchedule';

import CustomButton from 'components/Button';
import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';
import ErrorMessage from 'components/ErrorMessage';
import GoBackButton from 'components/GoBackButton';
import LoadingSpinner from 'components/LoadingSpinner';

import {
    AddIcon,
    CheckCircleIcon,
    CheckIcon,
    CloseIcon,
    DeleteIcon,
    EditIcon,
} from '@chakra-ui/icons';
import { IconButton, Select, Tooltip, useToast } from '@chakra-ui/react';

import COLORS from 'constants/COLORS';
import TOAST from 'constants/TOAST';
import {
    downloadRegistryXls,
    downloadRegistryPdf,
    downloadPresenceListPdf,
    downloadMinistrantsXls
} from 'utils/reportUtils';

interface ParamTypes {
    eventId: string;
}

const ListActivities: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const { eventId } = useParams<ParamTypes>();

    const [event, setEvent] = useState<EventType>();
    const [categoryList, setCategoryList] = useState<ActivityCategory[]>();

    const [activityName, setActivityName] = useState('');
    const [activityList, setActivityList] = useState<ActivityType[]>([]);
    const [activityShow, setActivityShow] = useState<ActivityType[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { pathname } = useLocation();

    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(-1);

    const [selectedCategory, setSelectedCategory] = useState<number>();

    const source = useRef(createCancelTokenSource());

    const downloadXls = (activityId: number, extension: 'xls' | 'xlsx') => {
        toast({
            title: 'Baixando presença .' + extension,
            duration: 2000,
        });
        const source = createCancelTokenSource();
        let activity: ActivityType;
        fetchOneActivity(source.token, activityId.toString())
            .then((result) => {
                activity = result;
                return fetchManyRegistriesByActivity(
                    source.token,
                    activityId.toString(),
                    {
                        limit: Number.MAX_SAFE_INTEGER,
                    }
                );
            })
            .then(({ registries }) => {
                downloadRegistryXls(activity, registries, extension);
            });
    };

    const downloadPdf = (activityId: number) => {
        toast({
            title: 'Baixando relatório .pdf',
            duration: 2000,
        });
        const source = createCancelTokenSource();
        let activity: ActivityType;
        fetchOneActivity(source.token, activityId.toString())
            .then((result) => {
                activity = result;
                return fetchManyRegistriesByActivity(
                    source.token,
                    activityId.toString(),
                    {
                        limit: Number.MAX_SAFE_INTEGER,
                    }
                );
            })
            .then(({ registries }) => {
                downloadRegistryPdf(activity, registries);
            });
    };

    const downloadXlsMinisters = (activityId: number, extension: 'xls' | 'xlsx') => {
        toast({
            title: 'Baixando ministrantes .' + extension,
            duration: 2000,
        });
        const source = createCancelTokenSource();
        let activity: ActivityType;
        fetchOneActivity(source.token, activityId.toString())
            .then((result) => {
                activity = result;
                console.log(result);
                downloadMinistrantsXls(activity, extension);
                
            });  
    };

    const downloadPdfPresence = (activityId: number) => {
        toast({
            title: 'Baixando lista de presença .pdf',
            duration: 2000,
        });
        const source = createCancelTokenSource();
        let activity: ActivityType;
        fetchOneActivity(source.token, activityId.toString())
            .then((result) => {
                activity = result;
                return fetchManyRegistriesByActivity(
                    source.token,
                    activityId.toString(),
                    {
                        limit: Number.MAX_SAFE_INTEGER,
                    }
                );
            })
            .then(({ registries }) => {
                downloadPresenceListPdf(activity, registries);
            });
    };

    const downloadPdfActivities = () => {
        for (let i = 0; i < activityList.length; i++) {
            downloadPdf(activityList[i].id);
        }
    };

    const downloadPdfActivitiesPresenceList = () => {
        for (let i = 0; i < activityList.length; i++) {
            downloadPdfPresence(activityList[i].id);
        }
    };

    const downloadXlsActivities = (extension: 'xls' | 'xlsx') => {
        for (let i = 0; i < activityList.length; i++) {
            downloadXls(activityList[i].id, extension);
        }
    };

    const downloadMinisters = (extension: 'xls' | 'xlsx') => {
        for (let i = 0; i < activityList.length; i++) {
            downloadXlsMinisters(activityList[i].id, extension);
        }
    };

    const loadActivities = () => {
        source.current = createCancelTokenSource();
        setLoading(true);
        fetchOneEvent(source.current.token, eventId)
            .then((event) => {
                setEvent(event);
                return fetchManyActivitiesByEvent(
                    source.current.token,
                    eventId,
                    {
                        limit: Number.MAX_SAFE_INTEGER,
                        category: selectedCategory,
                    }
                );
            })
            .then(({ activities }) => {
                setActivityList(activities);
                setActivityShow(activities);
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
        fetchManyCategories(source.current.token, {
            limit: Number.MAX_SAFE_INTEGER,
        })
            .then((result) => {
                setCategoryList(result.categories);
            })
            .catch((err) => {
                setError(err.message);
                toast({
                    title: err.message,
                    status: 'error',
                });
            });
    }, []);

    useEffect(() => {
        loadActivities();
        return () => source.current.cancel();
    }, [selectedCategory]);

    useEffect(() => {
        const filteredActivity = activityList.filter((activity) => {
            const lowerCaseName = activity.title.toLowerCase();
            const lowerCaseActivityName = activityName.toLowerCase();

            if (
                activity.title &&
                activity.title.toLowerCase().includes(lowerCaseActivityName)
            ) {
                return true;
            }

            if (
                activity.activityCategory.description &&
                activity.activityCategory.description
                    .toLowerCase()
                    .includes(lowerCaseActivityName)
            ) {
                return true;
            }

            return lowerCaseName.includes(lowerCaseActivityName);
        });

        setActivityShow(filteredActivity);
    }, [activityName]);

    const deleteActivity = async (id: number) => {
        try {
            await api.delete(`/activity/${eventId}/${id}`);
            if (activityList) {
                setActivityList([
                    ...activityList.filter((act) => act.id != id),
                ]);
                toast({
                    title: 'Atividade excluida',
                    description: `Exclusão da atividade ${id}`,
                    status: 'success',
                });
            }
            loadActivities();
        } catch (err) {
            let message = 'Erro';
            if (err instanceof GenericFrontError) {
                message = err.message;
                if (err instanceof ResponseError && err.status === 404)
                    message = 'Atividade não encontrada';
                if (err instanceof ResponseError && err.status === 400)
                    message =
                        'O evento desta atividade está acontecendo, não é possível excluí-la';
            }
            toast({
                title: 'Erro na exclusão',
                description: message,
                status: 'error',
            });
        } finally {
            setConfirmDeleteModalOpen(false);
        }
    };

    const renderTableElements = () => {
        return activityShow && activityShow.length > 0 ? (
            activityShow.map((activity, index) => {
                return (
                    <tr key={index}>
                        <CustomTd>{activity.title}</CustomTd>
                        <CustomTd align="center">
                            {activity.schedules?.map((schedule, index) => {
                                return (
                                    <div key={index}>
                                        {stringifySchedule(schedule)}
                                    </div>
                                );
                            })}
                        </CustomTd>
                        <CustomTd align="center">
                            {activity.responsibleUsers?.map(
                                (responsible, index) => (
                                    <div key={index}>{responsible.name}</div>
                                )
                            )}
                        </CustomTd>
                        <CustomTd align="center">
                            {activity.teachingUsers &&
                                activity.teachingUsers.length > 0
                                ? activity.teachingUsers?.map(
                                    (teacher, index) => (
                                        <div key={index}>{teacher.name}</div>
                                    )
                                )
                                : 'Sem ministrantes'}
                        </CustomTd>
                        <CustomTd align="center">
                            {activity.activityCategory.description}
                        </CustomTd>
                        <CustomTd align="center">
                            {activity.readyForCertificateEmission ? (
                                <CheckIcon color={COLORS.success} />
                            ) : (
                                <CloseIcon color={COLORS.danger} />
                            )}
                        </CustomTd>
                        <CustomTd>
                            <CustomTableButtonWrapper>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Alterar dados"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primaryContrast}
                                        as={Link}
                                        icon={<EditIcon />}
                                        aria-label="Alterar dados"
                                        to={
                                            pathname + `/${activity.id}/alterar`
                                        }
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Adicionar participantes na atividade"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primary}
                                        as={Link}
                                        icon={<AddIcon />}
                                        aria-label="Adicionar participantes na atividade"
                                        to={
                                            pathname +
                                            `/${activity.id}/adicionar`
                                        }
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Presenças"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primary}
                                        as={Link}
                                        icon={<CheckCircleIcon />}
                                        aria-label="Presenças"
                                        to={
                                            pathname +
                                            `/${activity.id}/presencas`
                                        }
                                    />
                                </Tooltip>
                                {activity.totalRegistry != null &&
                                    activity.totalRegistry <= 0 && (
                                    <Tooltip
                                        hasArrow
                                        fontSize="1.2rem"
                                        label="Excluir atividade"
                                    >
                                        <IconButton
                                            variant="ghost"
                                            color={COLORS.danger}
                                            fontSize="1.5rem"
                                            icon={<DeleteIcon />}
                                            aria-label="Excluir atividade"
                                            onClick={() => {
                                                setIdToDelete(activity.id);
                                                setConfirmDeleteModalOpen(
                                                    true
                                                );
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

    let timeout: number;

    const onChangeCategory = (ev: ChangeEvent<HTMLSelectElement>) => {
        if (ev.target.value != undefined) {
            setLoading(true);

            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
                setSelectedCategory(
                    ev.target.value === ''
                        ? undefined
                        : parseInt(ev.target.value)
                );
            }, 200);
        }
    };

    return (
        <DashboardPageContent>
            <FormWrapper>
                <ConfirmDeleteComponent
                    modalOpen={confirmDeleteModalOpen}
                    setModalOpen={setConfirmDeleteModalOpen}
                    handleDelete={() => deleteActivity(idToDelete)}
                />
                <PageTitle>Atividades</PageTitle>
                <PageSubtitle>{event && renderEventName(event)}</PageSubtitle>
                <GoBackButton />
                <CustomButton
                    link={pathname + '/criar_atividade'}
                    style={{
                        marginBottom: '0.8rem',
                        marginLeft: '0.8rem',
                    }}
                >
                    Cadastrar nova atividade
                </CustomButton>
                <FiltersWrapper>
                    {categoryList && categoryList.length ? (
                        <div className="select">
                            <span>Categorias</span>
                            <Select
                                background="white"
                                size="bg"
                                placeholder="Todas as categorias"
                                variant="outline"
                                onChange={onChangeCategory}
                                style={{
                                    borderRadius: '5px',
                                    borderColor: '#bebebe',
                                    fontSize: 'max(16px,1em)',
                                    backgroundColor: '#fff',
                                    minHeight: '3.8rem',
                                    padding: '0 1rem',
                                }}
                            >
                                {categoryList.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.description}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    ) : (
                        <span>
                            Não foi possível carregar a lista de categorias
                        </span>
                    )}
                </FiltersWrapper>

                {activityList && activityList.length > 0 && (
                    <div
                        style={{
                            justifyContent: 'left',
                            margin: '2rem auto 3rem',
                        }}
                    >
                        <label htmlFor="search">Pesquisar atividades</label>
                        <input
                            id="search"
                            type="text"
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            placeholder="Pesquise por nome"
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
                ) : activityShow && activityShow.length > 0 ? (
                    <>
                        <CustomButton
                            style={{ marginLeft: '0.8rem', float: 'right' }}
                            onClick={() => {
                                downloadXlsActivities('xls');
                            }}
                        >
                            Presenças .XLS
                        </CustomButton>
                        <CustomButton
                            style={{ marginLeft: '0.8rem', float: 'right' }}
                            onClick={() => {
                                downloadXlsActivities('xlsx');
                            }}
                        >
                            Presenças .XLSX
                        </CustomButton>
                        <CustomButton
                            style={{ marginLeft: '0.8rem', float: 'right' }}
                            onClick={() => {
                                downloadMinisters('xls');
                            }}
                        >
                            Ministrantes .XLS
                        </CustomButton>
                        <CustomButton
                            style={{ marginLeft: '0.8rem', float: 'right' }}
                            onClick={() => {
                                downloadMinisters('xlsx');
                            }}
                        >
                            Ministrantes .XLSX
                        </CustomButton>
                        <CustomButton
                            style={{ marginLeft: '0.8rem', float: 'right' }}
                            onClick={() => {
                                downloadPdfActivitiesPresenceList();
                            }}
                        >
                            Baixar Listas de Presenças
                        </CustomButton>
                        <CustomButton
                            style={{ marginLeft: '0.8rem', float: 'right' }}
                            onClick={() => {
                                downloadPdfActivities();
                            }}
                        >
                            Baixar Relatórios
                        </CustomButton>
                        <CustomTable>
                            <thead>
                                <tr>
                                    <th>Nome da atividade</th>
                                    <th>Horários</th>
                                    <th>Professor responsável</th>
                                    <th>Ministrantes</th>
                                    <th>Categoria</th>
                                    <th>Presenças emitidas</th>
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

export default ListActivities;
