import React from 'react';

import { DatePickerInputStyle } from './styled';

interface Props extends React.HTMLProps<HTMLInputElement> {
    fieldName : string;
    forwardRef : React.ForwardedRef<HTMLInputElement>;
    ref ?: React.ForwardedRef<HTMLInputElement>;
    outputValue : string;
}

const DatePickerInput: React.FC<Props> = ({ fieldName, forwardRef, ref, outputValue, onClick, placeholder, onChange, disabled }: Props) => {
    return (
        <DatePickerInputStyle
            id={fieldName}
            onClick={onClick}
            placeholder={placeholder}
            onChange={onChange}
            value={outputValue}
            autoComplete={'off'}
            disabled={disabled}
            ref={forwardRef ? forwardRef : ref}
        />
    );
};

export default DatePickerInput;
