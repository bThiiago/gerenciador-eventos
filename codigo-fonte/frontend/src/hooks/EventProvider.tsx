import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { EventType } from 'types/models';

interface IEventContext {
    event : EventType | undefined;
    loading : boolean;
    error ?: string;
}

interface EventProviderProps {
    children : React.ReactNode,
    event ?: EventType,
    loading : boolean;
    error ?: string,
}

const EventContext = createContext<IEventContext>({} as IEventContext);

const EventProvider: React.FC<EventProviderProps> = ({ event, loading, error, children }) => {
    const [activeEvent, setActiveEvent] = useState<EventType | undefined>(event);

    useEffect(() => {
        setActiveEvent(event);
    }, [event]);

    return (
        <EventContext.Provider value={{ event : activeEvent, loading, error }}>
            { children }
        </EventContext.Provider>    
    );
};

EventProvider.propTypes = {
    children: PropTypes.any,
    event: PropTypes.any,
    loading : PropTypes.bool.isRequired,
    error : PropTypes.any,
};

function useEvent(): IEventContext  {
    const context = useContext(EventContext);
    return context;
}

export { EventProvider, useEvent };