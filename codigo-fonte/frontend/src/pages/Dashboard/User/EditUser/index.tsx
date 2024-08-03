import React, { useEffect, useRef, useState } from 'react';
import {
    FormWrapper,
    PageContentWrapper,
    PageTitle,
} from 'custom-style-components';
import Button from 'components/Button';
import Input from 'components/Input';
import InputMask from 'components/InputMask';
import DatePicker from 'components/DatePickers/DatePicker';
import COLORS from 'constants/COLORS';
import { Wrapper } from './styled';

import { FormHandles, SubmitHandler } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { api } from 'services/axios';
import getValidationError from 'utils/getValidationErrors';
import { People } from 'types/models';
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { useAuth } from 'hooks/auth';
import { ResponseError } from 'errors/ResponseError';
import { fetchOneUser } from 'services/fetch/users';
import { useHistory } from 'react-router';
import GoBackButton from 'components/GoBackButton';
import { userSchema } from 'validation/userSchema';

interface FormData {
    name: string;
    email: string;
    password: string;
    cpf: string;
    cellphone: string;
    birth: Date;
    cep: string;
    city: string;
    uf: string;
    address: string;
}

const EditUser: React.FC = () => {
    const history = useHistory();
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const { user } = useAuth();
    const [usuario, setPeople] = useState<People>();

    const [cityStateInfo, setCityStateInfo] = useState<{
        city: string;
        uf: string;
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [submitLoading, setSubmitLoading] = useState(false);

    const formRef = useRef<FormHandles>(null);

    useEffect(() => {
        if (user) {
            const source = createCancelTokenSource();
            fetchOneUser(source.token, user.id)
                .then((user) => {
                    setPeople(user);
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
                .finally(() => {
                    setLoading(false);
                });
            return () => source.cancel();
        }
    }, []);

    const fetchCityStateInfo = async (cep: string) => {
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
                password: data.password !== '' ? data.password : undefined,
            };

            await api.put(`/user/${user?.id}`, request_data);

            toast({
                title: 'Alteração feita com sucesso',
                status: 'success',
            });

            history.push('/dashboard/usuario');
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
                return;
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    if (error.status === 409) {
                        if (error.response.message?.includes('cellphone')) {
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
        <>
            <PageContentWrapper>
                <FormWrapper>
                    <PageTitle>Alterar dados</PageTitle>
                    <GoBackButton />
                    {error ? (
                        <ErrorMessage>{error}</ErrorMessage>
                    ) : loading ? (
                        <LoadingSpinner />
                    ) : usuario ? (
                        <Form
                            ref={formRef}
                            onSubmit={onSubmit}
                            initialData={{
                                name: usuario?.name,
                                email: usuario?.email,
                                cpf: usuario?.cpf,
                                cellphone: usuario?.cellphone,
                                cep: usuario?.cep,
                                birth: usuario?.birthDate,
                                address: usuario?.address,
                            }}
                        >
                            <Input
                                label="Nome*"
                                name="name"
                                placeholder="ex. Fulado dos Santos Mota..."
                            />

                            <Input
                                label="Email*"
                                name="email"
                                maxLength={100}
                                placeholder="ex. exemplo@exemplo.com.."
                            />

                            <Wrapper>
                                <InputMask
                                    name="cpf"
                                    label="CPF*"
                                    mask="cpf"
                                    maxLength={14}
                                    className="head"
                                    placeholder="Ex. 999.999.999-99"
                                    isDisabled={true}
                                />

                                <DatePicker
                                    disabledKeyboardNavigation
                                    label="Data de Nascimento*"
                                    name="birth"
                                    className="head"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    placeholderText="Selecione uma data"
                                />
                            </Wrapper>

                            <Input
                                label="Endereço"
                                name="address"
                                maxLength={100}
                                placeholder="ex. Rua Exemplo de rua n19..."
                            />

                            <Wrapper>
                                <InputMask
                                    name="cellphone"
                                    label="Celular"
                                    mask="phone"
                                    maxLength={14}
                                    className="tail"
                                    placeholder="Ex. (99) 99999-9999"
                                />

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
                                    isDisabled
                                    label="Cidade"
                                    name="city"
                                    className="head"
                                    value={
                                        cityStateInfo
                                            ? cityStateInfo.city
                                            : usuario?.city
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
                                            : usuario?.uf
                                    }
                                    placeholder="Informe um CEP válido"
                                />
                            </Wrapper>

                            <Button
                                disabled={submitLoading}
                                style={{ backgroundColor: COLORS.success }}
                            >
                                Salvar dados
                            </Button>
                        </Form>
                    ) : (
                        <p>
                            Não foi possivel carregar o usuário. Tente novamente
                            mais tarde.
                        </p>
                    )}
                </FormWrapper>
            </PageContentWrapper>
        </>
    );
};

export default EditUser;
