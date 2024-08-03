import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import Input from 'components/Input';
import { Form } from '@unform/web';

const inputLabel = 'Input Label Test';
const inputPlaceholder = 'example: test@test.com';

describe('Componente de Input', () => {
    test('renderizar corretamente o básico', () => {
        render(
            <Form onSubmit={() => { return; }}>
                <Input name='test' label={inputLabel} placeholder={inputPlaceholder} />
            </Form>
        );

        expect(screen.queryByRole('textbox')).toBeInTheDocument();
        expect(screen.queryByLabelText(inputLabel)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(inputPlaceholder)).toBeInTheDocument();
    });

    test('preencher um valor com sucesso', () => {
        render(
            <Form onSubmit={() => { return; }}>
                <Input name='test' label={inputLabel} placeholder={inputPlaceholder} />
            </Form>
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;
        const stringValue = 'Estou digitando algo';

        fireEvent.change(input, { target : { value : stringValue }});
        expect(input.value).toBe(stringValue);
    });

    test('não preencher texto em input numérico, apenas números', () => {
        render(
            <Form onSubmit={() => { return; }}>
                <Input name='test' label={inputLabel} placeholder={inputPlaceholder} type="number" />
            </Form>
        );
        const input = screen.getByRole('spinbutton') as HTMLInputElement;

        let stringValue = 'abcde';
        fireEvent.change(input, { target : { value : stringValue }});
        expect(input.value).toBe('');

        stringValue = '12345';
        fireEvent.change(input, { target : { value : stringValue }});
        expect(input.value).toBe(stringValue);
    });
});
