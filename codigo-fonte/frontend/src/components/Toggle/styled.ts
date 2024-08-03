import COLORS from 'constants/COLORS';
import styled from 'styled-components';

export const Switch = styled.label`
    position: relative;
    display: inline-block;
    width: 50px;
    height: 30px;
    margin-left: 5px;
    margin-rigth: 5px;

    input {
        display: none;
    }

    input:checked + span:before {
        --webkit-transform: translateX(24px);
        --ms-transform: translateX(24px);
        transform: translate(24px);

        background-color: ${COLORS.primary};
    }
`;

export const Slider = styled.span`
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: white;
	border-radius: 34px;
	--webkit-transition: .4s;
    transition: .5s;
    border: 3px solid white;
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
    
    &:before {
        position: absolute;
        content: "";
        height: 19px;
        width: 19px;
        top: 2px;
        border-radius: 50%;
        background-color: black;
        transition: .5s;
        box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
        /*Alguma coisa ta mudando isso, e é necessário setar para 0*/
        left: 0px; 
    }
`;

export const Container = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;

    align-items: center;

    input {
        font-size: 1rem;
        font-size: max(16px, 1em);
        font-family: inherit;
        padding: 0.25em 0.5em;
        background-color: #fff;
        border: 2px solid ${COLORS.inputBorder};
        border-radius: 4px;
        line-height: 1.5;
        height: 4.5rem;

        &:focus {
            border-color: hsl(212, 90%, 60%);
            outline: 3px solid transparent;
        }
    }

    span {
        color: ${COLORS.danger};
    }
`;
