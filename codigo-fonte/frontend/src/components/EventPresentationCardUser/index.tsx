import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Heading, Link as LinkChakra } from '@chakra-ui/react';
import { PageSubtitleLight } from 'custom-style-components';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import { EventType } from 'types/models';
import { renderDateRange } from 'utils/dateUtils';
import renderEventName from 'utils/renderEventName';
import { Wrapper } from './styled';

interface CardProps {
    event: EventType;
    link: string;
}

const description =
    'O Instituto Federal de Educação, Ciência e Tecnologia de São Paulo - Câmpus Presidente Epitácio (IFSP-PEP) convida a comunidade interna e externa para a II Semana Epitaciana de Computação (II SEC 2021), que será realizada no período de 24 a 28 de maio de 2021.\nA II SEC 2021, promovida pelo IFSP-PEP, é um evento voltado para toda a comunidade de Presidente Epitácio e região, cujo principal objetivo é a disseminação de conhecimentos da área de computação. As palestras serão realizadas online. Espera-se que, com a realização do presente evento, o IFSP consolide-se ainda mais como polo disseminador de conhecimento e cultura na cidade de Presidente Epitácio e região, e que a área de computação seja reconhecida como um importante campo de atuação dos estudantes egressos da instituição.\nO evento contará com palestras e mesa redonda, de acordo com a programação disponibilizada, oferendo aos participantes a oportunidade de conhecer novas/consolidadas tecnologias na área de computação. Serão aproximadamente 20 palestras relacionadas à Pesquisa Científica e Tecnologia da Informação (TI) nesses cinco dias de evento.\nMais do que uma semana de atividades sobre a área de Ciência da Computação, a II SEC 2021 será uma experiência com as melhores tecnologias empregadas atualmente no mercado de trabalho e na área científica';

const EventPresentationCardUser: React.FC<CardProps> = ({ event, link }) => {
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
            <Heading className="title" isTruncated>{renderEventName(event).toUpperCase()}</Heading>
            <LinkChakra
                as={Link}
                to={link}
                fontSize="1.6rem"
                fontWeight="bold"
                className="url"
            >
                Acessar atividades
                <ArrowForwardIcon fontSize="1.6rem" />
            </LinkChakra>
            <div className="description">
                {event.description.length > 0 ? event.description : description}
            </div>
        </Wrapper>
    );
};

EventPresentationCardUser.propTypes = {
    event: PropTypes.any,
    link: PropTypes.string.isRequired,
};

export default EventPresentationCardUser;
