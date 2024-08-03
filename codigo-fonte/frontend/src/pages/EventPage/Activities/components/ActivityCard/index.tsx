import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ActivityType, EventType } from 'types/models';
import { DateGroup, RowGroup, Wrapper } from './styled';
import { LinkText, TextBig, TextNormal } from 'custom-style-components';
import { renderDateAsDayMonth, renderDateAsTime, getDate } from 'utils/dateUtils';
import Button from 'components/Button';
import { useAuth } from 'hooks/auth';
import { api } from 'services/axios';
import { useToast, UseToastOptions } from '@chakra-ui/react';
import TOAST from 'constants/TOAST';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';

import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import COLORS from 'constants/COLORS';
import getActivityCode from 'utils/getActivityCode';
import StarRatingComponent from 'react-star-rating-component';


interface ActivityCardProps {
    event: EventType;
    activity: ActivityType;
    alreadyRegistered: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
    activity,
    alreadyRegistered,
    event,
}) => {
    const { user } = useAuth();
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

    const [submitIsLoading, setSubmitIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRegistered, setIsRegistered] = useState(alreadyRegistered);
    const [amountRegistered, setAmountRegistered] = useState(
        activity.totalRegistry ? activity.totalRegistry : 0
    );
    const [rating, setRating] = useState(
        activity.activityRegistration
            ? activity.activityRegistration[0].rating
            : 0
    );

    const toggleExpand = () => {
        setIsExpanded((old) => !old);
    };

    const ExpandButton = ({ className }: { className: string }) => {
        const Icon = isExpanded ? MinusIcon : AddIcon;

        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={toggleExpand}
                className={className}
            >
                <Icon style={{color: 'white'}}/>
            </div>
        );
    };

    const userInscription = (activityId: number) => {
        if (!user) {
            toaster({
                title: 'Faça o login para se inscrever',
                status: 'error',
            });
            return;
        }
        setSubmitIsLoading(true);
        api.post(`/activity/registry/${activityId}/${user.id}`)
            .then(() => {
                toaster({
                    title: 'Inscrito!',
                    status: 'success',
                });
                setIsRegistered(true);
                setAmountRegistered((old) => old + 1);
            })
            .catch((err) => {
                let message = 'Erro inesperado';
                if (err instanceof GenericFrontError) {
                    message = err.message;
                    if (err instanceof ResponseError && err.status === 409) {
                        message =
                            'Conflito de inscrição: outra atividade no mesmo dia e horário';
                        const description = `Evento ${err.response.data[0].eventName}: você está inscrito na atividade "${err.response.data[0].activityName}", que ocorre no mesmo horário desta atividade.`;
                        toaster({
                            title: message,
                            description,
                            status: 'error',
                            duration: 10000,
                        });
                        return;
                    } else if (
                        err instanceof ResponseError &&
                        err.status === 400
                    )
                        message =
                            'Você é responsável ou ministra essa atividade';
                }
                toaster({
                    title: message,
                    status: 'error',
                });
            })
            .finally(() => setSubmitIsLoading(false));
    };

    const unregisterUser = (activityId: number) => {
        if (user) {
            setSubmitIsLoading(true);
            api.delete(`/activity/registry/${activityId}/${user.id}`)
                .then(() => {
                    toaster({
                        title: 'Inscrição removida!',
                        status: 'success',
                    });
                    setIsRegistered(false);
                    setAmountRegistered((old) => old - 1);
                })
                .catch((err) => {
                    let message = 'Erro inesperado';
                    if (err instanceof GenericFrontError) {
                        message = err.message;
                    }
                    toaster({
                        title: message,
                        status: 'error',
                    });
                })
                .finally(() => setSubmitIsLoading(false));
        }
    };

    return (
        <Wrapper
            shadow="lg"
            isexpanded={isExpanded.toString()}
            style={{
                backgroundColor:
                    amountRegistered >= activity.vacancy
                        ? COLORS.dangerLight
                        : COLORS.white,
            }}
        >
            <RowGroup className="title-row">
                <ExpandButton className="expand-btn" />
                <TextBig>
                    {getActivityCode(activity) + ' - ' + activity.title}
                    {rating == 0 && user && activity.activityRegistration ? (
                        <TextNormal style={{ color: '#ffbb00' }}>
                            Avaliação Pendente
                        </TextNormal>
                    ) : undefined}
                </TextBig>
                <TextNormal
                    className="vacancy-info"
                    style={{
                        fontWeight: 'lighter',
                    }}
                >
                    Vagas:{' '}
                    {activity.vacancy - amountRegistered < 0
                        ? 0
                        : activity.vacancy - amountRegistered}{' '}
                    de {activity.vacancy}
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
                <div>
                    {activity.description.split('\n').map((text, index) => (
                        <p key={index}>
                            {text}
                            <br />
                        </p>
                    ))}{' '}
                </div>
            </TextNormal>
            <TextNormal
                style={{ fontWeight: 'bold' }}
                className="teachers-name expand"
            >
                Ministrantes
            </TextNormal>
            <TextNormal className="teachers expand">
                {activity.teachingUsers && activity.teachingUsers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {activity.teachingUsers.map((user) => (
                            <span key={user.id}>{user.name}</span>
                        ))}
                    </div>
                ) : (
                    'Atividade sem ministrante definido'
                )}
            </TextNormal>
            <TextNormal
                style={{ fontWeight: 'bold' }}
                className="responsible-name expand"
            >
                Responsável
            </TextNormal>
            <TextNormal className="responsibles expand">
                {activity.responsibleUsers && activity.responsibleUsers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {activity.responsibleUsers.map((user) => (
                            <span key={user.id}>{user.name}</span>
                        ))}
                    </div>
                ) : (
                    'Atividade sem responsável definido'
                )}
            </TextNormal>
            {activity.schedules && (
                <div className="dates" style={{
                    display: 'grid',
                    justifyContent: isExpanded ? 'left' : 'right',
                }} >
                    <TextNormal
                        style={{
                            fontWeight: 'bold',
                            paddingBottom: '10px',
                        }}
                        className="schedule expand"
                    >
                        Horários e locais
                    </TextNormal>
                    {activity.schedules?.map((schedule, index) => {
                        return (
                            <DateGroup
                                key={index}
                                style={{
                                    display: isExpanded ? 'grid' : 'flex',
                                    float: isExpanded ? 'none' : 'right',
                                }}
                                className="date-group"
                            >
                                <TextNormal className="schedule-date">
                                    Data:{' '}
                                    {renderDateAsDayMonth(schedule.startDate)}
                                </TextNormal>
                                <TextNormal className="schedule-time">
                                    Horário:{' '}
                                    {renderDateAsTime(schedule.startDate)} -{' '}
                                    {renderDateAsTime(
                                        new Date(
                                            schedule.startDate.getTime() +
                                            schedule.durationInMinutes *
                                            60000
                                        )
                                    )}
                                </TextNormal>
                                <TextNormal className="schedule-room">
                                    Local:{' '}
                                    {schedule.room
                                        ? schedule.room.code
                                        : 'Virtual'}
                                </TextNormal>
                                {schedule.url ? (
                                    <TextNormal
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        className="schedule-link"
                                    >
                                        Sala virtual:{' '}
                                        <a
                                            href={schedule.url}
                                            style={{ marginLeft: '0.8rem' }}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <LinkText>{schedule.url}</LinkText>
                                        </a>
                                    </TextNormal>
                                ) : undefined}
                            </DateGroup>
                        );
                    })}
                </div>
            )}
            {activity.activityRegistration ? (
                <>
                    <div className="expand rating-label">
                        <TextNormal
                            style={{ fontWeight: 'bold' }}
                            className="expand rating"
                        >
                            Avaliação
                        </TextNormal>
                    </div>
                    <div className="expand rating-stars">
                        <div style={{ fontSize: 35 }}>
                            <StarRatingComponent
                                name="rating"
                                value={rating}
                                onStarClick={(next) => {
                                    if (user) {
                                        api.put(
                                            `/activity/${activity.id}/rate/${user.id}`,
                                            {
                                                rating: next,
                                            }
                                        )
                                            .then(() => {
                                                setRating(next);
                                            })
                                            .catch((err) => {
                                                toaster({
                                                    title: 'Erro ao enviar avaliação',
                                                    description: `${err}`,
                                                    status: 'error',
                                                });
                                            });
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            ) : undefined}

            {event &&
                event.registryStartDate <= getDate() &&
                event.registryEndDate >= getDate() &&
                (isRegistered ? (
                    <Button
                        className="subscribe-button"
                        disabled={submitIsLoading}
                        style={{
                            backgroundColor: COLORS.dangerLight,
                            marginTop: isExpanded ? '10px' : '-30px',
                            width: '180px',
                        }}
                        onClick={() => unregisterUser(activity.id)}
                    >
                        Cancelar Inscrição
                    </Button>


                ) : activity.vacancy > amountRegistered ? (
                    <Button
                        className="subscribe-button"
                        disabled={submitIsLoading}
                        style={{ marginTop: isExpanded ? '10px' : '-30px' }}
                        onClick={() => userInscription(activity.id)}
                    >
                        Inscrever
                    </Button>
                ) : (
                    <Button
                        className="subscribe-button"
                        disabled={true}
                        style={{ marginTop: isExpanded ? '10px' : '-30px' }}
                        noLoading={true}
                    >
                        Esgotado
                    </Button>
                ))}
        </Wrapper>
    );
};

ActivityCard.propTypes = {
    event: PropTypes.any.isRequired,
    activity: PropTypes.any.isRequired,
    alreadyRegistered: PropTypes.bool.isRequired,
};

export default ActivityCard;
