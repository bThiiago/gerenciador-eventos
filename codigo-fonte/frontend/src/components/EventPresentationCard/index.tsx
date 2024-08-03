import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Heading } from '@chakra-ui/react';
import { PageSubtitleLight } from 'custom-style-components';
import PropTypes from 'prop-types';
import React from 'react';
import { EventType } from 'types/models';
import { renderDateRange } from 'utils/dateUtils';
import renderEventName from 'utils/renderEventName';
import { Wrapper } from './styled';
import CustomButton from 'components/Button';

interface CardProps {
    event: EventType;
}

const EventPresentationCard: React.FC<CardProps> = ({ event }) => {
    return (
        <Wrapper shadow="lg" pd={4}>
            <img
                src={event.icon}
                alt={`Ícone do evento ${renderEventName(event)}`}
                className="logo"
            />
            <PageSubtitleLight className="date">
                {renderDateRange(event.startDate, event.endDate)}
            </PageSubtitleLight>
            <Heading className="title" isTruncated>
                {renderEventName(event).toUpperCase()}
            </Heading>
            <CustomButton
                link={`/evento/${event.eventCategory.url_src}/${event.id}`}
                className="url"
            >
                Acessar evento
                <ArrowForwardIcon fontSize="1.6rem" mr="-5px" ml="2px" />
            </CustomButton>
            <div className="description">{event.description}</div>
        </Wrapper>
    );
};

EventPresentationCard.propTypes = {
    event: PropTypes.any,
};

export default EventPresentationCard;
