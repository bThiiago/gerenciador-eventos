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
import { People } from 'types/models';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import LoadingSpinner from 'components/LoadingSpinner';
import ErrorMessage from 'components/ErrorMessage';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { Wrapper } from './styled';
import { fetchOneUser } from 'services/fetch/users';
import { userPasswordSchema } from 'validation/userSchema';
import GoBackButton from 'components/GoBackButton';

interface ParamTypes {
    userId: string;
}

interface FormData {
    name: string;
    email: string;
    cpf: string;
    cellphone?: string;
    password: string;
    birth: Date;
    phone?: string;
}

const EditUserPassword: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const { userId } = useParams<ParamTypes>();
    const [initialUser, setInitialUser] = useState<People>();

    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();

    const [submitLoading, setSubmitLoading] = useState(false);

    const history = useHistory();
    const formRef = useRef<FormHandles>(null);

    const fetchUser = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const source = createCancelTokenSource();
            if (isNaN(parseInt(userId))) {
                reject();
            }
            fetchOneUser(source.token, parseInt(userId))
                .then((user) => {
                    setInitialUser(user);
                })
                .catch((error) => {
                    let message = 'Erro não tratado';
                    if (error instanceof GenericFrontError) {
                        message = error.message;
                        if (
                            error instanceof ResponseError &&
                            error.status === 404
                        )
                            message = 'Usuário não encontrado.';
                        setError(message);
                    }
                    toast({
                        title: message,
                        status: 'error',
                    });
                })
                .finally(() => resolve());
        });
    };

    useEffect(() => {
        setIsLoading(true);
        fetchUser().catch(() => {
            toast({
                title: 'Ocorreu um erro inesperado',
                status: 'error',
            });
        });
    }, []);

    useEffect(() => {
        if (initialUser) {
            setIsLoading(false);
        }
    }, [initialUser]);

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

            await userPasswordSchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                password: data.password !== '' ? data.password : undefined,
            };

            await api.put(`/user/edit_password/${userId}`, request_data);

            toast({
                title: 'Alteração feita com sucesso',
                status: 'success',
            });

            history.push('/dashboard/admin/usuarios');
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
                return;
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409) {
                        if (error.response.message?.includes('email')) {
                            message = 'E-mail já cadastrado';
                            formRef.current?.setErrors({
                                email: message,
                            });
                        } else if (error.response.message?.includes('cpf')) {
                            message = 'CPF já cadastrado';
                            formRef.current?.setErrors({
                                cpf: message,
                            });
                        } else if (
                            error.response.message?.includes('cellphone')
                        ) {
                            message = 'Celular já cadastrado';
                            formRef.current?.setErrors({
                                cellphone: message,
                            });
                        }
                    }
                }
                toast({
                    title: message,
                    status: 'error',
                });
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <DashboardPageContent>
            <FormWrapper>
                <PageTitle>Alterar senha do usuário</PageTitle>
                <PageSubtitle>{initialUser && initialUser.name}</PageSubtitle>
                <GoBackButton />
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : loading ? (
                    <LoadingSpinner />
                ) : (
                    <Form
                        ref={formRef}
                        onSubmit={onSubmit}
                    >

                        <Wrapper>
                            <Input
                                label="Alterar senha"
                                type="password"
                                name="password"
                                placeholder="Mínimo 6 caracteres"
                            />

                            <Input
                                label="Confirme a senha"
                                type="password"
                                name="confirmPassword"
                                placeholder="As senhas devem ser iguais"
                            />
                        </Wrapper>

                        <CustomButton
                            disabled={submitLoading}
                            style={{ backgroundColor: COLORS.success }}
                        >
                            Salvar senha
                        </CustomButton>
                    </Form>
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default EditUserPassword;
