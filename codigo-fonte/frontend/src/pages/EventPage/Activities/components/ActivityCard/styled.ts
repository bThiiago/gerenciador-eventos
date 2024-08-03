import styled from 'styled-components';
import React from 'react';
import { Box } from '@chakra-ui/layout';
import COLORS from 'constants/COLORS';

interface ActivityCardWrapperProps extends React.HTMLProps<HTMLDivElement> {
    isexpanded: string;
}

export const Wrapper = styled(Box) <ActivityCardWrapperProps>`
    margin-bottom: 1.6rem;

    padding: 1.6rem;
    border-radius: 8px;

    transition: height 0.5s;

    p {
        word-wrap: anywhere;
    }

    .date-group {
        display: grid;
        justify-content: right;
    }

    display: grid;
    grid-template-columns: 1fr 8fr;
    grid-gap: ${(props) => (props.isexpanded === 'true' ? '1.2rem' : '0')};
    grid-template-areas:
        'a  a '
        'd1 d2'
        'e1 e2'
        'e3 e4'
        'f  f'
        'g1 g2'
        'h  .'
        ;

    align-items: center;

    .expand-btn {
        max-width: 30px;

        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 20%;
        width: 50%;

        cursor: pointer;

        background-color: ${() => COLORS.primaryLight};
        padding: 0.8rem;

        svg {
            color: ${(props) => props.isexpanded === 'true' ? COLORS.danger : COLORS.dark};
        }
    }

    .title-row {
        grid-area: a;
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

    .responsible-name {
        grid-area: e3;
        align-self: flex-start;
    }

    .responsibles {
        grid-area: e4;
    }

    .dates {
        grid-area: f;
    }

    .rating-label {
        grid-area: g1;
    }

    .rating-stars {
        grid-area: g2;
    }

    .subscribe-button {
        grid-area: h;
        margin-top: -30px;
    }

    

      
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        grid-column-gap: 0;
        grid-template-areas:
            'x'
            'a'
            'd1'
            'd2'
            'e1'
            'e2'
            'e3'
            'e4'
            'f'
            'g1'
            'g2'
            'h';

        .expand-btn {
            max-width: 200px;
            width: 100px;
            border-radius: 1.2rem;
        }

        .description {
            text-align: justify;
        }

        .date-group {
            display: grid !important;
            float: none !important;
            margin-bottom: 10px;
        }

        .subscribe-button {
            margin-top: 0 !important;
        }
    }

    @media only screen and (max-width: 480px) {
        justify-items: center;
        justify-content: center;
        text-align: center;

        .schedule {
            justify-content: center;
        }

        .expand-btn {
            border-radius: 0.8rem;
        }

        .description,
        .teachers {
            justify-self: center;
        }

        dates {
            width: 100%;
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
    grid-template-columns:
        minmax(15rem, auto) minmax(19rem, auto) minmax(18rem, auto)
        200fr;
    grid-template-areas: 'dd1  dd2  dd3  dd4  ';
    align-items: center;

    :not(:last-child) {
        margin-bottom: 0.6rem;
    }

    gap: 1.2rem;

    padding: 0.8rem;

    .schedule-date {
        grid-area: dd1;
    }

    .schedule-time {
        grid-area: dd2;
    }

    .schedule-room {
        grid-area: dd3;
    }

    .schedule-link {
        grid-area: dd4;
    }

    border: 1px solid black;
    border-radius: 0.8rem;

    @media (max-width: 1200px) {
        grid-template-columns: minmax(18rem, auto) 200fr;
        grid-template-areas:
            'dd1  dd2'
            'dd3  dd4';
        text-align: left;
    }

    @media (max-width: 480px) {
        grid-template-columns: auto;
        grid-template-areas:
            'dd1'
            'dd2'
            'dd3'
            'dd4';
        text-align: left;
    }
`;
