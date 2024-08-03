import * as Yup from 'yup';

export const roomSchema = Yup.object().shape({
    code: Yup.string()
        .required('Código obrigatório')
        .max(4, 'O código da sala deve seguir o formato A201'),
    description: Yup.string()
        .required('Descrição obrigatória'),
    capacity: Yup.string()
        .required('Capacidade obrigatória')
        .test({
            test: function (value) {
                return Number(value) > 0;
            },
            message: 'A capacidade precisa ser maior que zero',
        }),
});