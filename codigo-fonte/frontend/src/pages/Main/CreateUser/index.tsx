import React, { useRef, useState } from 'react';
import Navbar from 'components/Navbar';
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
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import { useHistory } from 'react-router';
import Footer from 'components/Footer';
import { userSchema } from 'validation/userSchema';
import ReCAPTCHA from 'react-google-recaptcha';

interface FormData {
    name: string;
    email: string;
    cpf: string;
    cellphone: string;
    cep?: string;
    city?: string;
    uf?: string;
    address?: string;
    password: string;
    birth: Date;
}

const CreateUser: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);

    const [cityStateInfo, setCityStateInfo] = useState<{
        city: string;
        uf: string;
    } | null>(null);

    const [submitLoading, setSubmitLoading] = useState(false);

    const history = useHistory();

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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

            if (!captchaToken) {
                toast({
                    title: 'Por favor, complete o reCAPTCHA',
                    status: 'error',
                });
                setSubmitLoading(false);
                return;
            }

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
                email: data.email.toLowerCase(),
                cpf: data.cpf,
                cellphone: data.cellphone,
                birthDate: data.birth.toISOString(),
                cep: data.cep,
                city: data.city,
                uf: data.uf,
                address: data.address,
                password: data.password !== '' ? data.password : undefined,
                captcha: captchaToken, 
            };

            await api.post('/user/', request_data);

            toast({
                title:
                    'Conta cadastrada.',
                status: 'success',
                duration: 10000,
            });
            history.push('/');
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
                        } else if (error.response.message?.includes('cpf')) {
                            message = 'Esse CPF já está cadastrado';
                            formRef.current?.setErrors({
                                cpf: message,
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
        <>
            <Navbar />

            <PageContentWrapper>
                <FormWrapper>
                    <PageTitle>Criar Conta</PageTitle>
                    <Form ref={formRef} onSubmit={onSubmit}>
                        <Input
                            label="Nome completo (aparece nos certificados)*"
                            name="name"
                            placeholder="Insira o nome completo"
                            maxLength={150}
                            sx={{ marginRight: '800px' }}
                        />
                        <Wrapper>

                            <InputMask
                                name="cpf"
                                label="CPF*"
                                mask="cpf"
                                maxLength={14}
                                className="head"
                                placeholder="CPF no formato 999.999.999-99"
                            />
                            <Input
                                label="Email*"
                                name="email"
                                maxLength={100}
                                placeholder="exemplo@email.com"
                            />
                        </Wrapper>
                        <Wrapper>
                            <InputMask
                                name="cellphone"
                                label="Celular*"
                                mask="phone"
                                maxLength={14}
                                className="tail"
                                placeholder="Celular no formato (99) 99999-9999"
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
                        <Wrapper>
                            <Input
                                label="Senha*"
                                type="password"
                                name="password"
                                placeholder="Mínimo 6 caracteres"
                            />

                            <Input
                                label="Confirme a senha*"
                                type="password"
                                name="confirmPassword"
                                placeholder="As senhas devem ser iguais"
                            />
                        </Wrapper>
                        <Wrapper>
                            <InputMask
                                name="cep"
                                label="Cep"
                                mask="cep"
                                maxLength={9}
                                className="tail"
                                placeholder="CEP no formato 11111-111"
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
                                hidden={!cityStateInfo}
                                label={cityStateInfo ? 'Cidade' : ''}
                                name="city"
                                className="head"
                                value={
                                    cityStateInfo ? cityStateInfo.city : ''
                                }
                                placeholder="Informe um CEP válido"
                            />

                            <Input
                                isDisabled
                                hidden={!cityStateInfo}
                                label={cityStateInfo ? 'Estado' : ''}
                                name="uf"
                                className="tail"
                                value={
                                    cityStateInfo ? cityStateInfo.uf : ''
                                }
                                placeholder="Informe um CEP válido"
                            />
                        </Wrapper>

                        <ReCAPTCHA
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '20px'
                            }}
                            sitekey={process.env.REACT_APP_SITE_KEY!}
                            onChange={(value) => setCaptchaToken(value)}
                        />

                        <Button
                            disabled={submitLoading}
                            style={{
                                backgroundColor: COLORS.success,
                                display: 'flex',
                                justifyContent: 'center',
                                marginLeft: '38%',
                                marginRight: '38%',
                                paddingBottom: '20px',
                                paddingTop: '20px',
                            }}
                        >
                            Criar Conta
                        </Button>
                    </Form>
                </FormWrapper>
            </PageContentWrapper>
            <Footer />
        </>
    );
};

export default CreateUser;
