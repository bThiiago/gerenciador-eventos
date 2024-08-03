import React from 'react';
import PropTypes from 'prop-types';
import { Container, Slider, Switch } from './styled';

type InputProps = JSX.IntrinsicElements['input'];

const Toggle: React.FC<InputProps> = ({ 
    checked = false,
    ...rest
}) => {
    return (
        <Container>
            <Switch>
                <input
                    defaultChecked={checked}
                    type="checkbox"
                    {...rest}
                />
                <Slider />
            </Switch>
        </Container>
    );
};

Toggle.propTypes = {
    checked: PropTypes.bool
};

export default Toggle;
