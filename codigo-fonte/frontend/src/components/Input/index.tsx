import React, { useEffect, useRef } from 'react';
import { useField } from '@unform/core';
import { Container } from './styled';
import { Input as InputChakra, InputProps as InputPropsChakra, } from '@chakra-ui/react';
import COLORS from 'constants/COLORS';

interface Props {
    name: string;
    label?: string;
    allowNegative?: boolean;
}
export type InputProps = InputPropsChakra & Props;

const Input: React.FC<InputProps> = ({
    name,
    label,
    allowNegative,
    ...rest
}: InputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { fieldName, defaultValue, registerField, error } = useField(name);

    const preventPasteNegative = (e : React.ClipboardEvent) => {
        if (allowNegative != null && !allowNegative) {
            const clipboardData = e.clipboardData;
            if(clipboardData) {
                const pastedData = parseFloat(clipboardData.getData('text'));

                if (pastedData < 0) {
                    e.preventDefault();
                }
            }
        }
    };

    const preventMinus = (e : React.KeyboardEvent) => {
        if (allowNegative != null && !allowNegative) {
            if (e.code === 'Minus') {
                e.preventDefault();
            }
        }
    };

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: inputRef,
            getValue: (ref) => {
                return ref.current.value;
            },
            setValue: (ref, value) => {
                ref.current.value = value;
            },
            clearValue: (ref) => {
                ref.current.value = '';
            },
        });
    }, [fieldName, registerField]);
    return (
        <Container>
            {label && <label htmlFor={fieldName}>{label}</label>}
            <InputChakra
                isInvalid={error != undefined}
                errorBorderColor={COLORS.danger}
                id={fieldName}
                ref={inputRef}
                defaultValue={defaultValue}
                variant="outline"
                onKeyPress={preventMinus}
                onPaste={preventPasteNegative}
                min={1}
                {...rest}
            />
            {error && <span>{error}</span>}
        </Container>
    );
};

export default Input;
