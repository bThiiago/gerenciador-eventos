import React, { useEffect, useRef, useState } from 'react';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';

import {
    DashboardPageContent,
    FormWrapper,
    PageSubtitle,
    PageTitle,
} from 'custom-style-components';
import Select, { SelectOption } from 'components/Select';
import Button from 'components/Button';
import COLORS from 'constants/COLORS';

import { api } from 'services/axios';
import { useParams } from 'react-router-dom';
import { useToast, UseToastOptions } from '@chakra-ui/react';
import TOAST from 'constants/TOAST';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchManyUsers } from 'services/fetch/users';
import { GenericFrontError } from 'errors/GenericFrontError';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { fetchOneActivity } from 'services/fetch/activities';
import { ActivityType } from 'types/models';
import { ResponseError } from 'errors/ResponseError';
import { stringifyUserWithCpf } from 'utils/stringifyUserWithCpf';
import GoBackButton from 'components/GoBackButton';

interface ParamTypes {
    activityId: string;
}

interface FormData {
    users: number[];
}

const EditActivity: React.FC = () => {
    const toastId = 'activity-card';
    const toast = useToast({
        id: toastId,
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const formRef = useRef<FormHandles>(null);
    const { activityId } = useParams<ParamTypes>();

    const [users, setUsers] = useState<SelectOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activity, setActivity] = useState<ActivityType>();
    const [error, setError] = useState(null);

    const [submitIsLoading, setSubmitIsLoading] = useState(false);

    const toaster = (options: UseToastOptions) => {
        if (toast.isActive(toastId)) {
            toast.close(toastId);
            setTimeout(() => toast(options), 150);
        } else {
            toast(options);
        }
    };

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchOneActivity(source.token, activityId)
            .then((activity) => {
                setActivity(activity);
                return fetchManyUsers(source.token, {
                    limit: Number.MAX_SAFE_INTEGER,
                });
            })
            .then(({ users }) => {
                setUsers(
                    users.map((user) => {
                        return {
                            value: user.id,
                            label: stringifyUserWithCpf(user),
                        };
                    })
                );
            })
            .catch((err) => {
                let message = err.message;
                if (err instanceof ResponseError && err.status === 404)
                    message = 'Atividade não encontrada';
                setError(message);
                toast({
                    title: message,
                    status: 'error',
                });
            })
            .finally(() => setIsLoading(false));
        return () => source.cancel();
    }, []);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitIsLoading(true);
        api.post(`/activity/registry/add/${activityId}/${data.users}`)
            .then(() => {
                toaster({
                    title: 'Inscrito!',
                    status: 'success',
                });
            })
            .catch((err) => {
                let message = 'Erro inesperado';
                if (err instanceof GenericFrontError) {
                    message = err.message;
                    if (err instanceof ResponseError && err.status === 409) {
                        message =
                            'Conflito de inscrição: outra atividade no mesmo dia e horário';
                        const description = `Evento ${err.response.data[0].eventName}: você está inscrito na atividade "${err.response.data[0].activityName}", que ocorre no mesmo horário desta atividade`;
                        toaster({
                            title: message,
                            description,
                            status: 'error',
                            duration: 10000,
                        });
                        return;
                    } else if (
                        err instanceof ResponseError &&
                        err.status === 400
                    ) {
                        message =
                            'Este usuário já está inscrito nesta atividade';
                    } else if (
                        err instanceof ResponseError &&
                        err.status === 403
                    ) {
                        message =
                            'Selecione um usuário para realizar a inscrição';
                    } else if (
                        err instanceof ResponseError &&
                        err.status === 401
                    ) {
                        message =
                            'O evento está invisível, portanto não é possível realizar inscrições';
                    } else {
                        message;
                    }
                }
                toaster({
                    title: message,
                    status: 'error',
                });
            })
            .finally(() => setSubmitIsLoading(false));
    };

    return (
        <DashboardPageContent>
            {error ? (
                <ErrorMessage>{error}</ErrorMessage>
            ) : isLoading ? (
                <LoadingSpinner />
            ) : (
                activity && (
                    <FormWrapper>
                        <PageTitle>Adicionar Participante</PageTitle>
                        <PageSubtitle>{activity.title}</PageSubtitle>
                        <GoBackButton />
                        <Form
                            onSubmit={onSubmit}
                            ref={formRef}
                            initialData={{
                                title: activity.title,
                                description: activity.description,
                                vacancy: activity.vacancy,
                                workloadInMinutes: activity.workloadInMinutes,
                                teachingUsers: activity.teachingUsers?.map(
                                    (t) => ({
                                        label: stringifyUserWithCpf(t),
                                        value: t.id,
                                    })
                                ),
                                activityCategory: {
                                    label: activity.activityCategory
                                        .description,
                                    value: activity.activityCategory.id,
                                },
                            }}
                        >
                            <Select
                                name="users"
                                label="Participante"
                                options={users}
                                placeholder="Escolha o participante"
                            />
                            <Button
                                disabled={submitIsLoading}
                                style={{ backgroundColor: COLORS.success }}
                            >
                                Adicionar Participante
                            </Button>
                        </Form>
                    </FormWrapper>
                )
            )}
        </DashboardPageContent>
    );
};

export default EditActivity;
