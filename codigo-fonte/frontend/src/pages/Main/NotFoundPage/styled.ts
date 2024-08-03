import COLORS from 'constants/COLORS';
import styled from 'styled-components';

export const Centralize =  styled.section`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex: 1;
    font-size: 32px;
    text-align: center;

    span:first-child {
        margin-right: 15px;
        padding-right: 10px;
        border-right: 2px solid ${COLORS.grey};
    }

    span + span {
        color: ${COLORS.grey};
    }
`;