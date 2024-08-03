import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
    identifier: Yup.string()
        .required('CPF ou E-mail obrigatório'),
    password: Yup.string().required('Senha obrigatória'),
});