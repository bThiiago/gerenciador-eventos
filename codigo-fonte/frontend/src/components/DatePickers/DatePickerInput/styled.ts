import styled from 'styled-components';

import { Input as InputChakra } from '@chakra-ui/react';
import COLORS from 'constants/COLORS';

export const DatePickerInputStyle = styled(InputChakra)`
    :hover {
        cursor: pointer;
    }
    font-size: max(16px, 1em) !important;
    min-height: 3.8rem;
    background: ${() => COLORS.white}!important;
`;
