import styled from 'styled-components';

interface NavStyleProps {
    active ?: boolean;
}

export const Wrapper = styled.div<NavStyleProps>`
    display: flex;
    height: 100%;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
    color: white;
    font-weight : ${(props) => props.active ? 'bold' : ''};

    :hover {
        cursor: pointer;
        transition: background-color 0.3s;
        background-color: rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
        overflow-wrap: break-word;
    }
`;