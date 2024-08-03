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
import { activityCategorySchema } from '../../../../../validation/activityCategorySchema';

interface FormData {
    code: string;
    description: string;
}

const CreateActivityCategory: React.FC = () => {
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

            await activityCategorySchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                code: data.code,
                description: data.description
            };

            await api.post('/activity_category', request_data);
            toast({
                title: 'Categoria da atividade cadastrada',
                status: 'success',
            });
            history.push('/dashboard/admin/categoria_atividade');
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409)
                        message = 'Código já está sendo utilizada';
                    else message = 'Não foi possível cadastrar a categoria';
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
                <PageTitle>Cadastrar uma nova categoria</PageTitle>
                <GoBackButton />
                <Form ref={formRef} onSubmit={onSubmit}>
                    <Input
                        label="Código da categoria"
                        name="code"
                        placeholder="ex. 'MR', 'MC'"
                    />
                    <Input
                        label="Desrição da categoria"
                        name="description"
                        placeholder="ex. 'Mesa redonda', 'Mini-curso'"
                    />
                    <Button
                        style={{ backgroundColor: COLORS.success }}
                        disabled={submitLoading}
                    >
                        Cadastrar categoria
                    </Button>
                </Form>
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default CreateActivityCategory;
