import * as Yup from 'yup';

export const eventCategorySchema = Yup.object().shape({
    category: Yup.string()
        .required('Categoria obrigatória')
        .max(40, 'A categoria pode ter até 60 caracteres'),
    url_src: Yup.string()
        .required('URL obrigatória')
        .max(40, 'A URL pode ter até 60 caracteres'),
});