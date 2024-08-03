import styled from 'styled-components';

export const ContentWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 1.6rem;
    max-width: 1100px;
    width: 100%;
    @media (max-width: 1000px) {
        grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 768px) {
        grid-template-columns: repeat(1, 1fr);
    }
`;

export const Container = styled.div`
    display: flex;
    align-items: center;
    background-color: #f4f4f4;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

export const Category = styled.h1`
    font-size: 1.5rem;
    font-weight: 700;
`;

export const Title = styled.h1`
    font-size: 1.5rem;
    max-width: 500px;
`;

export const Time = styled.h2`
    font-size: 1.5rem;
`;
