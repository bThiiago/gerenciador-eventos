import * as Yup from 'yup';

export const eventAreaSchema = Yup.object().shape({
    name: Yup.string()
        .required('Nome obrigatório')
        .max(60, 'O nome pode ter até 60 caracteres'),
    sigla: Yup.string()
        .required('Sigla obrigatória')
        .max(10, 'A sigla pode ter até 10 caracteres'),
});