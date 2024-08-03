import React from 'react';
import PropTypes from 'prop-types';
import Input from '../Input';
import { Input as InputChakra, InputProps as InputPropsChakra } from '@chakra-ui/react';

interface Props {
    label?: string;
}

type InputProps = InputPropsChakra & Props;

/*
* Quando se é fornecido o nome, irá utilizar o componente {Input},
* pois se trataria de algo em um formulário. E quando não for pertencente ao 
* formulário deve-se utilizar o input comum
*
* Obs: foi a unica forma que consegui fazer funcionar
*/

const Checkbox: React.FC<InputProps> = ({ name, ...rest }) => {
    return (
        name ? (
            <Input
                name={name}
                type="checkbox"
                defaultChecked={rest.checked}
                {...rest}
            />  
        ) : (
            <InputChakra type="checkbox" checked={rest.checked} {...rest} />
        )
    );
};

Checkbox.propTypes = {
    name: PropTypes.string,
};

export default Checkbox;
