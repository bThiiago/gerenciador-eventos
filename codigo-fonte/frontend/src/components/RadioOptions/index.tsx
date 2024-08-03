import React, { useEffect, useRef } from 'react';
import { useField } from '@unform/core';

interface Props {
    name: string;
    options: {
        label: string;
        value: string | number;
    }[];
    label?: string;
}

const RadioOptions: React.FC<Props> = ({ name, label, options }: Props) => {
    const { fieldName, defaultValue, registerField, error } = useField(name);
    const radioRef = useRef(defaultValue);


    
    const updateRadioValue = (event : any) => {
        radioRef.current = event.target.value;
    };

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: radioRef,
            getValue: (ref) => {
                return ref.current;
            },
            setValue: (ref, value) => {
                ref.current = value;
            },
        });
    }, [fieldName, registerField]);

    return (
        <div onChange={updateRadioValue}>
            {label && <label htmlFor={fieldName}>{label}</label>}
            {options.map((option, index) => {
                return (
                    <div key={index}>
                        <input
                            type="radio"
                            id={name + index}
                            name={name}
                            value={option.value}
                            defaultChecked={defaultValue === option.value}
                            style={{ marginRight: '0.8rem' }}
                        />
                        <label htmlFor={name + index}>{option.label}</label>
                    </div>
                );
            })}
            {error && <span>{error}</span>}
        </div>
    );
};

export default RadioOptions;
