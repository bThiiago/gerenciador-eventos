import * as Yup from 'yup';

export const activitySchema = Yup.object().shape({
    title: Yup.string().min(1, 'Título obrigatório'),
    description: Yup.string().min(1, 'Descrição obrigatória'),
    vacancy: Yup.string().min(1, 'Informe a quantidade de vagas'),
    workloadInMinutes: Yup.string().min(
        1,
        'Informe a carga horária'
    ),
    responsibleUsers: Yup.array()
        .of(Yup.number())
        .required()
        .min(1, 'Selecione ao menos um responsável'),
    schedules: Yup.array()
        .of(
            Yup.object().shape({
                dateTime: Yup.date()
                    .typeError('Selecione uma data e horário')
                    .required('Selecione uma data e horário'),
                durationInMinutes: Yup.string().min(
                    1,
                    'Informe a duração da atividade'
                ),
                room: Yup.string().test({
                    test: function (value) {
                        const { url } = this.parent;
                        if (url == null || url === '')
                            return value != '';
                        return true;
                    },
                    message:
                        'Você precisa informar a sala ou o link da sala',
                }),
                url: Yup.string().url('Link da sala inválido'),
            })
        )
        .required()
        .min(1, 'Informe ao menos um horário'),
    activityCategory: Yup.number()
        .typeError('Selecione a categoria da atividade')
        .required('Selecione a categoria da atividade'),
});

export const activityEditSchema = Yup.object().shape({
    title: Yup.string().min(1, 'Título obrigatório'),
    description: Yup.string().min(1, 'Descrição obrigatória'),
    responsibleUsers: Yup.array()
        .of(Yup.number())
        .required()
        .min(1, 'Selecione ao menos um responsável'),
    vacancy: Yup.string().min(1, 'Informe a quantidade de vagas'),
    workloadInMinutes: Yup.string().min(
        1,
        'Informe a carga horária'
    ),
    schedules: Yup.array()
        .of(
            Yup.object().shape({
                dateTime: Yup.date()
                    .typeError('Selecione uma data e horário')
                    .required('Selecione uma data e horário'),
                durationInMinutes: Yup.string().min(
                    1,
                    'Informe a duração da atividade nesse dia'
                ),
                room: Yup.string().test({
                    test: function (value) {
                        const { url } = this.parent;
                        if (url == null || url === '')
                            return value != '';
                        return true;
                    },
                    message:
                        'Você precisa informar a sala ou o link da sala',
                }),
                url: Yup.string().url('Link da sala inválido'),
            })
        )
        .required()
        .min(1, 'Informe ao menos um horário'),
    activityCategory: Yup.number()
        .typeError('Selecione a categoria da atividade')
        .required('Selecione a categoria da atividade'),
});

export const activityEditResponsibleSchema = Yup.object().shape({
    title: Yup.string().min(1, 'Título obrigatório'),
    description: Yup.string().min(1, 'Descrição obrigatória'),
    vacancy: Yup.string().min(1, 'Informe a quantidade de vagas'),
    workloadInMinutes: Yup.string().min(
        1,
        'Informe a carga horária'
    ),
});