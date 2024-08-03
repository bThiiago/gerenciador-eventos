//ESSE ARQUIVO É USADO PARA TESTES AUTOMATIZADOS DO DATERANGEPICKER

import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

import DateRangePicker from 'components/DateRangePicker';
import { Form } from '@unform/web';

const dateLabel = 'Date Label';
const placeholder = 'Selecione a data';

describe('renderizar componente', () => {
    test('renderizar corretamente', () => {
        const { queryByLabelText, queryByPlaceholderText, queryByRole } =
            render(
                <Form
                    data-testid="form"
                    onSubmit={() => {
                        return;
                    }}
                >
                    <DateRangePicker
                        name="dateRange"
                        label={dateLabel}
                        placeholderText={placeholder}
                    />
                </Form>
            );
        expect(queryByRole('textbox')).toBeInTheDocument();
        expect(queryByLabelText(dateLabel)).toBeInTheDocument();
        expect(queryByPlaceholderText(placeholder)).toBeInTheDocument();
    });

    test('renderizar corretamente com um valor padrão (data unica)', () => {
        const { queryByDisplayValue } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
                initialData={{
                    dateRange : [new Date('2021-02-02T00:00:00'), new Date('2021-02-02T00:00:00')]
                }}
            >
                <DateRangePicker
                    name="dateRange"
                    label={dateLabel}
                    placeholderText={placeholder}
                />
            </Form>
        );
        expect(queryByDisplayValue('02/02/2021')).toBeInTheDocument();
    });

    test('renderizar corretamente com um valor padrão (duas datas)', () => {
        const { getByDisplayValue } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
                initialData={{
                    dateRange : [new Date('2021-02-02T00:00:00'), new Date('2021-02-10T00:00:00')]
                }}
            >
                <DateRangePicker
                    name="dateRange"
                    label={dateLabel}
                    placeholderText={placeholder}
                />
            </Form>
        );
        expect(getByDisplayValue('02/02/2021 até 10/02/2021')).toBeInTheDocument();
    });
});

describe('manipular valores', () => {
    test('selecionar um intervalo de data do dia 13 até o dia 15', () => {
        const { getByRole, getByText, queryByDisplayValue } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
            >
                <DateRangePicker
                    name="dateRange"
                    label={dateLabel}
                    placeholderText={placeholder}
                />
            </Form>
        );
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const startDate = new Date(currentYear, currentMonth, 13);
        const endDate = new Date(currentYear, currentMonth, 15);
        const format = startDate.toLocaleDateString('pt-BR') + ' até ' + endDate.toLocaleDateString('pt-BR');

        const input = getByRole('textbox');
        fireEvent.click(input);
        fireEvent.click(getByText('13'));
        fireEvent.click(getByText('15'));
        expect(queryByDisplayValue(format)).toBeInTheDocument();
    });

    test('selecionar a mesma data do dia 16', () => {
        const { getByRole, getByText, queryByDisplayValue } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
            >
                <DateRangePicker
                    name="dateRange"
                    label={dateLabel}
                    placeholderText={placeholder}
                />
            </Form>
        );
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const date = new Date(currentYear, currentMonth, 16);
        const format = date.toLocaleDateString('pt-BR');

        const input = getByRole('textbox');
        fireEvent.click(input);
        fireEvent.click(getByText('16'));
        fireEvent.click(getByText('16'));
        expect(queryByDisplayValue(format)).toBeInTheDocument();
    });
});
