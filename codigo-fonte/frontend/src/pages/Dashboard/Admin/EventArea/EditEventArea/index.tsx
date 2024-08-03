import React, { useEffect, useRef, useState } from 'react';
import {
    DashboardPageContent,
    FormWrapper,
    PageSubtitle,
    PageTitle,
} from 'custom-style-components';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';
import * as Yup from 'yup';
import { useToast } from '@chakra-ui/react';
import { useHistory, useParams } from 'react-router-dom';
import CustomButton from 'components/Button';

import Input from 'components/Input';
import { api } from 'services/axios';
import getValidationError from 'utils/getValidationErrors';

import COLORS from 'constants/COLORS';
import { EventArea } from 'types/models';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import TOAST from 'constants/TOAST';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchOneArea } from 'services/fetch/eventAreas';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import GoBackButton from 'components/GoBackButton';
import { eventAreaSchema } from 'validation/eventAreaSchema';

interface ParamTypes {
    areaId: string;
}

interface FormData {
    name: string;
    sigla: string;
}

const EditEventArea: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);
    const { areaId } = useParams<ParamTypes>();
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [areaInitial, setArea] = useState<EventArea>();

    const history = useHistory();
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchOneArea(source.token, areaId)
            .then((area) => {
                setArea(area);
            })
            .catch((error) => {
                if (error instanceof GenericFrontError) {
                    let message = error.message;
                    if (error instanceof ResponseError && error.status === 404)
                        message = 'Área não encontrada';
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

            await eventAreaSchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                name: data.name,
                sigla: data.sigla,
            };

            await api.put(`/event_area/${areaId}`, request_data);
            toast({
                title: 'Área atualizada',
                status: 'success',
            });
            history.push('/dashboard/admin/areas');
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409)
                        message = 'Sigla já está sendo utilizada';
                    else message = 'Não foi possível cadastrar a área';
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
                <PageTitle>Alterar dados do evento</PageTitle>
                <PageSubtitle>
                    {areaInitial &&
                        areaInitial?.name + ` (${areaInitial.sigla})`}
                </PageSubtitle>
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
                            name: areaInitial?.name,
                            sigla: areaInitial?.sigla,
                        }}
                    >
                        <Input
                            label="Nome da área"
                            name="name"
                            placeholder="ex. 'Bacharelado em Ciência da Computação'"
                        />
                        <Input
                            label="Sigla"
                            name="sigla"
                            placeholder="ex. 'BCC'"
                        />
                        <CustomButton
                            style={{ backgroundColor: COLORS.success }}
                            disabled={submitLoading}
                        >
                            Alterar dados
                        </CustomButton>
                    </Form>
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default EditEventArea;
