import React, { useEffect, useRef, useState } from 'react';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';
import * as Yup from 'yup';

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
import getValidationError from 'utils/getValidationErrors';
import { useParams } from 'react-router-dom';
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchManyUsers } from 'services/fetch/users';
import { useHistory } from 'react-router';
import { GenericFrontError } from 'errors/GenericFrontError';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { fetchOneActivity } from 'services/fetch/activities';
import { ActivityType } from 'types/models';
import TextArea from 'components/TextArea';
import Input from 'components/Input';
import { ResponseError } from 'errors/ResponseError';
import { stringifyUserWithCpf } from 'utils/stringifyUserWithCpf';
import GoBackButton from 'components/GoBackButton';
import { activityEditResponsibleSchema } from 'validation/activity';

interface ParamTypes {
    activityId: string;
}

interface FormData {
    title: string;
    description: string;
    vacancy: string;
    workloadInMinutes: string;
    teachingUsers: number[];
}

const EditActivity: React.FC = () => {
    const toast = useToast({
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

    const [submitLoading, setSubmitLoading] = useState(false);

    const history = useHistory();

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
        try {
            formRef.current?.setErrors({});

            await activityEditResponsibleSchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                title: data.title,
                description: data.description,
                vacancy: parseInt(data.vacancy),
                workloadInMinutes: parseInt(data.workloadInMinutes),
            };

            await api.put(`/activity/${activityId}`, request_data);
            toast({
                title: 'Atividade atualizada',
                status: 'info',
            });
            history.goBack();
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                toast({
                    title: error.message,
                    status: 'error',
                });
            }
            setSubmitLoading(false);
        }
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
                        <PageTitle>Atualizar atividade</PageTitle>
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
                                    (r) => ({
                                        label: stringifyUserWithCpf(r),
                                        value: r.id,
                                    })
                                ),
                                activityCategory: {
                                    label: activity.activityCategory
                                        .description,
                                    value: activity.activityCategory.id,
                                },
                            }}
                        >
                            <Input
                                label="Nome da atividade"
                                name="title"
                                placeholder="Ex. Introdução a python, Scrum na prática..."
                            />
                            <TextArea
                                label="Descrição"
                                name="description"
                                rows={3}
                                placeholder="Escreva sobre a atividade (até 5000 caracteres)"
                                maxLength={5000}
                            />
                            <Select
                                label="Ministrantes"
                                name="teachingUsers"
                                isMulti
                                options={users}
                                placeholder="Escolha os ministrantes da atividade"
                            />
                            <Input
                                label="Vagas"
                                name="vacancy"
                                type="number"
                                placeholder="Número de vagas disponíveis para a atividade"
                            />
                            <Input
                                label="Carga horária (em minutos)"
                                name="workloadInMinutes"
                                type="number"
                                placeholder="Carga horária da atividade (aparecerá no certificado)"
                            />
                            <Button
                                disabled={submitLoading}
                                style={{ backgroundColor: COLORS.success }}
                            >
                                Atualizar atividade
                            </Button>
                        </Form>
                    </FormWrapper>
                )
            )}
        </DashboardPageContent>
    );
};

export default EditActivity;
