import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter as Router, } from 'react-router-dom';

import EventCard from 'pages/Home/components/EventPresentationCard';
import { EventType } from 'types/models';

const event : EventType = {
    id : 0,
    name : 'Evento Qualquer',
    startDate : new Date('2021-01-01T00:00:00'),
    endDate : new Date('2021-01-08T00:00:00'),
    icon : 'example_url',
    description: 'Descrição do evento',
    statusActive: true,
    statusVisible: true
};

describe('teste de renderização', () => {
    test('renderizar corretamente as duas datas', () => {
        const { queryByText, queryByAltText } = render(
            <Router>
                <EventCard event={event} />
            </Router>
            
        );
        expect(queryByText(event.name.toUpperCase())).toBeInTheDocument();
        expect(queryByText('01/01 - 08/01')).toBeInTheDocument();
        expect(queryByAltText('Ícone do evento ' + event.name)).toBeInTheDocument();
        expect(queryByText('Acessar evento')).toBeInTheDocument();
    });

    test('renderizar corretamente com apenas uma data', () => {
        event.endDate = undefined;
        const { queryByText } = render(
            <Router>
                <EventCard event={event} />
            </Router>
            
        );
        expect(queryByText('01/01')).toBeInTheDocument();
    });
});
