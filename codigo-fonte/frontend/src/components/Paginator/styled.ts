import styled from 'styled-components';

export const PaginatorWrapper = styled.div`
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: space-between;
    width: 200px;

    button:not(:disabled), .border {
        cursor: pointer;
    }

    .border:hover {
        font-size: 1.2rem;
        transition: font-size 0.3s;
    }

    .middle {
        font-weight: 700;
        font-size: 1.6rem;
    }

    @media only screen and (max-width: 480px) {
        width: 100%;
    }
`;
