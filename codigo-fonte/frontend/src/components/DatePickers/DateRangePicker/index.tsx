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
    onValueChange ?: (startDate: Date, endDate: Date) => void;
    onMody ?: (flag: boolean) => void;
    label?: string;
}

const DateRangePicker: React.FC<Props> = ({ name, label, onValueChange, onMody, disabled, ...rest }: Props) => {
    const datepickerRef = useRef(null);
    const { fieldName, registerField, defaultValue, error } = useField(name);

    const [customFlag, setCustomFlag] = useState(false);

    const [startDate, setStartDate] = useState(
        defaultValue ? defaultValue[0] : null
    );
    const [endDate, setEndDate] = useState(
        defaultValue
            ? defaultValue[1]
                ? defaultValue[1]
                : defaultValue[0]
            : null
    );

    const onChange = (dates: [Date, Date]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        setCustomFlag(true);
    };

    const onBlur = () => {
        if(onValueChange && onMody) {
            onValueChange(startDate, endDate ?  endDate : startDate);
            onMody(customFlag ? customFlag : false);
        }
        setCustomFlag(false);
    };

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: datepickerRef.current,
            getValue: (ref) => {
                return [ref.props.startDate, ref.props.endDate];
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
            const endingDate = endDate as Date;

            let outputValue = '';

            if (startingDate) {
                outputValue += startingDate.toLocaleDateString('pt-BR');
                if (
                    endingDate &&
                    (startingDate.getDate() !== endingDate.getDate() ||
                        startingDate.getMonth() !== endingDate.getMonth() ||
                        startingDate.getFullYear() !== endingDate.getFullYear())
                ) {
                    outputValue +=
                        ' até ' + endingDate.toLocaleDateString('pt-BR');
                }
            }

            return (
                <DatePickerInput
                    fieldName={fieldName}
                    onClick={props.onClick}
                    placeholder={props.placeholder}
                    onChange={props.onChange}
                    outputValue={outputValue}
                    forwardRef={ref}
                    disabled={disabled}
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
                endDate={endDate}
                locale={pt}
                selectsRange
                customInput={<CustomInput />}
                disabled={disabled}
                onCalendarClose={onBlur}
                {...rest}
            />
            {error && <span style={{ color: COLORS.danger }}>{error}</span>}
        </div>
    );
};

export default DateRangePicker;
