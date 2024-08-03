import styled from 'styled-components';
import COLORS from 'constants/COLORS';

export const DatePickerInputStyle = styled.input`
    border-color: ${COLORS.primaryContrast};
    color: ${COLORS.dark};
    padding: 0.8rem;
    font-size: 1.6rem;
    border-width: 2px;
    border-style: solid;
    border-radius: 4px;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
        'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
        'Helvetica Neue', sans-serif;
    :hover {
        cursor: pointer;
    }
`;

export const FormDataWrapper = styled.div`
    width: auto;
    flex: 1;
`;

export const RowGroup = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 1.6rem;
    margin-bottom: 1.6rem;

    @media only screen and (max-width: 768px) {
        flex-direction: column;
    }
`;
