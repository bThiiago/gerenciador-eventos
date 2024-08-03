import styled from 'styled-components';

export const Wrapper = styled.div`

    display: grid;
    grid-gap: 0.8rem;
	grid-template-areas:
		"a b"
		"a b"
        "a b"
		;

    .head {
        grid-area: a;
    }

    .tail {
        grid-area: b;
    }


    @media (max-width: 768px) {
        
        grid-template-areas:
		"a" 
        "b"
		;   
    }

`;


export const Container = styled.div`
    flex-direction: column;
    align-items: center;
`;


