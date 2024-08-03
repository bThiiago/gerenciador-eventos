import React, { useEffect, useRef } from 'react';
import { useField } from '@unform/core';
import { Container } from './styled';
import { Textarea } from '@chakra-ui/textarea';

interface Props {
    name: string;
    label?: string;
}
type TextAreaProps = JSX.IntrinsicElements['textarea'] & Props;

const TextArea: React.FC<TextAreaProps> = ({ name, label, ...rest }: TextAreaProps) => {
    const textRef = useRef<HTMLTextAreaElement>(null);
    const { fieldName, defaultValue, registerField, error } = useField(name);
    useEffect(() => {
        registerField({
            name: fieldName,
            ref: textRef,
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
            <Textarea
                id={fieldName}
                ref={textRef}
                defaultValue={defaultValue}
                {...rest}
            />
            {error && <span>{error}</span>}
        </Container>
    );
};

export default TextArea;