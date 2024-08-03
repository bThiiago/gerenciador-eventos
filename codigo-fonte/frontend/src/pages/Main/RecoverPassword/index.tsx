import React, { useRef, useState } from 'react';
import { BR } from './styled';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { FormHandles, SubmitHandler } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import getValidationError from 'utils/getValidationErrors';
import Navbar from 'components/Navbar';
import COLORS from 'constants/COLORS';
import { LinkText, PageSignWrapper, SignTitle, SignWrapper } from 'custom-style-components';
import { Box, Flex, Spacer, Stack } from '@chakra-ui/react';
import Input from 'components/Input';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import TOAST from 'constants/TOAST';
import { useToast } from '@chakra-ui/toast';
import CustomButton from 'components/Button';
import InputMask from 'components/InputMask';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { CancelToken } from 'axios';
import { api } from 'services/axios';
import { People, PeopleAPIModel } from 'types/models';
import mapPeopleFromAPI from 'utils/mapFunctions/mapPeople';

interface FormData {
    email: string;
    password: string;
    cpf: string;
}

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const fetchOneUserByEmail = (
    tokenSource: CancelToken,
    email: string
): Promise<People> => {
    return new Promise((resolve, reject) => {
        api.get<PeopleAPIModel>(`/user/find_by_email/${email}`, {
            cancelToken: tokenSource,
        })
            .then((response) => {

                const data = response.data;
                const user = mapPeopleFromAPI(data);

                resolve(user);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const RequestPasswordRecover: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const [error, setError] = useState<string>();

    const formRef = useRef<FormHandles>(null);

    const [submitLoading, setSubmitLoading] = useState(false);

    const history = useHistory();

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitLoading(true);
        const source = createCancelTokenSource();
        try {
            formRef.current?.setErrors({});
    
            const schema = Yup.object().shape({
                email: Yup.string()
                    .required('E-mail obrigatório')
                    .email('Digite um e-mail válido'),
                cpf: Yup.string()
                    .required('CPF obrigatório')
                    .length(14, 'Formato inadequado'),
            });
    
            await schema.validate(data, {
                abortEarly: false,
            });
    
            // Limpa o CPF para comparar com o formato esperado
            const newCpf = data.cpf.replace(/\D/g, '');
    
            // Obtém o usuário pelo e-mail
            const user = await fetchOneUserByEmail(source.token, data.email);
    
            if (user && user.cpf === newCpf) {
                const request_data = {
                    email: data.email,
                };
                
                await api.post('/recover', request_data);
    
                toast({
                    title: 'Enviando email de recuperação de senha',
                    status: 'success'
                });
    
                history.push('/');
            } else {
                const message = 'Dados incorretos';
                setError(message);
                toast({
                    title: message,
                    status: 'error',
                });
            }
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const errors = getValidationError(err);
    
                formRef.current?.setErrors(errors);
                return;
            }
    
            if (err instanceof GenericFrontError) {
                let message = err.message;
                if (err instanceof ResponseError) {
                    if (err.status === 400) message = 'Ocorreu um erro desconhecido, por favor contate os administradores';
                    if (err.status === 404) message = 'Dados incorretos';
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
            <PageSignWrapper>
                <SignTitle>Recuperar Senha</SignTitle>
                <SignWrapper>
                    <Form ref={formRef} onSubmit={onSubmit}>
                        <Stack spacing={4}>
                            <InputMask
                                name="cpf"
                                mask="cpf"
                                maxLength={14}
                                className="head"
                                placeholder="CPF no formato 999.999.999-99"
                            />
                            <Input
                                type="email"
                                name="email"
                                maxLength={100}
                                placeholder="exemplo@email.com"
                            />
                            <Flex>
                                <Spacer />
                                <Box>
                                    <CustomButton
                                        disabled={submitLoading}
                                        type="submit"
                                        style={{ backgroundColor: COLORS.success }}
                                    >
                                        Enviar e-mail
                                    </CustomButton>
                                </Box>
                            </Flex>
                        </Stack>
                    </Form>
                    <Stack spacing={2}>
                        <LinkText>
                            <Link className="open" to="/login">
                                Voltar para o login
                            </Link>
                        </LinkText>
                        <LinkText>
                            <Link className="open" to="/cadastrar">
                                Não possui conta? Cadastre-se!
                            </Link>
                        </LinkText>
                    </Stack>

                    <BR />
                    <hr />
                </SignWrapper>
            </PageSignWrapper>
        </>
    );
};

const RecoverPassword: React.FC = () => {
    const query = useQuery();

    const token = query.get('token');
    console.log(token);
    //token está sempre null, nunca vai cair na opção SendPassword
    //if (token) {
    //    return (<SendPassword />);
    //} else {
    return (<RequestPasswordRecover />);
    //}
};


export default RecoverPassword;
