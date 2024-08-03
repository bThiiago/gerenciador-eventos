import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
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

import { ActivityCategory, ActivityType, EventType } from 'types/models';

import { IconButton, Select, Tooltip, useToast } from '@chakra-ui/react';
import { stringifySchedule } from 'utils/stringifySchedule';
import { fetchManyOldActivitiesByEvent } from 'services/fetch/activities';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import TOAST from 'constants/TOAST';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import GoBackButton from 'components/GoBackButton';
import { CheckIcon, CloseIcon, InfoIcon } from '@chakra-ui/icons';
import COLORS from 'constants/COLORS';
import { fetchManyCategories } from 'services/fetch/activityCategories';
import { fetchOneEvent } from 'services/fetch/events';
import renderEventName from 'utils/renderEventName';

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

    const [categoryList, setCategoryList] = useState<ActivityCategory[]>();
    const [activityList, setActivityList] = useState<ActivityType[]>();
    const [event, setEvent] = useState<EventType>();

    const [selectedCategory, setSelectedCategory] = useState<number>();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const source = useRef(createCancelTokenSource());

    useEffect(() => {
        source.current = createCancelTokenSource();
        fetchOneEvent(source.current.token, eventId)
            .then((event) => {
                setEvent(event);
                return fetchManyCategories(source.current.token, {
                    limit: Number.MAX_SAFE_INTEGER,
                });
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

    const { pathname } = useLocation();

    useEffect(() => {
        source.current = createCancelTokenSource();
        setLoading(true);
        fetchManyOldActivitiesByEvent(source.current.token, eventId, {
            limit: Number.MAX_SAFE_INTEGER,
            category: selectedCategory,
        })
            .then(({ oldActivities }) => {
                setActivityList(oldActivities);
            })
            .catch((err) => {
                setError(err.message);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() => setLoading(false));
        return () => source.current.cancel();
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
                                (responsible, index) => {
                                    return (
                                        <div key={index}>
                                            {responsible.name}
                                        </div>
                                    );
                                }
                            )}
                        </CustomTd>
                        <CustomTd align="center">
                            {activity.teachingUsers?.map((teaching, index) => {
                                return <div key={index}>{teaching.name}</div>;
                            })}
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
                                    label="Lista de inscritos"
                                >
                                    <IconButton
                                        variant="ghost"
                                        fontSize="1.5rem"
                                        fontWeight="bold"
                                        color={COLORS.primary}
                                        as={Link}
                                        icon={<InfoIcon />}
                                        aria-label="Presenças"
                                        to={
                                            pathname +
                                            `/${activity.id}/inscritos`
                                        }
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

    const onChangeCategory = (ev: ChangeEvent<HTMLSelectElement>) => {
        if (ev.target.value != undefined) {
            setLoading(true);

            if (timeout) {
                clearTimeout(timeout);
            }

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
                <PageTitle>Atividades anteriores</PageTitle>
                <PageSubtitle>{event && renderEventName(event)}</PageSubtitle>
                <GoBackButton />
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

                                    <th>Responsáveis</th>

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
