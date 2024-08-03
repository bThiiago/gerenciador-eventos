import React from 'react';
import COLORS from 'constants/COLORS';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button as ChakraButton, Spinner } from '@chakra-ui/react';

interface additionalButtonTypes
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    link?: string;
    noLoading?: boolean;
}

const CustomButton: React.FC<additionalButtonTypes> = ({
    children,
    link,
    disabled,
    noLoading,
    ...rest
}) => {
    rest.style = {
        ...rest.style,
        fontSize: '1.6rem',
        marginBottom: '0.8rem',
        backgroundColor: COLORS.primaryLight,
        color: COLORS.white,
    };
    if (link) {
        return (
            <ChakraButton disabled={disabled} as={Link} to={link} {...rest}>
                {children}{' '}
                {disabled && (
                    <Spinner
                        size="md"
                        speed="0.90s"
                        style={{ marginLeft: '0.8rem' }}
                    />
                )}
            </ChakraButton>
        );
    }
    return (
        <ChakraButton disabled={disabled} type="submit" {...rest}>
            {children}{' '}
            {disabled && !noLoading && (
                <Spinner
                    size="md"
                    speed="0.90s"
                    style={{ marginLeft: '0.8rem' }}
                />
            )}
        </ChakraButton>
    );
};

CustomButton.propTypes = {
    children: PropTypes.any,
    link: PropTypes.string,
    disabled: PropTypes.bool,
    style: PropTypes.any,
    noLoading: PropTypes.bool,
};

export default CustomButton;
