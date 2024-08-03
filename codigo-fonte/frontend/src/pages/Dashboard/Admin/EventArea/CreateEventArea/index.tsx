import React, { useRef, useState } from 'react';
import {
    DashboardPageContent,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';
import * as Yup from 'yup';
import { useToast } from '@chakra-ui/react';

import Input from 'components/Input';
import Button from 'components/Button';
import { api } from 'services/axios';
import getValidationError from 'utils/getValidationErrors';

import COLORS from 'constants/COLORS';
import TOAST from 'constants/TOAST';
import { useHistory } from 'react-router';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import GoBackButton from 'components/GoBackButton';
import { eventAreaSchema } from 'validation/eventAreaSchema';

interface FormData {
    name: string;
    sigla: string;
}

const CreateEventArea: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);

    const history = useHistory();
    const [submitLoading, setSubmitLoading] = useState(false);

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

            await api.post('/event_area', request_data);
            toast({
                title: 'Área cadastrada',
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
                <PageTitle>Cadastrar nova área</PageTitle>
                <GoBackButton />
                <Form ref={formRef} onSubmit={onSubmit}>
                    <Input
                        label="Nome da área"
                        name="name"
                        placeholder="ex. 'Bacharelado em Ciência da Computação'"
                    />
                    <Input label="Sigla" name="sigla" placeholder="ex. 'BCC'" />
                    <Button
                        style={{ backgroundColor: COLORS.success }}
                        disabled={submitLoading}
                    >
                        Cadastrar área
                    </Button>
                </Form>
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default CreateEventArea;
