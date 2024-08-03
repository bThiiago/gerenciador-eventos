
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const handleActivityConflictError = (responseMessage : string, errorData : any, setErrors : (errors : Record<string, string>) => void) : string => {
    let message : string;
    if (responseMessage.includes('própria')) {
        const conflictMessage = 'Conflito de horário';
        const conflictErrors = errorData.map(
            (item: { index: any }) => {
                return {
                    [`schedules[${item.index}].dateTime`]:
                        conflictMessage,
                    [`schedules[${item.index}].durationInMinutes`]:
                        conflictMessage,
                };
            }
        ) as Record<string, string>[];
        const formErrors = conflictErrors.reduce(
            (result, current) => {
                return Object.assign(result, current);
            }
        );
        setErrors(formErrors);
        message =
            'Horários da própria atividade conflitante';
    } else {
        const conflictErrors = errorData.map(
            (item: {
                index: any;
                activityName: string;
                eventName: string;
            }) => {
                const conflictDetail = `Conflito com a atividade "${item.activityName}" do evento ${item.eventName}`;
                return {
                    [`schedules[${item.index}].dateTime`]: conflictDetail,
                    [`schedules[${item.index}].durationInMinutes`]: conflictDetail,
                    [`schedules[${item.index}].room`]: conflictDetail,
                };
            }
        ) as Record<string, string>[];
        const formErrors = conflictErrors.reduce(
            (result, current) => {
                return Object.assign(result, current);
            }
        );
        setErrors(formErrors);
        message =
            'Horário em conflito com outras atividades';
    }
    return message;
};

export default handleActivityConflictError;