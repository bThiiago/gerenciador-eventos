import React, { useEffect, useRef, useState } from 'react';
import { DashboardPageContent, FormWrapper, PageSubtitle, PageTitle, } from 'custom-style-components';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';
import * as Yup from 'yup';
import { useToast } from '@chakra-ui/react';
import { useHistory, useParams } from 'react-router-dom';
import Button from 'components/Button';

import Input from 'components/Input';
import { api } from 'services/axios';
import getValidationError from 'utils/getValidationErrors';

import COLORS from 'constants/COLORS';
import { RoomType } from 'types/models';
import { fetchOneRoom } from 'services/fetch/rooms';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import LoadingSpinner from 'components/LoadingSpinner';
import ErrorMessage from 'components/ErrorMessage';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import GoBackButton from 'components/GoBackButton';
import { roomSchema } from '../../../../../validation/roomSchema';
import { Wrapper } from './styled';

interface ParamTypes {
    roomId: string;
}

interface FormData {
    code: string;
    capacity: number;
    description: string;
}

/**
 * @description componente responsável pela criação ou edição de uma sala cadastrada no sistema.
 * @field roomId a presença desse campo determina se é uma edição (roomId presente) ou criação (roomId == undefined)
 */
const CreateOrEditRoom: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);
    const { roomId } = useParams<ParamTypes>();
    const [loading, setIsLoading] = useState(!!roomId);
    const [error, setError] = useState<string>();
    const [initialRoom, setInitialRoom] = useState<RoomType>();

    const history = useHistory();
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        if (!roomId)
            return;

        const source = createCancelTokenSource();
        fetchOneRoom(source.token, parseInt(roomId))
            .then((room) => setInitialRoom(room))
            .catch((error) => {
                if (error instanceof GenericFrontError) {
                    let message = error.message;
                    if (error instanceof ResponseError && error.status === 404)
                        message = 'Sala não encontrada.';
                    setError(message);
                }
            })
            .finally(() => setIsLoading(false));

        return () => source.cancel();
    }, []);

    useEffect(() => {
        if (error) {
            toast({
                title: error,
                status: 'error',
            });
        }
    }, [error]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitLoading(true);
        try {
            formRef.current?.setErrors({});

            await roomSchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                code: data.code,
                capacity: data.capacity,
                description: data.description,
            };

            if (roomId) {
                await api.put(`/room/${roomId}`, request_data);
            } else {
                await api.post('/room', request_data);
            }

            toast({
                title: 'Sala criada/alterada',
                status: 'success',
            });
            history.push('/dashboard/admin/salas');
        } catch (error: any) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409)
                        message = 'Código já está sendo utilizado';
                    else message = 'Não foi possível cadastrar a sala';
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
            <FormWrapper>
                <PageTitle>
                    {roomId ?
                        'Alterar dados da sala' :
                        'Cadastrar uma nova sala'
                    }
                </PageTitle>
                {initialRoom && <PageSubtitle>{initialRoom && initialRoom.code}</PageSubtitle>}
                <GoBackButton />
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : loading ? (
                    <LoadingSpinner />
                ) : (
                    <Form
                        ref={formRef}
                        onSubmit={onSubmit}
                        initialData={{
                            code: initialRoom?.code,
                            capacity: initialRoom?.capacity,
                            description: initialRoom?.description,
                        }}
                    >
                        <Wrapper>
                            <Input
                                label="Código da sala"
                                name="code"
                                placeholder="Ex: 'A210', 'B106'"
                                maxLength={4}
                            />
                            <Input
                                label="Capacidade de pessoas"
                                name="capacity"
                                type="number"
                                placeholder="Quantidade máxima de pessoas da sala"
                                allowNegative={false}
                                max={1000}
                            />
                        </Wrapper>
                        <Input
                            label="Descrição"
                            name="description"
                            placeholder="Ex: Laboratório de Informática"
                            allowNegative={false}
                            maxLength={50}
                        />
                        <Button
                            disabled={submitLoading}
                            style={{ backgroundColor: COLORS.success }}
                        >
                            {roomId ?
                                'Alterar dados' :
                                'Cadastrar sala'
                            }
                        </Button>
                    </Form>
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default CreateOrEditRoom;
