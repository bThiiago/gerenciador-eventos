import React, { ChangeEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FiltersWrapper,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';

import { ActivityCategory, ActivityType } from 'types/models';

import { IconButton, Select, Tooltip, useToast } from '@chakra-ui/react';
import {
    CheckCircleIcon,
    CheckIcon,
    CloseIcon,
    DownloadIcon,
    InfoIcon,
} from '@chakra-ui/icons';
import COLORS from 'constants/COLORS';
import { stringifySchedule } from 'utils/stringifySchedule';
import {
    fetchManyOldActivitiesByUser,
    fetchOneActivity,
} from 'services/fetch/activities';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import TOAST from 'constants/TOAST';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { useAuth } from 'hooks/auth';
import { fetchManyRegistriesByActivity } from 'services/fetch/registries';
import {
    downloadRegistryPdf,
} from 'utils/reportUtils';
import { fetchManyCategories } from 'services/fetch/activityCategories';

const ListActivities: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const { user } = useAuth();

    const [categoryList, setCategoryList] = useState<ActivityCategory[]>();
    const [activityList, setActivityList] = useState<ActivityType[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfDownload, setPdfDownload] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<number>();

    const { pathname } = useLocation();

    const downloadPdf = (activityId: number) => {
        toast({
            title: 'Baixando PDF...',
            duration: 2000,
        });
        setPdfDownload(true);
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
            })
            .finally(() => setPdfDownload(false));
    };

    const downloadActivityDetails = (activityId: number) => {
        toast({
            title: 'Baixando txt...',
            duration: 2000,
        });
        setPdfDownload(true);
        const source = createCancelTokenSource();
        let activity: ActivityType;
        fetchOneActivity(source.token, activityId.toString())
            .then((result) => {
                activity = result;

                const txt =
                    `Título:\n${activity.title}\n\n` +
                    `Descrição:\n${activity.description}\n\n` +
                    `Carga Horária:\n${activity.workloadInMinutes} minutos\n\n` +
                    `Locais:\n${activity.schedules
                        .map((roomsList) => `${roomsList.room.code}`)
                        .join('\n')}\n\n` +
                    `Início/fim das inscrições:\n${activity.event.registryStartDate?.toLocaleDateString()}\n${activity.event.registryEndDate?.toLocaleDateString()}\n\n` +
                    `Data/hora:\n${activity.schedules
                        .map((roomsList) => `${stringifySchedule(roomsList)}`)
                        .join('\n')}\n\n` +
                    `Responsáveis da Atividade:\n${activity.teachingUsers
                        ?.map((teachers) => `${teachers.name}`)
                        .join('\n')}\n\n` +
                    `Vagas:\n${activity.vacancy}`;

                const element = document.createElement('a');
                const file = new Blob([txt], {
                    type: 'text/plain',
                });
                element.href = URL.createObjectURL(file);
                element.download = 'detalhes_atividade.txt';
                document.body.appendChild(element);
                element.click();
            })
            .finally(() => setPdfDownload(false));
    };

    useEffect(() => {
        const source = createCancelTokenSource();

        fetchManyCategories(source.token, { limit: Number.MAX_SAFE_INTEGER })
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

        return () => source.cancel();
    }, []);

    useEffect(() => {
        const source = createCancelTokenSource();
        setLoading(true);
        if (user) {
            fetchManyOldActivitiesByUser(source.token, user.id.toString(), {
                limit: Number.MAX_SAFE_INTEGER,
                category: selectedCategory,
            })
                .then(({ activities }) => {
                    setActivityList(activities);
                })
                .catch((err) => {
                    setError(err.message);
                    toast({
                        title: err.message,
                        status: 'error',
                    });
                })
                .finally(() => setLoading(false));
        }
        return () => source.cancel();
    }, [selectedCategory]);

    const renderTableElements = () => {
        return activityList && activityList.length > 0 ? (
            activityList.map((activity, index) => {
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
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Baixar detalhes da atividade"
                                >
                                    <IconButton
                                        disabled={pdfDownload}
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primary}
                                        icon={<InfoIcon />}
                                        aria-label="Baixar detalhes da atividade"
                                        onClick={() => {
                                            downloadActivityDetails(
                                                activity.id
                                            );
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip
                                    hasArrow
                                    fontSize="1.3rem"
                                    label="Baixar relatório de presenças"
                                >
                                    <IconButton
                                        disabled={pdfDownload}
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primary}
                                        icon={<DownloadIcon />}
                                        aria-label="Baixar relatório de presenças"
                                        onClick={() => {
                                            downloadPdf(activity.id);
                                        }}
                                    />
                                </Tooltip>
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

    function onChangeCategory(ev: ChangeEvent<HTMLSelectElement>) {
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
    }

    return (
        <DashboardPageContent>
            <FormWrapper>
                <PageTitle>
                    Atividades de eventos que já ocorreram
                </PageTitle>
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : (
                    <>
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
                                    Não foi possível carregar a lista de
                                    categorias
                                </span>
                            )}
                        </FiltersWrapper>
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
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default ListActivities;
