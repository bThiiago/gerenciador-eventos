import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { FormWrapper, PageContentWrapper, PageTitle, } from 'custom-style-components';
import Input from 'components/Input';
import InputMask from 'components/InputMask';
import Select from 'components/Select';
import DatePicker from 'components/DatePickers/DatePicker';
import { Wrapper } from './styled';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import { api } from 'services/axios';
import { City, People, Uf } from 'types/models';
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { useAuth } from 'hooks/auth';
import { ResponseError } from 'errors/ResponseError';
import { fetchOneUser } from 'services/fetch/users';
import { OptionTypeBase } from 'react-select';
import CustomButton from 'components/Button';
import { EditIcon, LockIcon } from '@chakra-ui/icons';


const ReadUser: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });
    const [loading, setLoading] = useState(true);
    const formRef = useRef<FormHandles>(null);
    const [cities, setCity] = useState<City[]>([]);
    const [uf, setUf] = useState<Uf[]>([]);
    const [error, setError] = useState<string>();
    const [usuario, setPeople] = useState<People>();


    const { user } = useAuth();

    useEffect(() => {
        const source = createCancelTokenSource();
        setLoading(true);
        if (user) {
            fetchOneUser(source.token, user.id)
                .then((user) => {
                    setPeople(user);
                }).catch((error) => {
                    if (error instanceof GenericFrontError) {
                        let message = error.message;
                        if (error instanceof ResponseError && error.status === 404)
                            message = 'Usuário não encontrado.';
                        setError(message);
                    }
                });
        }
    }, []);


    useEffect(() => {
        setLoading(true);
        api({
            baseURL: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
            method: 'GET',
        }).then((response) => {
            const data = response.data;
            setUf(data);
            renderSelect(usuario?.uf);
        }).catch(() => {
            toast({
                title: 'Ocorreu um erro na consulta de API de localidades',
                status: 'error',
            });
        }).finally(() => setLoading(false));

    }, []);



    const renderSelect = (uf: OptionTypeBase | string | undefined) => {
        setLoading(true);
        if (typeof uf === 'object') {
            uf = uf.value;
        }

        if (uf) {
            api({
                baseURL: `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
                method: 'GET',
            }).then(
                (response) => setCity(response.data)
            ).catch(() => {
                toast({
                    title: 'Ocorreu um erro na consulta de API de localidades',
                    status: 'error',
                });
            });
        }
    };

    type SelectProps = React.HTMLProps<HTMLSelectElement>;

    const CustomSelect = forwardRef<HTMLSelectElement, SelectProps>(() => {
        const options = [{ value: 'select_vazio', label: 'select_vazio' }];
        const defaultValue = [{ value: usuario?.city, label: usuario?.city }];

        if (uf) {
            return (
                <Select
                    name="city"
                    defaultValue={defaultValue}
                    label="Cidade"
                    className="tail"
                    menuPlacement="top"
                    options={cities.map((a) => ({
                        value: a.nome,
                        label: a.nome,
                    }))}
                    placeholder="Escolha a cidade"
                    isDisabled={true}

                />
            );
        }
        return (
            <Select
                name="city"
                label="Cidade"
                className="tail"
                menuPlacement="top"
                options={options}
                placeholder="Escolha a cidade"
                isDisabled={true}

            />
        );


    });
    CustomSelect.displayName = 'CustomSelect';


    return (
        <>
            <PageContentWrapper>
                <FormWrapper>
                    <PageTitle>Meus dados</PageTitle>

                    {error ? (
                        <ErrorMessage>{error}</ErrorMessage>
                    ) : loading ? (
                        <LoadingSpinner />
                    ) : usuario ? (
                        <>
                            <CustomButton
                                link={`/dashboard/usuario/${usuario.name}/alterar`}
                            >
                                <EditIcon /> Alterar dados
                            </CustomButton>
                            <CustomButton
                                link={`/dashboard/usuario/${usuario.id}/alterar_senha`}
                                style={{ marginLeft: '0.8rem' }}
                            >
                                <LockIcon /> Alterar senha
                            </CustomButton>

                            <Form
                                ref={formRef}
                                onSubmit={() => { return; }}

                                initialData={{
                                    name: usuario?.name,
                                    email: usuario?.email,
                                    cpf: usuario?.cpf,
                                    cellphone: usuario?.cellphone,
                                    cep: usuario?.cep,
                                    birth: usuario?.birthDate,
                                    city: {
                                        value: usuario?.city,
                                    },

                                    uf: {
                                        value: usuario?.uf,
                                    },
                                    address: usuario?.address,

                                }}

                            >
                                <Input
                                    label="Nome*"
                                    name="name"
                                    placeholder="Insira o nome completo"
                                    isReadOnly={true}
                                />
                                <Wrapper>
                                    <InputMask
                                        name="cpf"
                                        label="CPF*"
                                        mask="cpf"
                                        maxLength={14}
                                        className="head"
                                        placeholder="CPF no formato 999.999.999-99"
                                        isReadOnly={true}
                                    />
                                    <Input
                                        label="Email*"
                                        name="email"
                                        maxLength={120}
                                        placeholder="exemplo@email.com"
                                        isReadOnly={true}
                                    />
                                </Wrapper>
                                <Wrapper>
                                    <InputMask
                                        name="cellphone"
                                        label="Celular"
                                        mask="phone"
                                        maxLength={14}
                                        className="tail"
                                        placeholder="Celular no formato (11) 91112-2222"
                                        isReadOnly={true}
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
                                        readOnly={true}
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
                                        isReadOnly={true}
                                    />
                                    <Input
                                        label="Endereço"
                                        name="address"
                                        maxLength={100}
                                        placeholder="Insira a rua e o número"
                                        isReadOnly={true}
                                    />
                                </Wrapper>
                                <Wrapper>
                                    
                                    <Select
                                        name="uf"
                                        label="Estado"
                                        className="head"
                                        menuPlacement="top"
                                        options={uf.map((a) => ({
                                            value: a.sigla,
                                            label: a.nome,
                                        }))}
                                        placeholder="ex. SP, RJ, MG..."
                                        isDisabled={true}
                                    />


                                    <CustomSelect />

                                </Wrapper>
                            </Form>
                        </>
                    ) : (
                        <p>Não foi possivel carregar o usuário. Tente mais tarde</p>
                    )}
                </FormWrapper>
            </PageContentWrapper>
        </>
    );
};

export default ReadUser;

/*
                                

*/