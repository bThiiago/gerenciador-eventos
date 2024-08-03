import * as Yup from 'yup';
import { isValidCPF } from 'utils/isValidCPF';

export const userSchema = Yup.object().shape({
    name: Yup.string()
        .required('Nome obrigatório')
        .test(
            'name',
            'Favor preencher o nome completo para os certificados.',
            (value) => {
                if (!value) {
                    return false;
                }

                const words = value.trim().split(/\s+/g);
                const hasMoreThanTwoWords = words.length > 2;
                const secondWordHasMoreThanTwoChars =
                    words.length > 1 && words[1].length > 2;

                return hasMoreThanTwoWords || secondWordHasMoreThanTwoChars;
            }
        ).max(150, 'Quantidade máxima de 150 caracteres atingida no campo Nome.'),
    email: Yup.string()
        .required('Email obrigatório')
        .email('Email inválido')
        .max(120, 'Quantidade máxima de 120 caracteres atingida no campo Email.'),
    cpf: Yup.string()
        .test('cpf', 'CPF inválido', (value) => isValidCPF(value))
        .length(14, 'Formato inadequado')
        .min(1, 'CPF obrigatório'),
    cellphone: Yup.string()
        .length(15, 'Formato inadequado')
        .min(1, 'Celular obrigatório').notRequired(),
    birth: Yup.date().typeError('Selecione uma data'),
});

export const userPasswordSchema = Yup.object().shape({
    password: Yup.string().required('Senha obrigatória')
        .test({
            message: 'As senhas não são iguais',
            test(value) {
                return (
                    !this.parent.password ||
                    this.parent.password == value
                );
            },
        })
        .test({
            message: 'A senha deve ter pelo menos 6 caracteres',
            test: (value) => !value || value.length >= 6,
        })
        .max(60, 'Quantidade máxima de 60 caracteres atingida no campo Senha.'),
    confirmPassword: Yup.string().required('Senha obrigatória')
        .test({
            message: 'A senha deve ter pelo menos 6 caracteres',
            test: (value) => !value || value.length >= 6,
        })
        .test({
            message: 'As senhas não são iguais',
            test(value) {
                return (
                    !this.parent.password ||
                    this.parent.password == value
                );
            },
        })
        .max(60, 'Quantidade máxima de 60 caracteres atingida no campo Confirmação de Senha.'),
});