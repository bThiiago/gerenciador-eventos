import React from 'react';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { PaginatorWrapper } from './styled';
import { IconButton, Tooltip } from '@chakra-ui/react';
import COLORS from 'constants/COLORS';

interface PaginatorProps {
    totalPages: number;
    currentPage: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    style?: React.CSSProperties;
}

const Paginator: React.FC<PaginatorProps> = ({
    totalPages,
    currentPage,
    setPage,
    style,
}) => {
    const incrementPage = () => {
        if (currentPage + 1 <= totalPages) setPage((old) => old + 1);
    };

    const decrementPage = () => {
        if (currentPage - 1 > 0) setPage((old) => old - 1);
    };

    return (
        <PaginatorWrapper style={style}>
            <Tooltip hasArrow fontSize="1.2rem" label="Página anterior">
                <IconButton
                    variant="ghost"
                    disabled={currentPage === 1}
                    color={COLORS.dark}
                    fontSize="1.5rem"
                    icon={<FiArrowLeft size="20px" />}
                    aria-label="Página anterior"
                    onClick={decrementPage}
                />
            </Tooltip>
            {currentPage !== 1 && (
                <div className="border" onClick={() => setPage(1)}>
                    1 ...{' '}
                </div>
            )}
            <div className="middle">{currentPage}</div>
            {totalPages !== 1 && currentPage !== totalPages && (
                <div className="border" onClick={() => setPage(totalPages)}>
                    ... {totalPages}
                </div>
            )}
            <Tooltip hasArrow fontSize="1.2rem" label="Próxima página">
                <IconButton
                    variant="ghost"
                    disabled={totalPages === 1 || currentPage === totalPages}
                    color={COLORS.dark}
                    fontSize="1.5rem"
                    icon={<FiArrowRight size="20px" />}
                    aria-label="Próxima página"
                    onClick={incrementPage}
                />
            </Tooltip>
        </PaginatorWrapper>
    );
};

Paginator.propTypes = {
    totalPages: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    setPage: PropTypes.func.isRequired,
    style: PropTypes.any,
};

export default Paginator;
