import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Bars, Nav, StyledBurger } from 'components/Navbar/styled';
import { NavComponent, useNav } from 'hooks/navbar';

import NavbarLink from 'components/NavbarItems/NavbarLink';
import NavbarText from 'components/NavbarItems/NavbarText';
import Button from 'components/Button';
import LoginInfo from 'components/LoginInfo';

export type SideNavProps = {
    activeItemUrl?: string;
};

const Navbar: React.FC<SideNavProps> = ({ activeItemUrl }) => {
    const { items } = useNav();

    const [open, setOpen] = useState(false);

    const mapNavItems = () => {
        const mappedItems = items.map((item: NavComponent, index) => {
            let component: JSX.Element = <div></div>;
            if (!item.link && !item.button) {
                component = (
                    <NavbarText
                        key={index}
                        style={item.style}
                        title={item.title}
                    />
                );
            } else if (item.link) {
                const isActive =
                    item.link.url === activeItemUrl ||
                    item.link.url + '/' === activeItemUrl ||
                    item.link.url === activeItemUrl + '/';
                component = (
                    <NavbarLink
                        key={index}
                        style={item.style}
                        title={item.title}
                        url={item.link.url}
                        active={isActive}
                    />
                );
            } else if (item.button) {
                component = (
                    <Button
                        key={index}
                        style={item.style}
                        link={item.button.link}
                        onClick={item.button.onClick}
                    >
                        {item.title}
                    </Button>
                );
            }
            return component;
        });
        return mappedItems;
    };

    return (
        <>
            {items.length > 0 && (
                <Nav tabIndex={0} onMouseLeave={() => setOpen(false)} role="navigation" aria-label="side-navigation">
                    <StyledBurger open={open} onClick={() => setOpen(!open)}>
                        <div />
                        <div />
                        <div />
                    </StyledBurger>
                    <Bars open={open}>
                        {mapNavItems()}
                        <LoginInfo />
                    </Bars>
                </Nav>
            )}
        </>
    );

};

Navbar.propTypes = {
    activeItemUrl: PropTypes.string,
};

export default Navbar;
