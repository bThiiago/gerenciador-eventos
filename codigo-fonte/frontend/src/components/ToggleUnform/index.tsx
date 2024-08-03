import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Container, Slider, Switch } from './styled';
import { useField } from '@unform/core';

interface Props {
    name?: string;
    label?: string;
}

type InputProps = JSX.IntrinsicElements['input'] & Props;

const ToggleUnform: React.FC<InputProps> = ({ 
    label,
    name = '',
    ...rest
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { fieldName, defaultValue, registerField, error } = useField(name);

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: inputRef,
            getValue: (ref) => {
                return ref.current.checked;
            },
            setValue: (ref, value) => {
                ref.current.checked = value;
            },
            clearValue: (ref) => {
                ref.current.value = '';
            },
        });
    }, [fieldName, registerField]);

    return (
        <Container>
            <p>{label}</p>
            <Switch>
                <input
                    id={fieldName}
                    ref={inputRef}
                    defaultChecked={defaultValue}
                    type="checkbox"
                    {...rest}
                />
                <Slider />
            </Switch>
            { error && <span>{ error }</span> }
        </Container>
    );
};

ToggleUnform.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string.isRequired,
};

export default ToggleUnform;
