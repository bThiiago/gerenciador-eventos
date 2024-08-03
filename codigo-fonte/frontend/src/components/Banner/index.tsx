import React from 'react';
import { BannerImage } from './styled';
import PropTypes from 'prop-types';

interface BannerProps {
    bannerUrl: string;
}

// todo receber url do banner
const Banner : React.FC<BannerProps> = ({ bannerUrl }) => {
    return (
        <BannerImage src={bannerUrl} alt='Banner do evento' />
    );
};

Banner.propTypes = {
    bannerUrl: PropTypes.string.isRequired
};

export default Banner;