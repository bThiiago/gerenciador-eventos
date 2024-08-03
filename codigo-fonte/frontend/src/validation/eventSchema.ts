import * as Yup from 'yup';

export const eventSchema = Yup.object().shape({
    edition: Yup.string().min(1, 'Informe a edição'),
    description: Yup.string().required('Preencha a descrição'),
    area: Yup.number()
        .typeError('Selecione a área')
        .required('Selecione a área'),
    category: Yup.number()
        .typeError('Selecione a categoria')
        .required('Selecione a categoria'),
    responsible: Yup.array()
        .of(Yup.number())
        .required()
        .min(1, 'Selecione pelo menos 1 organizador'),
    dateRange: Yup.array().test(
        'selectedRange',
        'Selecione o período',
        (item) => {
            if (item) {
                if (item[0]) {
                    return !isNaN(item[0].getTime());
                }
            }
            return false;
        }
    ),
    dateRangeRegistry: Yup.array().test(
        'selectedRange',
        'Selecione o período',
        (item) => {
            if (item) {
                if (item[0]) {
                    return !isNaN(item[0].getTime());
                }
            }
            return false;
        }
    ),
});

export const eventEditSchema = Yup.object().shape({
    area: Yup.number()
        .typeError('Selecione a área')
        .required('Selecione a área'),
    responsibleUsers: Yup.array()
        .of(Yup.number())
        .required()
        .min(1, 'Selecione pelo menos 1 organizador'),
    dateRange: Yup.array()
        .optional()
        .test('selectedRange', 'Selecione o período', (item) => {
            if (item && item[0]) {
                return !isNaN(item[0].getTime());
            }
            return true;
        }),
    dateRangeRegistry: Yup.array()
        .optional()
        .test('selectedRange', 'Selecione o período', (item) => {
            if (item && item[0]) {
                return !isNaN(item[0].getTime());
            }
            return true;
        }),
    statusVisible: Yup.bool().required('Marque o status'),
    description: Yup.string().required('Informe a descrição')
});