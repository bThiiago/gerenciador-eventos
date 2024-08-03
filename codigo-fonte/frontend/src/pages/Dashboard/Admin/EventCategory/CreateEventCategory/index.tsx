import React, { useRef, useState } from 'react';
import { DashboardPageContent, FormWrapper, PageTitle, } from 'custom-style-components';
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
import { eventCategorySchema } from 'validation/eventCategory';

interface FormData {
    category: string;
    url_src: string;
}

const CreateEventCategory: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable : TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);

    const history = useHistory();
    const [submitLoading, setSubmitLoading] = useState(false);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitLoading(true);
        try {
            formRef.current?.setErrors({});

            await eventCategorySchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                category: data.category,
                url_src: data.url_src
            };

            await api.post('/event_category', request_data);
            toast({
                title: 'Evento cadastrado',
                status: 'success',
            });
            history.push('/dashboard/admin/eventos');
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409)
                        message = 'URL já está sendo utilizada';
                    else message = 'Não foi possível cadastrar o evento';
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
                <PageTitle>Cadastrar um novo evento</PageTitle>
                <GoBackButton />
                <Form ref={formRef} onSubmit={onSubmit}>
                    <Input
                        label="Nome da categoria"
                        name="category"
                        placeholder="ex. 'Semana Nacional de Ciência e Tecnologia'"
                    />
                    <Input
                        label="URL representativa"
                        name="url_src"
                        placeholder="ex. 'snct'"
                    />
                    <Button
                        style={{ backgroundColor: COLORS.success }}
                        disabled={submitLoading}
                    >
                        Cadastrar evento
                    </Button>
                </Form>
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default CreateEventCategory;
