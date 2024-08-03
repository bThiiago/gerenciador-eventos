import React from 'react';
import COLORS from 'constants/COLORS';
import styled from 'styled-components';
import PropTypes from 'prop-types';

export const PageTitle = styled.h1`
    font-size: 3.2rem;
    font-weight: bold;
    color: ${COLORS.dark};
`;

export const PageSubtitle = styled.h2`
    font-size: 2.4rem;
    font-weight: bold;
    color: ${COLORS.dark};
    margin-bottom: 0.8rem;
`;

export const PageSubtitleLight: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
    PageSubtitleLight.propTypes = {
        children: PropTypes.any,
        className: PropTypes.any,
    };

    return (
        <PageSubtitle
            {...props}
            style={{
                fontWeight: 'lighter',
                marginBottom: '0.8rem',
            }}
        >
            {props.children}
        </PageSubtitle>
    );
};

export const TextBig = styled.h3`
    font-size: 2rem;
    font-weight: bold;
    color: ${COLORS.dark};
`;

export const TextNormal = styled.h4`
    font-size: 1.6rem;
`;

export const PageContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1.6rem;
    
    width: 100%;
`;

export const FiltersWrapper = styled.div`
    margin-bottom: 10px;

    .select {
        width: 300px;
        select {
            padding: 5px;
            border-radius: 8px;
        }
    }

    .input {
        width: 300px;
        select {
            padding: 5px;
            border-radius: 8px;
        }
    }
`;

export const LinkText = styled.section`
    color: ${COLORS.link};
    text-decoration: none;
    font-size: 1.1rem;
    :hover {
        cursor: pointer;
    }
`;

export const FormWrapper = styled.div`
    padding: 1.6rem;

    > h1 {
        margin-bottom: 2.1rem;
    }

    form {
        display: flex;
        flex-direction: column;
    }

    form > * {
        margin-bottom: 1.3rem;
    }
`;

export const DashboardWrapper = styled.section`
    display: flex;
    flex-direction: row;
    width: 100%;
    flex: 1;
`;

export const DashboardPageContent = styled.section`
    flex: 1;
    padding: 1.6rem;
`;

export const CustomPresenceTable = styled.table`
    display: inline-block;
    overflow-y: hidden;

    tr:nth-child(even) > td:nth-child(odd) {
        background-color: ${COLORS.tableEvenRowOddCol};
    }
    tr:nth-child(odd) > td:nth-child(even) {
        background-color: ${COLORS.tableOddRowEvenCol};
    }
    tr:nth-child(odd) > td:nth-child(odd) {
        background-color: ${COLORS.tableOddRowOddCol};
    }
    tr:nth-child(even) > td:nth-child(even) {
        background-color: ${COLORS.tableEvenRowEvenCol};
    }

    tbody tr {
        border: ${`1px solid ${COLORS.grey}`};
    }
`;

export const CustomTable = styled.table`
    tbody tr {
        border: ${`1px solid ${COLORS.grey}`};
    }
    width: 100%;
    overflow-x: auto;

    table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
    }

    th,
    td {
        padding: 0.5rem;
        text-align: left;
        vertical-align: middle;
        border: 1px solid #ccc;
    }

    th {
        background-color: #f5f5f5;
        color: #333;
    }

    tr:nth-child(even) {
        background-color: #fafafa;
    }

    tr:hover {
        background-color: #e6e6e6;
    }

    @media only screen and (max-width: 767px) {
        th,
        td {
            display: block;
            width: 100%;
            text-align: center;
        }

        td:first-of-type {
            text-align: center;
        }
    }
`;

interface CustomTdProps {
    align?: string;
}

export const CustomTd = styled.td<CustomTdProps>`
    text-align: ${(props) => props.align};
    align-items: ${(props) => props.align};
    padding: 0 16px;

    border: ${`1px solid ${COLORS.grey}`};
`;

export const CustomTableButtonWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding: 0.6rem;
`;

export const CustomButton = styled.button`
    margin-bottom: 0.8rem;
    background-color: ${COLORS.primaryLight};

    &:hover {
        background-color: darken(${COLORS.primaryLight}, 10%);
    }
`;

export const TextContent = styled.h1`
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0;
    text-align: center;
    padding: 0 20px 20px 20px;
    color: ${COLORS.dark};
`;

export const PageSignWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1.6rem;
    margin: 7% auto;
    max-width: 400px;
    width: 100%;
    @media (max-width: 768px) {
        width: 90%;
        margin-top: 20px;
    }
`;

export const SignWrapper = styled.div`
    background: #fff;
    padding: 20px;
    border: 1px;
    border-top: 0;
    box-shadow: 8px 2px 18px 0 rgb(158 158 158 / 90%);
`;

export const SignTitle = styled.h1`
    font-size: 3.2rem;
    font-weight: bold;
    color: ${COLORS.dark};
    text-align: center;
`;
