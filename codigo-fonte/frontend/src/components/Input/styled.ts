import COLORS from 'constants/COLORS';
import styled from 'styled-components';

export const Container = styled.div`
    flex-direction: column;
    width: 100%;

    input {
        font-size: max(16px, 1em);
        background-color: #fff;
        //max-width: 400px;
        width: 100%;
        min-height: 3.8rem;
    }

    span {
        margin-top: 3px;
        /* text-align: center; */
        color: ${COLORS.danger};
    }
`;
