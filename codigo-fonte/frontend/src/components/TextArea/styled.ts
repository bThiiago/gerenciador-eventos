import COLORS from 'constants/COLORS';
import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;

    /* input {
        width: 100%;
    } */

    textarea {
        font-size: 1rem;
        font-size: max(16px, 1em);
        font-family: inherit;
        padding: 0.25em 0.5em;
        background-color: #fff;
        border-radius: 4px;
        line-height: 1.5;
    }

    span {
        color: ${COLORS.danger};
    }
`;