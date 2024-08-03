import * as Yup from 'yup';

export const activityCategorySchema = Yup.object().shape({
    code: Yup.string()
        .required('Código obrigatório')
        .matches(/^[a-zA-Z]+$/, { message : 'Não inclua números, espaço, ou símbolos especiais'})
        .max(2, 'O código só pode ter até 2 caracteres'),
    description: Yup.string()
        .required('Descrição obrigatória')
        .max(200, 'A descrição pode ter até 200 caracteres'),
});
