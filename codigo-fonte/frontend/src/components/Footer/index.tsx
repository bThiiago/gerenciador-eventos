import COLORS from 'constants/COLORS';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <div
            style={{
                marginTop: 'auto',
                alignItems: 'center',
                height: 'auto',
                display: 'flex',
                justifyContent: 'center',
                background: COLORS.white,
            }}
        >
            <div
                style={{
                    width: '100%',
                    padding: 10,
                    maxWidth: '1200px',
                    textAlign: 'center',
                }}
            >
                <p style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    Turma de BCC - Projeto Integrado
                </p>
                <p style={{ fontSize: '14px'}}>
                    <Link to="/desenvolvedores">Clique aqui para ver os desenvolvedores</Link>
                </p>
            </div>
        </div>
    );
};

export default Footer;
