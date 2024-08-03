import styled from 'styled-components';
import React from 'react';
import { Box } from '@chakra-ui/layout';
import COLORS from 'constants/COLORS';

interface ActivityCardGroupWrapperProps
    extends React.HTMLProps<HTMLDivElement> {
    isexpanded: string;
}

export const Wrapper = styled(Box)<ActivityCardGroupWrapperProps>`
    margin-bottom: 1.6rem;

    .div-title {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        margin-top: 1rem;
    }

    .expand-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 0.4rem;
        margin-left: 0.8rem;
        padding: 0.4rem;

        background-color: ${() => COLORS.primaryLight};

        :hover {
            cursor: pointer;
            background-color: ${() => COLORS.primary};
            transition: background-color 0.3s;
        }
    }

    .activities-content {
        display: ${(props) => (props.isexpanded === 'true' ? 'block' : 'none')};
    }

    @media (max-width: 768px) {
    }

    @media only screen and (max-width: 480px) {
    }
`;
