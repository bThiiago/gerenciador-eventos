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
import { EventCategory } from 'types/models';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import TOAST from 'constants/TOAST';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchOneCategory } from 'services/fetch/eventCategories';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import GoBackButton from 'components/GoBackButton';
import { eventCategorySchema } from 'validation/eventCategory';

interface ParamTypes {
    categoryId: string;
}

interface FormData {
    category: string;
    url_src: string;
}

const EditEventCategory: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable : TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);
    const { categoryId } = useParams<ParamTypes>();
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [categoryInitial, setCategory] = useState<EventCategory>();

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
                        message = 'Evento não encontrado';
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

            await eventCategorySchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                category: data.category,
                url_src: data.url_src,
            };

            await api.put(`/event_category/${categoryId}`, request_data);
            toast({
                title: 'Evento atualizado',
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
                <PageTitle>Alterar dados do evento</PageTitle>
                <PageSubtitle>{categoryInitial && categoryInitial?.category + ` (${categoryInitial.url_src})`}</PageSubtitle>
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
                            category: categoryInitial?.category,
                            url_src: categoryInitial?.url_src,
                        }}
                    >
                        <Input
                            label="Nome do evento"
                            name="category"
                            placeholder="ex. 'Semana Nacional de Ciência e Tecnologia'"
                        />
                        <Input
                            label="URL representativa"
                            name="url_src"
                            placeholder="ex. 'snct'"
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

export default EditEventCategory;
