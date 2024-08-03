import styled from 'styled-components';
import { Link } from 'react-router-dom';

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

export const DeveloperContainer = styled.div`
    display: flex;
    align-items: center;
    background-color: #f4f4f4;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

export const IconWrapper = styled.div`
    margin-right: 10px;
`;

export const BackLink = styled(Link)`
    color: #007bff;
    text-decoration: none;
    margin-bottom: 20px;
`;

export const Title = styled.h1`
    font-size: 24px;
    margin-top: 10px;
`;

export const DeveloperName = styled.h2`
    font-size: 20px;
    margin-bottom: 5px;
`;

export const DeveloperRole = styled.p`
    font-style: italic;
`;

export const GithubLink = styled.a`
    color: #007bff;
    text-decoration: none;
`;

export const TeacherContainer = styled.div`
    /* Your teacher container styles here */
`;

export const TeacherName = styled.h2`
    /* Your teacher name styles here */
`;

export const TeacherRole = styled.p`
    /* Your teacher role styles here */
`;
