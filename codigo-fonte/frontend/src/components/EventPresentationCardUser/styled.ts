import styled from 'styled-components';
import COLORS from 'constants/COLORS';
import { Box } from '@chakra-ui/react';

export const Wrapper = styled(Box)`
    background-color: ${COLORS.white};

    :not(:last-child) {
        margin-bottom: 1.6rem;
    }

    padding: 1.6rem;
    border-radius: 8px;

    display: grid;
    grid-template-columns: 0.5fr 5fr 1.5fr;
    grid-gap: 0.8rem;
	grid-template-areas: "a b d"
		"a c c"
        "e e e"
		;

    align-items: center;

    .logo {
        grid-area: a;
    }

    .date {
        grid-area: b;
    }

    .title {
        grid-area: c;
    }

    .url {
        grid-area: d;
        text-align: right;
    }

    .description {
        grid-area: e;
        text-overflow: ellipsis;

        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    img {
        max-width: 7rem;
        border-radius: 50%;
        border-color: ${COLORS.dark};
        border-width: 1px;
        border-style: solid;
    }

    a {
        background-color: ${COLORS.white};
        border-radius: 8px;
    }

    a:hover {
        background-color: ${COLORS.white};
        border-radius: 8px;
    }

    @media (max-width: 768px) {
        grid-template-areas:
            "a b b"
            "a c c"
            "e e e"
            "d d d"
            ;

        .url {
            text-align: center;
        }

        .description {
            text-align: justify;
            -webkit-line-clamp: 6;
        }
    }

    @media only screen and (max-width : 480px) {
        .title {
            text-align: center;
            white-space: normal;
        }

        justify-items: center;
        grid-template-columns: 1fr;
        grid-template-areas:
            "a"
            "c"
            "b"
            "d"
            "e"
            ;
    }

`;