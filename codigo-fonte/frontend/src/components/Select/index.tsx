import React, { useCallback, useEffect, useRef } from 'react';
import { OptionTypeBase, Props as ReactSelectProps } from 'react-select';
import { SelectStyle as ReactSelect } from './styled';
import PropTypes from 'prop-types';
import { useField } from '@unform/core';
import COLORS from 'constants/COLORS';

export interface SelectProps extends ReactSelectProps<OptionTypeBase, true> {
    name: string;
    options: {
        value: string | number;
        label: string;
    }[];
    label?: string;
}

export interface SelectOption {
    value: number;
    label: string;
}

const Select: React.FC<SelectProps> = ({ name, options, label, ...rest }) => {
    const selectRef = useRef(null);
    const { fieldName, defaultValue, registerField, error } = useField(name);

    const _rest = rest as any;

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: selectRef.current,
            setValue: (ref, value) => {
                ref.current.value = value;
            },
            getValue: (ref) => {
                if (_rest.isMulti) {
                    if (!ref.state.value) {
                        return [];
                    }
                    return ref.state.value.map(
                        (option: OptionTypeBase) => option.value
                    );
                }
                if (!ref.state.value) {
                    return '';
                }
                return ref.state.value.value;
            },
        });
    }, [fieldName, defaultValue, registerField, _rest.isMulti]);

    const getDefaultValue = useCallback(() => {
        if (defaultValue) {
            if (_rest.isMulti) {
                const possibleValues = defaultValue as OptionTypeBase[];
                const filteredOptions = options.filter((option) => {
                    const index = possibleValues.findIndex((existing) => {
                        return existing.value === option.value;
                    });
                    return index !== -1;
                });
                return filteredOptions;
            } else {
                const possibleValue = defaultValue as OptionTypeBase;
                const option = options.find((option) => {
                    return option.value == possibleValue.value;
                });
                return option;
            }
        }
    }, [defaultValue, options]);

    return (
        <div>
            {label && <label htmlFor={fieldName}>{label}</label>}
            <ReactSelect
                inputId={fieldName}
                defaultValue={getDefaultValue()}
                options={options}
                ref={selectRef}
                classNamePrefix="react-select"
                styles={{
                    container: (provided: any) => ({
                        ...provided,
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                    }),

                    control: (provided: any, state: any) => ({
                        ...provided,
                        background: '#fff',
                        borderWidth: '0',
                        borderColor: 'transparent',
                        height: '25px',
                        boxShadow: state.isFocused ? null : null,
                    }),

                    valueContainer: (provided: any) => ({
                        ...provided,
                        padding: '0 6px',
                    }),

                    singleValue: (provided: any) => ({
                        ...provided,
                        fontSize: 'max(16px, 1em)',
                        padding: '0px',
                    }),

                    placeholder: (provided: any) => ({
                        ...provided,
                        color: 'rgba(0,0,0,0.4)',
                    }),

                    input: (provided: any) => ({
                        ...provided,
                        margin: '0',
                    }),
                    indicatorSeparator: () => ({
                        display: 'none',
                    }),
                }}
                {..._rest}
            />
            {error && <span style={{ color: COLORS.danger }}>{error}</span>}
        </div>
    );
};

Select.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    options: PropTypes.any.isRequired,
};

export default Select;
