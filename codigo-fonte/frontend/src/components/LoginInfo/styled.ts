import COLORS from 'constants/COLORS';
import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
    justify-self: flex-start;
    justify-content: center;

    padding: 1rem 1rem;
    
    div {
        //display: flex;
        //justify-content: row;
        //align-items: center;

        span {
            visibility: visible;
        }

        span + button {
            margin-left: 1.5rem;
        }
    }

    a {
        text-decoration: none;
        cursor: pointer;
        color: ${COLORS.dark};
		margin: 0rem 0.5rem 0rem 0.5rem;
    }

    @media (max-width: 768px) {
        width: 100%;
        justify-content: center;
        margin-left: 0;
		flex-direction: column;

        div {
            span {
                visibility: hidden;
            }

            span + button {
                margin-left: 0rem;
            }
        }
		
		a {
			
			margin: 0.5rem 0rem 0.5rem 0rem;
		}
    }
`;
