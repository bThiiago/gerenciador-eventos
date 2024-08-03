import React from 'react';
import { Wrapper } from './styled';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

interface NavbarLinkProps {
    title : string;
    url : string;
    active : boolean;
    style ?: React.CSSProperties;
}

const NavbarLink : React.FC<NavbarLinkProps> = (props) => {
    return (
        <Link style={{height : '4.5rem'}} to={props.url}>
            <Wrapper active={props.active} style={props.style}>
                {props.title}
            </Wrapper>
        </Link>
    );
};

NavbarLink.propTypes = {
    title : PropTypes.string.isRequired,
    url : PropTypes.string.isRequired,
    active : PropTypes.bool.isRequired,
    style : PropTypes.any,
};

export default NavbarLink;