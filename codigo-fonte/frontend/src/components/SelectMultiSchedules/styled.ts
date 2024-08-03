import styled from 'styled-components';
import COLORS from 'constants/COLORS';

export const SchedulePickerWrapper = styled.div`
	border-left-color : ${COLORS.primaryContrast};
    border-left-width: 2px;
    border-left-style : solid;
    padding-bottom: 1.6rem;
    padding-top: 1.6rem;
    padding-left: 1.6rem;
`;

export const ButtonWrapper =  styled.div`
    width: 30%;

    @media (max-width: 768px) {
        width : 100%;
    }
`;