import React, { useState } from 'react';
import { ActivityType, EventType, People } from 'types/models';
import PropTypes from 'prop-types';
import ActivityCard from '../ActivityCard';
import { Wrapper } from './styled';
import { PageSubtitle } from 'custom-style-components';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

interface ActivityCardGroupProps {
    title: string;
    activities: ActivityType[];
    event: EventType;
    user?: People;
    userActivities: ActivityType[];
    vacancyActivities: ActivityType[];
}

const ActivityCardGroup: React.FC<ActivityCardGroupProps> = ({
    title,
    activities,
    event,
    user,
    userActivities,
    vacancyActivities,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleExpand = () => {
        setIsExpanded((old) => !old);
    };

    const ExpandButton = ({ className }: { className: string }) => {
        const Icon = isExpanded ? MinusIcon : AddIcon;

        return (
            <span onClick={toggleExpand} className={className} style={{color: 'white'}}>
                {isExpanded ? 'Esconder' : 'Expandir'}
                <Icon style={{ marginLeft: '0.4rem', color: 'white' }} />
            </span>
        );
    };

    const renderActivities = (activities: ActivityType[] | undefined) => {
        if (event && activities && activities.length > 0) {
            const actReturn = activities.map((activity, index) => {
                let isRegistered = false;
                if (user) {
                    isRegistered = !!userActivities.find(
                        (userActivity) => userActivity.id === activity.id
                    );
                }
                if (vacancyActivities) {
                    activities.filter((activity) => {
                        const totalRegistry = activity.totalRegistry ?? 0;
                        return totalRegistry < activity.vacancy;
                    });
                }
                return (
                    <ActivityCard
                        key={index}
                        event={event}
                        activity={activity}
                        alreadyRegistered={isRegistered}
                    />
                );
            });

            return actReturn;
        }
    };

    return (
        <Wrapper isexpanded={isExpanded.toString()}>
            <div className="div-title">
                <PageSubtitle>{title}</PageSubtitle>
                <ExpandButton className="expand-btn" />
            </div>
            <div className="activities-content">
                {renderActivities(activities)}
            </div>
        </Wrapper>
    );
};

ActivityCardGroup.propTypes = {
    title: PropTypes.string.isRequired,
    activities: PropTypes.any.isRequired,
    event: PropTypes.any.isRequired,
    user: PropTypes.any,
    userActivities: PropTypes.any.isRequired,
    vacancyActivities: PropTypes.any.isRequired,
};

export default ActivityCardGroup;
