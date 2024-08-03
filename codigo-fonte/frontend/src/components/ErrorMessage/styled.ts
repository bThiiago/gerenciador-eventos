import COLORS from 'constants/COLORS';
import styled from 'styled-components';

export const ErrorMessageContainer = styled.div`
    p {
        color : ${COLORS.danger};
        font-weight: bold;
        padding: 1.6rem 0.8rem;
    }
`;
