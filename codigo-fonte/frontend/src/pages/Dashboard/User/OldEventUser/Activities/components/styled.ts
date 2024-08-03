import styled from 'styled-components';
import COLORS from 'constants/COLORS';
import React from 'react';
import { Box } from '@chakra-ui/layout';

interface ActivityCardWrapperProps extends React.HTMLProps<HTMLDivElement> {
    isexpanded: string;
}

export const Wrapper = styled(Box)<ActivityCardWrapperProps>`
    background-color: ${COLORS.white};

    margin-bottom: 1.6rem;

    padding: 1.6rem;
    border-radius: 8px;

    transition: height 0.5s;

    display: grid;
    grid-template-columns: 1fr 8fr;
    grid-gap: ${(props) => (props.isexpanded === 'true' ? '1.2rem' : '0')};
    grid-template-areas:
        'a  a '
        'd1 d2'
        'e1 e2'
        'f  f'
        'd  d';

    align-items: center;

    .title-row {
        grid-area: a;

        svg:hover {
            cursor: pointer;
        }
    }

    .expand {
        display: ${(props) => (props.isexpanded === 'true' ? 'flex' : 'none')};
    }

    .description-name {
        grid-area: d1;
        align-self: flex-start;
    }

    .description {
        grid-area: d2;
    }

    .teachers-name {
        grid-area: e1;
        align-self: flex-start;
    }

    .teachers {
        grid-area: e2;
    }

    .dates {
        grid-area: f;
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        grid-template-areas:
            'a'
            'd1'
            'd2'
            'e1'
            'e2'
            'f';

        .description {
            text-align: justify;
        }
    }

    @media only screen and (max-width: 480px) {
        justify-items: center;
        text-align: center;

        .description,
        .teachers {
            justify-self: left;
        }
    }
`;

export const RowGroup = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 0.8rem;
    gap: 1.6rem;

    .vacancy-info {
        margin-left: auto;
    }

    @media (max-width: 768px) {
        .vacancy-info {
            margin-left: 0;
        }
        flex-direction: column;
        align-items: flex-start;
        gap: 0.8rem;
    }

    @media (max-width: 480px) {
        align-items: center;
    }
`;

export const DateGroup = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.8rem;
    gap: 2.4rem;
    width: 100%;

    border: 1px solid black;
    border-radius: 0.8rem;

    @media (max-width: 768px) {
        gap: 0.4rem;
        flex-direction: column;
        align-items: flex-start;
    }

    @media (max-width: 480px) {
        text-align: left;
        align-items: center;
    }
`;
