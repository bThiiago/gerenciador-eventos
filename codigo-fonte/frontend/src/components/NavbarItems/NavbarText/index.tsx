import React from 'react';
import { Wrapper } from './styled';
import PropTypes from 'prop-types';

interface NavbarTextProps {
    title : string;
    style ?: React.CSSProperties;
}

const NavbarText : React.FC<NavbarTextProps> = (props) => {
    return (
        <Wrapper style={props.style}>
            {props.title}
        </Wrapper>
    );
};

NavbarText.propTypes = {
    title : PropTypes.string.isRequired,
    style : PropTypes.any,
};

export default NavbarText;