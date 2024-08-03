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
import CustomButton from 'components/Button';
import COLORS from 'constants/COLORS';

import { api } from 'services/axios';
import SelectMultiSchedules from 'components/SelectMultiSchedules';
import getValidationError from 'utils/getValidationErrors';
import { useParams } from 'react-router-dom';
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchManyUsers } from 'services/fetch/users';
import { useHistory } from 'react-router';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { fetchOneActivity } from 'services/fetch/activities';
import { ActivityType } from 'types/models';
import handleActivityConflictError from 'utils/handleActivityConflictError';
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from '@chakra-ui/modal';
import { stringifyUserWithCpf } from 'utils/stringifyUserWithCpf';
import { fetchManyCategories } from 'services/fetch/activityCategories';
import GoBackButton from 'components/GoBackButton';
import TextArea from 'components/TextArea';
import Input from 'components/Input';
import {activityEditSchema} from 'validation/activity';

interface ParamTypes {
    eventId: string;
    activityId: string;
}

interface FormData {
    title: string;
    description: string;
    responsibleUsers: number[];
    teachingUsers: number[];
    vacancy: string;
    workloadInMinutes: string;
    schedules: {
        id: number;
        dateTime: Date;
        durationInMinutes: string;
        room: number;
        url: string;
    }[];
    activityCategory: number;
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
    const [activityCategories, setActivtyCategories] = useState<SelectOption[]>(
        []
    );
    const [eventDates, setEventDates] = useState<[Date, Date]>();
    const [isLoading, setIsLoading] = useState(true);
    const [requestData, setRequestData] = useState<any>();
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [activity, setActivity] = useState<ActivityType>();
    const [error, setError] = useState(null);

    const [submitLoading, setSubmitLoading] = useState(false);

    const history = useHistory();

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchOneActivity(source.token, activityId)
            .then((activity) => {
                setActivity(activity);
                if (activity.event) {
                    const startDate = activity.event.startDate as Date;
                    const endDate = activity.event.endDate;
                    setEventDates([startDate, endDate ? endDate : startDate]);
                }
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

    const submitUpdateData = async (request_data: any) => {
        setConfirmModalOpen(false);
        try {
            await api.put(`/activity/${activityId}`, request_data);
            toast({
                title: 'Atividade atualizada',
                status: 'info',
            });
            history.goBack();
        } catch (error) {
            if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409) {
                        const responseMessage = error.response.message;
                        if (formRef.current?.setErrors)
                            message = handleActivityConflictError(
                                responseMessage,
                                error.response.data,
                                formRef.current.setErrors
                            );
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

    const closeModal = () => {
        setConfirmModalOpen(false);
        setSubmitLoading(false);
    };

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitLoading(true);
        try {
            formRef.current?.setErrors({});

            await activityEditSchema.validate(data, {
                abortEarly: false,
            });

            const updatedSchedules = data.schedules.map((schedule, index) => {
                const roomNumber = schedule.room as unknown as string;
                return {
                    id:
                        activity &&
                        activity.schedules &&
                        activity.schedules[index]
                            ? activity.schedules[index].id
                            : undefined,
                    startDate: schedule.dateTime.toISOString(),
                    durationInMinutes: schedule.durationInMinutes,
                    room:
                        roomNumber !== '' ? { id: parseInt(roomNumber) } : null,
                    url: schedule.url !== '' ? schedule.url : null,
                };
            });

            const request_data = {
                title: data.title,
                description: data.description,
                responsibleUsers: data.responsibleUsers.map((id) => ({ id })),
                teachingUsers: data.teachingUsers.map((id) => ({ id })),
                vacancy: parseInt(data.vacancy),
                workloadInMinutes: parseInt(data.workloadInMinutes),
                schedules: updatedSchedules,
                activityCategory: {
                    id: data.activityCategory,
                },
            };

            const response = await api.put(
                `/activity/${activityId}/check_schedules`,
                { schedules: updatedSchedules }
            );
            const { isEqual, hasRegistry } = response.data;
            if (!isEqual && hasRegistry) {
                setConfirmModalOpen(true);
                setRequestData(request_data);
            } else {
                submitUpdateData(request_data);
            }
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                const message = error.message;
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
            <Modal isOpen={confirmModalOpen} onClose={closeModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>A atividade possui matrículas.</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Alterar o horário ou duração da atividade irá excluir
                        todas as matrículas desta atividade. Você deseja
                        continuar com esta ação?
                    </ModalBody>
                    <ModalFooter>
                        <CustomButton
                            style={{
                                backgroundColor: COLORS.success,
                                marginRight: '0.8rem',
                            }}
                            onClick={() => submitUpdateData(requestData)}
                        >
                            Alterar
                        </CustomButton>
                        <CustomButton
                            style={{ backgroundColor: COLORS.danger }}
                            onClick={closeModal}
                        >
                            Cancelar
                        </CustomButton>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {error ? (
                <ErrorMessage>{error}</ErrorMessage>
            ) : isLoading ? (
                <LoadingSpinner />
            ) : (
                activity &&
                activity.schedules && (
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
                                responsibleUsers:
                                    activity.responsibleUsers?.map((r) => ({
                                        label: stringifyUserWithCpf(r),
                                        value: r.id,
                                    })),
                                teachingUsers: activity.teachingUsers?.map(
                                    (r) => ({
                                        label: stringifyUserWithCpf(r),
                                        value: r.id,
                                    })
                                ),
                                schedules: activity.schedules.map(
                                    (schedule) => ({
                                        id: schedule.id,
                                        dateTime: schedule.startDate,
                                        durationInMinutes:
                                            schedule.durationInMinutes,
                                        room: {
                                            value: schedule.room
                                                ? schedule.room.id
                                                : undefined,
                                        },
                                        url: schedule.url,
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
                                label="Categoria da atividade"
                                name="activityCategory"
                                options={activityCategories}
                                placeholder="Escolha a categoria da atividade"
                            />
                            <Select
                                label="Professor responsável"
                                name="responsibleUsers"
                                isMulti
                                options={users}
                                placeholder="Escolha ao menos um responsável"
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
                            <SelectMultiSchedules
                                name="schedules"
                                eventDates={eventDates}
                                initialSchedules={activity.schedules.map(
                                    (schedule, index) => ({
                                        ...schedule,
                                        room: schedule.room
                                            ? schedule.room.id
                                            : undefined,
                                        name: `select-${index + 1}`,
                                    })
                                )}
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
