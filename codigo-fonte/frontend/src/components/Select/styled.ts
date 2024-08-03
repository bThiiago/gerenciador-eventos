import ReactSelect from 'react-select';
import styled from 'styled-components';

export const SelectStyle = styled(ReactSelect)`
	> div {
		border-width: 2px;
		border-style: solid;
		border-radius: 4px;
		box-shadow: none;
	}

    /*& > .react-select__menu {
        background-color: red;
    }*/
`;