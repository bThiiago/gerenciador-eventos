import styled from 'styled-components';
import COLORS from 'constants/COLORS';

interface INav {
    open: boolean;
    href?: string;
}
  
export const StyledBurger = styled.div<INav>`
    position: fixed;
    width: 3rem;
    height: 3rem;
    top: 8px;
    right: 8px;
    z-index: 20;
    display: none;
    cursor: pointer;
    background-color: ${COLORS.primary}cc;
    border-radius: 50%;

    @media (max-width: 768px) {
        transition: all 0.3s ease-in-out;
        transform: ${(props) => props.open && 'translateX(-15rem)'};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-flow: column nowrap;
    }

    div {
        width: 2rem;
        height: 0.25rem;
        margin-bottom: 0.42rem;
        background-color: ${COLORS.dark};
        border-radius: 10px;
        transition: all 0.2s ease-in-out;
        &:nth-child(1) {
            transform: ${(props) => props.open ? 'translateY(7px) rotate(45deg)' : 'rotate(0)'};
        }
        &:nth-child(2) {
            transform: ${(props) => props.open ? 'translateX(100%)' : 'translateX(0)'};
            opacity: ${(props) => props.open ? 0 : 1};
        }
        &:nth-child(3) {
            transform: ${(props) => props.open ? 'translateY(-7px) rotate(-45deg)' : 'rotate(0)'};
            margin-bottom: 0;
        }
    }
`;


export const NavMenu = styled.div`
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    width: 100%;

    @media (max-width: 768px) {
        display: flex;
        flex-flow: column nowrap;
        align-items: flex-start;
        margin-bottom: 2rem;

        div{
            width: 100%;
            height: 4rem;
        }
    }
`;


export const Bars = styled.div<INav>`
    max-width: 1200px;
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    white-space: nowrap;
    height: 100%;

    @media (max-width: 768px) {
        a {
            align-self: center;
        }
        
        transform: ${(props) => props.open ? 'translateX(0)' : 'translateX(100%)'};
        flex-flow: column nowrap;
        overflow-wrap: break-word;
        overflow-x: auto;
        align-items: flex-start;

        padding-top: 4rem;
        padding-right: 2rem;
        padding-left: 2rem;
        background-color: ${COLORS.primary};
        position: fixed;
        right: 0;
        top: 0;
        height: 100vh;
        width: 21rem;
        display: flex;
        
        transition: transform 0.3s ease-in-out;
        z-index: 9;
        justify-content: normal;
    }
`;


export const Nav = styled.nav`
    background-color: ${COLORS.primary};
    box-shadow: 0 0 3px;
    min-height: 4.6rem;
    align-items: center;
    justify-content: center;
    padding-left: 1.6rem;
    padding-right: 1.6rem;
    display: flex;
    z-index: 10;
    width: 100%;
`;
