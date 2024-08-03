import React, { useEffect, useRef, useState } from 'react';
import { DashboardPageContent, FormWrapper, PageSubtitle, PageTitle, } from 'custom-style-components';
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
import { ActivityCategory } from 'types/models';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import TOAST from 'constants/TOAST';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchOneCategory } from 'services/fetch/activityCategories';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import GoBackButton from 'components/GoBackButton';
import { activityCategorySchema } from '../../../../../validation/activityCategorySchema';

interface ParamTypes {
    categoryId: string;
}

interface FormData {
    code: string;
    description: string;
}

const EditActivityCategory: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable : TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);
    const { categoryId } = useParams<ParamTypes>();
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [categoryInitial, setCategory] = useState<ActivityCategory>();

    const history = useHistory();
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchOneCategory(source.token, categoryId)
            .then((category) => {
                setCategory(category);
            })
            .catch((error) => {
                if (error instanceof GenericFrontError) {
                    let message = error.message;
                    if (error instanceof ResponseError && error.status === 404)
                        message = 'Categoria não encontrada';
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

            await activityCategorySchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                code: data.code,
                description: data.description,
            };

            await api.put(`/activity_category/${categoryId}`, request_data);
            toast({
                title: 'Categoria atualizada',
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
                        message = 'Código já está sendo utilizado';
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
                <PageTitle>Alterar dados da categoria</PageTitle>
                <PageSubtitle>{categoryInitial && categoryInitial.description + ` (${categoryInitial.code})`}</PageSubtitle>
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
                            code: categoryInitial?.code,
                            description: categoryInitial?.description,
                        }}
                    >
                        <Input
                            label="Código da categoria"
                            name="code"
                            placeholder="ex. 'MR', 'MC'"
                        />
                        <Input
                            label="Desrição da categoria"
                            name="description"
                            placeholder="ex. 'Mesa redonda', 'Minicurso'"
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

export default EditActivityCategory;
