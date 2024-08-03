import React, { forwardRef, useEffect, useRef, useState } from 'react';
import ReactDatePicker, { ReactDatePickerProps } from 'react-datepicker';
import pt from 'date-fns/locale/pt-BR';
import PropTypes from 'prop-types';

import { useField } from '@unform/core';

import DatePickerInput from '../DatePickerInput';

import 'react-datepicker/dist/react-datepicker.css';
import '../sizefix.css';
import COLORS from 'constants/COLORS';

interface Props extends Omit<ReactDatePickerProps, 'onChange'> {
    name: string;
    label?: string;
}

const DatePicker: React.FC<Props> = ({ name, label, ...rest }: Props) => {
    const datepickerRef = useRef(null);
    const { fieldName, registerField, defaultValue, error } = useField(name);

    const [startDate, setStartDate] = useState(
        defaultValue ? defaultValue : null
    );

    const onChange = (dates: Date) => {
        const start = dates;
        setStartDate(start);
    };

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: datepickerRef.current,
            getValue: (ref) => {
                return ref.props.startDate;
            },
            clearValue: (ref) => {
                ref.clear();
            },
        });
    }, [fieldName, registerField]);

    type ButtonProps = React.HTMLProps<HTMLInputElement>;

    const CustomInput = forwardRef<HTMLInputElement, ButtonProps>(
        (props, ref) => {
            const startingDate = startDate as Date;
            
            let outputValue = '';

            if (startingDate) {
                outputValue = startingDate.toLocaleDateString('pt-BR');
            }

            return (
                <DatePickerInput
                    fieldName={fieldName}
                    onClick={props.onClick}
                    placeholder={props.placeholder}
                    onChange={props.onChange}
                    outputValue={outputValue}
                    forwardRef={ref}
                />
            );
        }
    );

    CustomInput.displayName = 'CustomInput';
    CustomInput.propTypes = {
        value: PropTypes.string,
        onClick: PropTypes.func,
        onChange: PropTypes.func,
        placeholder: PropTypes.string,
    };

    return (
        <div style={{ width: '100%' }}>
            {label && (
                <>
                    <label htmlFor={fieldName}>{label}</label>
                    <br />
                </>
            )}
            <ReactDatePicker
                dateFormat="dd/MM/yyyy"
                selected={startDate}
                ref={datepickerRef}
                onChange={onChange}
                startDate={startDate}
                locale={pt}
                customInput={<CustomInput />}
                
                {...rest}
            />
            {error && <span style={{ color: COLORS.danger }}>{error}</span>}
        </div>
    );
};

export default DatePicker;
