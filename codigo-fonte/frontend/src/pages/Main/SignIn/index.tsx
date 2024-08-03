import React, { useRef, useState } from 'react';
import { useAuth } from '../../../hooks/auth';
import { Link, useHistory } from 'react-router-dom';
import { FormHandles, SubmitHandler } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import getValidationError from 'utils/getValidationErrors';
import Navbar from 'components/Navbar';
import COLORS from 'constants/COLORS';
import {
    LinkText,
    PageSignWrapper,
    SignTitle,
    SignWrapper,
} from 'custom-style-components';
import {
    Box,
    Flex,
    Spacer,
    Stack,
} from '@chakra-ui/react';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import TOAST from 'constants/TOAST';
import { useToast } from '@chakra-ui/toast';
import CustomButton from 'components/Button';
import Input from 'components/Input';
import Footer from 'components/Footer';
import { CustomPassword } from 'components/CustomPassword';

interface FormData {
    identifier: string; // Combinar CPF e e-mail em um único campo
    password: string;
}

const SignIn: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const formRef = useRef<FormHandles>(null);

    const [submitLoading, setSubmitLoading] = useState(false);

    const { signInCpf, signIn } = useAuth(); // incluir ambos os métodos de login
    const history = useHistory();

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitLoading(true);
        try {
            formRef.current?.setErrors({});

            const schema = Yup.object().shape({
                identifier: Yup.string()
                    .required('CPF ou E-mail obrigatório'),
                password: Yup.string().required('Senha obrigatória'),
            });

            await schema.validate(data, {
                abortEarly: false,
            });

            if (data.identifier.includes('@')) {
                // Se o identificador contém '@', é um email
                await signIn({ email: data.identifier, password: data.password });
            } else {
                // Se não tem, considere que é um CPF
                await signInCpf({ cpf: data.identifier, password: data.password });
            }

            history.push('/');
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const errors = getValidationError(err);

                formRef.current?.setErrors(errors);
                return;
            }

            if (err instanceof GenericFrontError) {
                let message = err.message;
                if (err instanceof ResponseError) {
                    if (err.status === 400) message = 'Credenciais incorretas';
                    if (err.status === 403)
                        message = 'Sua conta foi desativada';
                    if (err.status === 412)
                        message = 'Ative a sua conta pelo seu e-mail';
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
                <SignTitle>Entrar</SignTitle>
                <SignWrapper>
                    <Form ref={formRef} onSubmit={onSubmit}>
                        <Stack spacing={4}>
                            <Input
                                name="identifier"
                                placeholder="CPF ou Email"
                                fontSize="lg"
                                size="md"
                            />
                            <CustomPassword />
                            <Flex>
                                <Spacer />
                                <Box>
                                    <CustomButton
                                        disabled={submitLoading}
                                        type="submit"
                                        style={{
                                            backgroundColor: COLORS.success,
                                        }}
                                    >
                                        Entrar
                                    </CustomButton>
                                </Box>
                            </Flex>
                        </Stack>
                    </Form>
                    <Stack spacing={2}>
                        <LinkText>
                            <Link className="open" to="/recuperar_senha">
                                Esqueci minha senha
                            </Link>
                        </LinkText>
                        <LinkText>
                            <Link className="open" to="/cadastrar">
                                Não possui conta? Cadastre-se!
                            </Link>
                        </LinkText>
                    </Stack>
                    <hr />
                </SignWrapper>
            </PageSignWrapper>
            <Footer />
        </>
    );
};

export default SignIn;