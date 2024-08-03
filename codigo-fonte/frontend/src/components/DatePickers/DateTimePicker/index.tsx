import React, { forwardRef, useEffect, useRef, useState } from 'react';
import ReactDatePicker, { ReactDatePickerProps } from 'react-datepicker';
import pt from 'date-fns/locale/pt-BR';
import PropTypes from 'prop-types';

import { useField } from '@unform/core';

import 'react-datepicker/dist/react-datepicker.css';
import '../sizefix.css';
import COLORS from 'constants/COLORS';
import DatePickerInput from '../DatePickerInput';

interface Props extends Omit<ReactDatePickerProps, 'onChange'> {
    name: string;
    label?: string;
}

const DateTimePicker: React.FC<Props> = ({ name, label, ...rest }: Props) => {
    const datepickerRef = useRef(null);
    const { fieldName, registerField, defaultValue, error } = useField(name);

    const [startDate, setStartDate] = useState(
        defaultValue ? defaultValue : null
    );

    const onChange = (date: Date) => {
        setStartDate(date);
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

    const CustomDateInput = forwardRef<HTMLInputElement, ButtonProps>(
        (props, ref) => {
            const startingDate = startDate as Date;

            let outputValue = '';

            if (startingDate) {
                outputValue = startingDate.toLocaleDateString('pt-BR');
                outputValue += ', às ';

                let time = startingDate.toLocaleTimeString('pt-BR');
                time = time.slice(0, 5);

                outputValue += time;
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

    CustomDateInput.displayName = 'CustomDateInput';
    CustomDateInput.propTypes = {
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
                timeIntervals={5}
                showTimeSelect
                customInput={<CustomDateInput />}
                {...rest}
            />
            {error && <span style={{ color: COLORS.danger }}>{error}</span>}
        </div>
    );
};

export default DateTimePicker;
