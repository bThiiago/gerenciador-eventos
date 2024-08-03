import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Input from 'components/Input';
import { cep, cep_string, cpf, cpf_string, editionMask, editionMask_string, phone, phone_string } from './masks';
import { InputProps as InputPropsChakra, } from '@chakra-ui/react';
import './styled.css';
import { useField } from '@unform/core';


interface Props {
    mask: 'cep' | 'cpf' | 'phone' | 'editionMask';
    prefix?: string;
    label?: string;
    name: string;
    placeholder: string;
    maxLength?: number;
}
export type InputProps = InputPropsChakra & Props;

const InputMask: React.FC<InputProps> = ({mask, prefix, label, name, placeholder, maxLength, ...rest}) => {
    
    const { defaultValue } = useField(name);

    const handleKey = useCallback(
        (e: React.FormEvent<HTMLInputElement>) => {
            if (mask === 'cep') {
                cep(e);
            }
            if (mask === 'cpf') {
                cpf(e);
            }
            if (mask === 'phone') {
                phone(e);
            }
            if (mask === 'editionMask') {
                editionMask(e);
            }
        },
        [mask]
    );

    const putString = (value: string) => {
        
        if (mask === 'cep') {
            return cep_string(value);
        }
        if (mask === 'cpf') {
            return cpf_string(value);
        }
        if (mask === 'phone') {
            return phone_string(value);
        }
        if (mask === 'editionMask') {
            return editionMask_string(value);
        }
        return value;
    };

    return (
        <div className='input-group prefix'>
            {prefix && <span className='prefix-span'>{prefix}</span>}
            <Input 
                label={label} 
                name={name} 
                placeholder={placeholder}
                defaultValue={(
                    defaultValue ? 
                        putString(defaultValue as string) :
                        ''
                )}
                onKeyDown={handleKey}
                onKeyUp={handleKey}
                maxLength={maxLength}
                {...rest}
            />
        </div>
    );
};

InputMask.propTypes = {
    mask : PropTypes.any.isRequired,
    prefix: PropTypes.string,
    label: PropTypes.string,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    maxLength: PropTypes.number
};

export default InputMask;