import React, { useEffect, useRef, useState } from 'react';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';
import * as Yup from 'yup';

import {
    DashboardPageContent,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';
import Input from 'components/Input';
import Select, { SelectOption } from 'components/Select';
import Button from 'components/Button';
import TextArea from 'components/TextArea';
import COLORS from 'constants/COLORS';

import { api } from 'services/axios';
import SelectMultiSchedules from 'components/SelectMultiSchedules';
import getValidationError from 'utils/getValidationErrors';
import { useParams } from 'react-router-dom';
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import { fetchOneEvent } from 'services/fetch/events';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchManyUsers } from 'services/fetch/users';
import { useHistory } from 'react-router';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import handleActivityConflictError from 'utils/handleActivityConflictError';
import { stringifyUserWithCpf } from 'utils/stringifyUserWithCpf';
import { fetchManyCategories } from 'services/fetch/activityCategories';
import GoBackButton from 'components/GoBackButton';
import { activitySchema } from 'validation/activity';

interface ParamTypes {
    eventId: string;
}

interface FormData {
    title: string;
    description: string;
    vacancy: string;
    workloadInMinutes: string;
    responsibleUsers: number[];
    teachingUsers: number[];
    schedules: {
        dateTime: Date;
        durationInMinutes: string;
        room: number;
        url: string;
    }[];
    activityCategory: number;
}

const CreateActivity: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const formRef = useRef<FormHandles>(null);
    const { eventId } = useParams<ParamTypes>();

    const [users, setUsers] = useState<SelectOption[]>([]);
    const [activityCategories, setActivtyCategories] = useState<SelectOption[]>(
        []
    );
    const [eventDates, setEventDates] = useState<[Date, Date]>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [submitLoading, setSubmitLoading] = useState(false);

    const history = useHistory();

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchOneEvent(source.token, eventId)
            .then((event) => {
                setEventDates([
                    event.startDate,
                    event.endDate ? event.endDate : event.startDate,
                ]);
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
                return fetchManyCategories(source.token, {
                    limit: Number.MAX_SAFE_INTEGER,
                });
            })
            .then(({ categories }) => {
                setActivtyCategories(
                    categories.map((category) => {
                        return {
                            value: category.id,
                            label: category.description,
                        };
                    })
                );
            })
            .catch((err) => {
                setError(err.message);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() => setIsLoading(false));
        return () => source.cancel();
    }, []);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        try {
            formRef.current?.setErrors({});            

            await activitySchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                title: data.title,
                description: data.description,
                vacancy: parseInt(data.vacancy),
                workloadInMinutes: parseInt(data.workloadInMinutes),
                responsibleUsers: data.responsibleUsers.map((id) => ({ id })),
                teachingUsers: data.teachingUsers.map((id) => ({ id })),
                schedules: data.schedules.map((schedule) => {
                    const roomNumber = schedule.room as unknown as string;
                    return {
                        startDate: schedule.dateTime.toISOString(),
                        durationInMinutes: schedule.durationInMinutes,
                        room:
                            roomNumber !== ''
                                ? {
                                    id: schedule.room,
                                }
                                : undefined,
                        url: schedule.url !== '' ? schedule.url : undefined,
                    };
                }),
                activityCategory: {
                    id: data.activityCategory,
                },
            };

            await api.post(`/sge/${eventId}/activity`, request_data);
            toast({
                title: 'Atividade cadastrada',
                status: 'success',
            });
            history.goBack();
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409) {
                        const responseMessage = error.response.message;
                        if (
                            responseMessage ===
                            'Ocorreu conflito com o ministrante'
                        ) {
                            message =
                                'Conflito de ministrante: outra atividade no mesmo dia e horário';
                            const description = `Evento ${error.response.data[0].eventName}: "${error.response.data[0].activityName}", ocorre no mesmo horário desta atividade.`;
                            toast({
                                title: message,
                                description,
                                status: 'error',
                                duration: 10000,
                            });
                            return;
                        } else {
                            if (formRef.current?.setErrors)
                                message = handleActivityConflictError(
                                    responseMessage,
                                    error.response.data,
                                    formRef.current.setErrors
                                );
                        }
                    } else message = 'Não foi possível cadastrar a atividade';
                }
                toast({
                    title: message,
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
                <FormWrapper>
                    <PageTitle>Criar uma nova atividade</PageTitle>
                    <GoBackButton />
                    <Form onSubmit={onSubmit} ref={formRef}>
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
                            name="activityCategory"
                            label="Categoria da atividade"
                            options={activityCategories}
                            placeholder="Escolha a categoria da atividade"
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
                        <Select
                            label="Professor responsável"
                            name="responsibleUsers"
                            isMulti
                            options={users}
                            placeholder="Escolha ao menos um professor responsável"
                        />
                        <Select
                            label="Ministrantes"
                            name="teachingUsers"
                            isMulti
                            options={users}
                            placeholder="Escolha os ministrantes da atividade"
                        />
                        <SelectMultiSchedules
                            name="schedules"
                            eventDates={eventDates}
                        />
                        <Button
                            disabled={submitLoading}
                            style={{ backgroundColor: COLORS.success }}
                        >
                            Cadastrar atividade
                        </Button>
                    </Form>
                </FormWrapper>
            )}
        </DashboardPageContent>
    );
};

export default CreateActivity;
