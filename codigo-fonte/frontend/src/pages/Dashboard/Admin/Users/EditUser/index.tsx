import React, { useEffect, useRef, useState } from 'react';
import { DashboardPageContent, FormWrapper, PageSubtitle, PageTitle, } from 'custom-style-components';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';
import * as Yup from 'yup';
import { useToast } from '@chakra-ui/react';
import { useHistory, useParams } from 'react-router-dom';
import CustomButton from 'components/Button';
import DatePicker from 'components/DatePickers/DatePicker';
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
import InputMask from 'components/InputMask';
import { fetchOneUser } from 'services/fetch/users';
import { userSchema } from 'validation/userSchema';
import GoBackButton from 'components/GoBackButton';

interface ParamTypes {
    userId: string;
}

interface FormData {
    name: string;
    email: string;
    cpf: string;
    cellphone?: string;
    birth: Date;
    phone?: string;
    cep?: string;
    address?: string;
    uf?: string;
    city?: string;
}

const EditUser: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const { userId } = useParams<ParamTypes>();
    const [initialUser, setInitialUser] = useState<People>();

    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();

    const [cityStateInfo, setCityStateInfo] = useState<{
        city: string;
        uf: string;
    } | null>(null);

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

    const fetchCityStateInfo = async (cep: string) => {
        if (cep != '') {
            try {
                const response = await api.get(
                    `https://viacep.com.br/ws/${cep}/json/`
                );
                const { localidade, uf } = response.data;
                setCityStateInfo({ city: localidade, uf: uf });
            } catch (error) {
                console.error('Error fetching city and state information:', error);
                setCityStateInfo(null);
            }
        }
    };

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitLoading(true);
        try {
            formRef.current?.setErrors({});

            await userSchema.validate(data, {
                abortEarly: false,
            });

            const nameWords = data.name.toLowerCase().trim().split(/\s+/g);
            const formattedName = nameWords
                .map((word) => {
                    if (word.length > 2) {
                        return (
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        );
                    }
                    return word;
                })
                .join(' ');

            const request_data = {
                name: formattedName,
                email: data.email,
                cellphone: data.cellphone,
                birthDate: data.birth.toISOString(),
                cep: data.cep,
                city: data.city,
                uf: data.uf,
                address: data.address,
            };

            await api.put(`/user/${userId}`, request_data);

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
                            message = 'Esse e-mail já está cadastrado';
                            formRef.current?.setErrors({
                                email: message,
                            });
                        } else if (
                            error.response.message?.includes('cellphone')
                        ) {
                            message = 'Esse celular já está cadastrado';
                            formRef.current?.setErrors({
                                cellphone: message,
                            });
                        }
                    } else if (
                        error?.response?.validation?.body?.message?.includes(
                            'birthDate'
                        )
                    ) {
                        message = 'Você deve ter mais de 4 anos de idade';
                        formRef.current?.setErrors({
                            birth: message,
                        });
                    } else if (error?.response.message.includes('CEP')) {
                        message =
                            'CEP Inválido';
                        formRef.current?.setErrors({
                            cep: message,
                        });
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
                <PageTitle>Alterar dados do usuário</PageTitle>
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
                        initialData={{
                            name: initialUser?.name,
                            email: initialUser?.email,
                            cpf: initialUser?.cpf,
                            cellphone: initialUser?.cellphone,
                            birth: initialUser?.birthDate,
                        }}
                    >

                        <Input
                            label="Nome completo (aparece nos certificados)"
                            name="name"
                            placeholder="Insira o nome completo"
                        />
                        <Wrapper>
                            <InputMask
                                name="cpf"
                                label="CPF"
                                mask="cpf"
                                maxLength={14}
                                className="head"
                                placeholder="CPF no formato 999.999.999-99"
                            />
                            <Input
                                label="Email"
                                name="email"
                                maxLength={120}
                                placeholder="exemplo@email.com"
                            />
                        </Wrapper>
                        <Wrapper>

                            <InputMask
                                name="cellphone"
                                label="Celular"
                                mask="phone"
                                maxLength={14}
                                className="tail"
                                placeholder="Celular no formato (99) 99999-9999"
                            />
                            <DatePicker
                                disabledKeyboardNavigation
                                label="Data de Nascimento"
                                name="birth"
                                className="head"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                placeholderText="Selecione uma data"
                            />
                        </Wrapper>
                        <Wrapper>
                            <InputMask
                                name="cep"
                                label="Cep"
                                mask="cep"
                                maxLength={9}
                                className="tail"
                                placeholder="Ex. 11111-111"
                                onChange={(e) => {
                                    const cep = e.target.value.replace(
                                        /\D/g,
                                        ''
                                    );
                                    if (cep.length === 8) {
                                        fetchCityStateInfo(cep);
                                    } else {
                                        setCityStateInfo(null);
                                    }
                                }}
                            />
                            <Input
                                label="Endereço"
                                name="address"
                                maxLength={100}
                                placeholder="Insira a rua e o número"
                            />
                        </Wrapper>
                        <Wrapper>
                            <Input
                                isDisabled
                                label="Cidade"
                                name="city"
                                className="head"
                                value={
                                    cityStateInfo
                                        ? cityStateInfo.city
                                        : initialUser?.city
                                }
                                placeholder="Informe um CEP válido"
                            />

                            <Input
                                isDisabled
                                label="Estado"
                                name="uf"
                                className="tail"
                                value={
                                    cityStateInfo
                                        ? cityStateInfo.uf
                                        : initialUser?.uf
                                }
                                placeholder="Informe um CEP válido"
                            />
                        </Wrapper>
                        <CustomButton
                            disabled={submitLoading}
                            style={{ backgroundColor: COLORS.success }}
                        >
                            Salvar dados
                        </CustomButton>
                    </Form>
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default EditUser;
