import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

import Select from 'components/Select';
import { Form } from '@unform/web';

const selectLabel = 'Select Label';
const dummyOptions = [
    {
        value: 0,
        label: 'Chocolate',
    },
    {
        value: 1,
        label: 'Morango',
    },
    {
        value: 2,
        label: 'Creme',
    },
];

describe('renderizar componente', () => {
    test('renderizar corretamente com placeholder', () => {
        const { queryByLabelText, queryByRole, queryByText } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
            >
                <Select
                    name="flavor"
                    options={dummyOptions}
                    label={selectLabel}
                    placeholder="Selecione um sabor"
                />
            </Form>
        );
        expect(queryByRole('textbox')).toBeInTheDocument();
        expect(queryByText('Selecione um sabor')).toBeInTheDocument();
        expect(queryByLabelText(selectLabel)).toBeInTheDocument();
    });

    test('renderizar corretamente com um valor padrão de morango', () => {
        const { queryByText } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
                initialData={{
                    flavor: {
                        value: 1,
                    },
                }}
            >
                <Select
                    name="flavor"
                    options={dummyOptions}
                    label={selectLabel}
                />
            </Form>
        );
        expect(queryByText('Morango')).toBeInTheDocument();
    });

    test('renderizar corretamente com vários valores padrões (chocolate e creme)', () => {
        const { queryByText } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
                initialData={{
                    flavor: [
                        {
                            value: 2,
                        },
                        {
                            value: 0,
                        },
                    ],
                }}
            >
                <Select
                    name="flavor"
                    isMulti
                    options={dummyOptions}
                    label={selectLabel}
                />
            </Form>
        );
        expect(queryByText('Creme')).toBeInTheDocument();
        expect(queryByText('Chocolate')).toBeInTheDocument();
    });
});

describe('manipular valores', () => {
    test('selecionar o valor de morango, e depois de chocolate', () => {
        const { getByText, queryByText, getByRole } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
            >
                <Select
                    name="flavor"
                    options={dummyOptions}
                    label={selectLabel}
                    placeholder="Selecione"
                />
            </Form>
        );

        fireEvent.mouseDown(getByRole('textbox'));
        fireEvent.click(getByText('Morango'));
        expect(queryByText('Morango')).toBeInTheDocument();

        fireEvent.mouseDown(getByRole('textbox'));
        fireEvent.click(getByText('Chocolate'));
        expect(queryByText('Chocolate')).toBeInTheDocument();
    });

    test('não selecionar e voltar para o mesmo valor de placeholder', () => {
        const { queryByText, getByRole } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
            >
                <Select
                    name="flavor"
                    options={dummyOptions}
                    label={selectLabel}
                    placeholder="Selecione"
                />
            </Form>
        );

        fireEvent.mouseDown(getByRole('textbox'));
        fireEvent.blur(getByRole('textbox'));
        expect(queryByText('Selecione')).toBeInTheDocument();
    });

    test('digitar "o" e selecionar chocolate, depois digitar "o" e selecionar morango', () => {
        const { getByText, queryByText, getByRole } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
            >
                <Select
                    name="flavor"
                    options={dummyOptions}
                    label={selectLabel}
                    placeholder="Selecione"
                />
            </Form>
        );

        fireEvent.change(getByRole('textbox'), { target: { value: 'o' } });
        fireEvent.click(getByText('Chocolate'));
        expect(queryByText('Chocolate')).toBeInTheDocument();

        fireEvent.change(getByRole('textbox'), { target: { value: 'o' } });
        fireEvent.click(getByText('Morango'));
        expect(queryByText('Morango')).toBeInTheDocument();
    });

    test('digitar "n" e não conseguir selecionar creme', () => {
        const { queryByText, getByRole } = render(
            <Form
                data-testid="form"
                onSubmit={() => {
                    return;
                }}
            >
                <Select
                    name="flavor"
                    options={dummyOptions}
                    label={selectLabel}
                    placeholder="Selecione"
                />
            </Form>
        );

        fireEvent.change(getByRole('textbox'), { target: { value: 'n' } });
        expect(queryByText('Creme')).toBeNull();
    });
});
