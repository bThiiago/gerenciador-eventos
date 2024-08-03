/**
 * @description recebe um objeto data e a retorna no formato hh:MM
 **/
export const renderDateAsTime = (date: Date): string => {
    let time = new  Intl.DateTimeFormat(
        'pt-BR', {
            timeZone: 'America/Sao_Paulo',
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(date);
    time = time.substring(12, 17);
    time = time.replace(':', 'h');
    return time;
};

/**
 * @description recebe um objeto data e a retorna no formato dd/MM/YYYY
 **/
export const renderDateAsDayMonth = (date: Date): string => {
    let dateReturn = new  Intl.DateTimeFormat(
        'pt-BR', {
            timeZone: 'America/Sao_Paulo',
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(date);
    dateReturn = dateReturn.substring(0, 10);
    return dateReturn;
};

/**
 * @description retorna um objeto data com o fuso horário GMT-03
 **/
export const getDate = (): Date => {
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short', 
        timeStyle: 'short'
    }).format(new Date()); //essa data está em formato MM/dd/yyyy
    //corrigindo o formato da data de MM/dd/yyyy para dd/MM/yyyy
    const parts = formattedDate.split('/');
    const formattedDateDDMMYYYY = `${parts[1]}/${parts[0]}/${parts[2]}`;
    return new Date(formattedDateDDMMYYYY);
};

export const mapDateToWeekDay = (date: Date): string => {
    switch (date.getDay()) {
        case 0:
            return 'Domingo';
        case 1:
            return 'Segunda-feira';
        case 2:
            return 'Terça-feira';
        case 3:
            return 'Quarta-feira';
        case 4:
            return 'Quinta-feira';
        case 5:
            return 'Sexta-feira';
        case 6:
            return 'Sábado';
    }
    return 'unknown';
};

export const getWorkloadInHours = (minutes : number): number => {
    return Math.round(minutes / 60 * 100) / 100;
};

export const renderDateForPresence = (date: Date, minutes : number): string => {
    return mapDateToWeekDay(date) + ' - ' + renderDateWithTime(date, minutes);
};

export const renderDateWithTime = (date: Date, minutes ?: number): string => {
    let message = renderDateAsDayMonth(date) + ' ' + renderDateAsTime(date);
    if(minutes) message += ' até ' + renderDateAsTime(new Date(date.getTime() + 60000 * minutes));
    return message;
};

export const renderDateRange = (startDate: Date, endDate?: Date): string => {
    const dayOne: string = renderDateAsDayMonth(startDate);

    let dayTwo = '';
    if (
        endDate &&
        (startDate.getDate() !== endDate.getDate() ||
            startDate.getMonth() !== endDate.getMonth() ||
            startDate.getFullYear() !== endDate.getFullYear())
    ) {
        dayTwo = renderDateAsDayMonth(endDate);
        dayTwo = ' - ' + dayTwo;
    }

    return dayOne + dayTwo;
};
