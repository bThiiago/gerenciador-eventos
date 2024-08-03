import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ActivityType } from 'types/models';
import { DateGroup, RowGroup, Wrapper } from './styled';
import { LinkText, TextBig, TextNormal } from 'custom-style-components';
import { renderDateAsDayMonth, renderDateAsTime } from 'utils/dateUtils';

import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import StarRatingComponent from 'react-star-rating-component';
import { useToast, UseToastOptions } from '@chakra-ui/react';
import TOAST from 'constants/TOAST';
import { api } from 'services/axios';

interface ActivityCardProps {
    activity: ActivityType;
    userId?: number;
}

const OldEventActivityCard: React.FC<ActivityCardProps> = ({
    activity,
    userId

}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [rating, setRating] = useState(activity.activityRegistration ? activity.activityRegistration[0].rating : 0);

    const toastId = 'activity-card';
    const toast = useToast({
        id: toastId,
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const toaster = (options: UseToastOptions) => {
        if (toast.isActive(toastId)) {
            toast.close(toastId);

            setTimeout(() => toast(options), 150);
        } else {
            toast(options);
        }
    };

    const toggleExpand = () => {
        setIsExpanded((old) => !old);
    };

    const ExpandButton = () => {
        const Icon = isExpanded ? MinusIcon : AddIcon;

        return <Icon onClick={toggleExpand} style={{}} />;
    };

    return (
        <Wrapper shadow="lg" isexpanded={isExpanded.toString()}>
            <RowGroup className="title-row">
                <ExpandButton />
                <TextBig>
                    {activity.title}
                    {
                        rating == 0 && userId && activity.activityRegistration ? (
                            <TextNormal style={{ color: '#ffbb00' }}>Avaliação Pendente</TextNormal>
                        ) : undefined
                    }    
                </TextBig>
                <TextNormal
                    className="vacancy-info"
                    style={{
                        fontWeight: 'lighter',
                    }}
                >
                </TextNormal>
                <TextNormal>
                    Carga horária: {activity.workloadInMinutes} mins
                </TextNormal>
            </RowGroup>
            <TextNormal
                style={{ fontWeight: 'bold' }}
                className="description-name expand"
            >
                Descrição
            </TextNormal>
            <TextNormal className="description expand">
                {activity.description}
            </TextNormal>
            <TextNormal
                style={{ fontWeight: 'bold' }}
                className="teachers-name expand"
            >
                Ministrantes
            </TextNormal>
            <TextNormal className="teachers expand">
                {activity.teachingUsers && activity.teachingUsers.length > 0
                    ? activity.teachingUsers.map((user) => user.name)
                    : 'Atividade sem ministrante definido'}
            </TextNormal>

            <TextNormal style={{ fontWeight: 'bold' }} className="dates expand">
                Horários e locais
            </TextNormal>
            {activity.schedules?.map((schedule, index) => {
                return (
                    <DateGroup
                        key={index}
                        style={{
                            gridColumn: 'span 2',
                            alignItems: 'flex-start',
                        }}
                        className="expand"
                    >
                        <TextNormal>
                            Data: {renderDateAsDayMonth(schedule.startDate)}
                        </TextNormal>
                        <TextNormal>
                            Horário: {renderDateAsTime(schedule.startDate)} -{' '}
                            {renderDateAsTime(
                                new Date(
                                    schedule.startDate.getTime() +
                                        schedule.durationInMinutes * 60000
                                )
                            )}
                        </TextNormal>
                        <TextNormal>
                            Local:{' '}
                            {schedule.room ? schedule.room.code : 'Virtual'}
                        </TextNormal>
                        {schedule.url ? (
                            <TextNormal
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                Sala virtual:{' '}
                                <a
                                    href={schedule.url}
                                    style={{ marginLeft: '0.8rem' }}
                                >
                                    <LinkText>{schedule.url}</LinkText>
                                </a>
                            </TextNormal>
                        ) : undefined}
                    </DateGroup>
                );
            })}
            {activity.activityRegistration ? (
                <>
                    <div className='expand rating-label'>
                        <TextNormal
                            style={{ fontWeight: 'bold' }}
                            className='expand rating'
                        >
                            Avaliação
                        </TextNormal>
                    </div>
                    <div className='expand rating-stars'>
                        <div style={{ fontSize: 35 }}>
                            <StarRatingComponent name='rating' value={rating} onStarClick={(next) => {
                                if (userId) {
                                    api.put(`/activity/${activity.id}/rate/${userId}`, {
                                        rating: next
                                    }).then(() => {
                                        setRating(next);
                                    }).catch(err => {
                                        toaster({
                                            title: 'Erro ao enviar avaliação',
                                            description: `${err}`,
                                            status: 'error'
                                        });
                                    });
                                }
                            }} />
                        </div>
                    </div>
                </>
            ) : undefined}
        </Wrapper>
    );
};

OldEventActivityCard.propTypes = {
    activity: PropTypes.any.isRequired,
};

export default OldEventActivityCard;
