import styled from 'styled-components';

export const Wrapper = styled.div`

    display: grid;
    grid-gap: 0.8rem;
	grid-template-areas:
		"a b"
		"a b"
        "a b"
		;

    align-items: center;

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
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;


