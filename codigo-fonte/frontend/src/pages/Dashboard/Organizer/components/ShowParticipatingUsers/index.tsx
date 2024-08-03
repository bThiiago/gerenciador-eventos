import React, { ReactElement, useEffect, useState } from 'react';
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from '@chakra-ui/modal';
import { PageSubtitle } from 'custom-style-components';
import LoadingSpinner from 'components/LoadingSpinner';
import ErrorMessage from 'components/ErrorMessage';
import CustomButton from 'components/Button';
import COLORS from 'constants/COLORS';
import { EventType, People } from 'types/models';
import { maskCpf } from 'utils/maskCpf';
import PropTypes from 'prop-types';
import getActivityCode from 'utils/getActivityCode';
import {
    getWorkloadInHours,
    renderDateForPresence,
    renderDateWithTime,
} from 'utils/dateUtils';
import generatePdf from 'utils/generatePdf';
import convertToStaticHtml from 'utils/convertToStaticHtml';
import renderEventName from 'utils/renderEventName';

interface ShowParticipatingUsersProps {
    modalOpen: boolean;
    setModalOpen: (param: boolean) => void;
    loading: boolean;
    error: string | null;
    users: People[];
    event: EventType;
}

const ShowParticipatingUsers: React.FC<ShowParticipatingUsersProps> = ({
    modalOpen,
    setModalOpen,
    loading,
    error,
    users,
    event,
}) => {
    const [downloading, setDownloading] = useState(false);

    const [filter, setFilter] = useState(0);

    const [workload, setWorkload] = useState<number[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<People[]>([]);

    useEffect(() => {
        const updatedWorkload: number[] = [];
        const filteredUserList: People[] = [];

        users.forEach((user) => {
            const workloadUser =
                user.activityRegistration?.reduce((prev, next) => {
                    if (next.activity && next.activity.workloadInMinutes) {
                        return prev + next.activity.workloadInMinutes;
                    }
                    return prev;
                }, 0) || 0;

            const workloadTeacher =
                user.managingActivities?.reduce((prev, next) => {
                    return prev + next.workloadInMinutes;
                }, 0) || 0;

            const workloadInHours = getWorkloadInHours(
                workloadUser + workloadTeacher
            );

            if (workloadInHours >= filter) {
                updatedWorkload.push(workloadInHours);
                filteredUserList.push(user);
            }
        });

        setWorkload(updatedWorkload);
        setFilteredUsers(filteredUserList);
    }, [users, filter]);

    const generateSummarizedParticipantsEventPdf = () => {
        const element = (
            <div>
                <PageSubtitle
                    style={{
                        fontSize: 20,
                        marginBottom: '1.6rem',
                        textAlign: 'center',
                    }}
                >
                    Participantes por evento - resumo
                </PageSubtitle>
                <PageSubtitle style={{ fontSize: 18, marginBottom: '2.5rem' }}>
                    Evento: {renderEventName(event)}
                </PageSubtitle>
                <table
                    style={{
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                        width: '100%',
                    }}
                >
                    <tr
                        style={{
                            textAlign: 'left',
                        }}
                    >
                        <th>Participante</th>
                        <th>Carga Horária</th>
                    </tr>
                    {filteredUsers.map((user, index) => {
                        return (
                            <div
                                key={user.cpf}
                                style={{ marginBottom: '2.4rem' }}
                            >
                                <tr
                                    key={user.cpf}
                                    style={{
                                        borderBottom: 'solid 1px grey',
                                        paddingBottom: '5px',
                                    }}
                                >
                                    <td
                                        style={{
                                            paddingBottom: '5px',
                                            paddingTop: '10px',
                                        }}
                                    >
                                        {user.name} (
                                        {user.cpf && maskCpf(user.cpf)})
                                    </td>
                                    <td
                                        style={{
                                            paddingBottom: '5px',
                                            paddingTop: '10px',
                                        }}
                                    >
                                        {workload[index]} horas
                                    </td>
                                </tr>
                            </div>
                        );
                    })}
                </table>
            </div>
        );
        generatePdf(
            `relatorio_participantes_resumido_${renderEventName(event)}`,
            convertToStaticHtml(element)
        );
        setDownloading(false);
    };

    const generateParticipantsEventPdf = () => {
        const filteredUsers = users.filter((user) => {
            if (
                !user.activityRegistration ||
                user.activityRegistration.length === 0
            ) {
                return false;
            }
            const workload =
                user.activityRegistration &&
                user.activityRegistration.reduce((prev, next) => {
                    if (next.activity && next.activity.workloadInMinutes) {
                        return prev + next.activity.workloadInMinutes;
                    }
                    return prev;
                }, 0);
            const workloadInHours = getWorkloadInHours(workload);
            return workloadInHours >= filter;
        });

        const participants = filteredUsers.map((user) => {
            const activities = user.activityRegistration?.map(
                (registry, index) => {
                    const presences = registry.presences.map(
                        (presence, index) => (
                            <div
                                key={index}
                                style={{
                                    marginLeft: '2.4rem',
                                    fontSize: 16,
                                }}
                            >
                                {renderDateForPresence(
                                    new Date(presence.schedule.startDate),
                                    presence.schedule.durationInMinutes
                                )}
                            </div>
                        )
                    );

                    return (
                        <div
                            key={index}
                            style={{
                                marginBottom: '2rem',
                                pageBreakInside: 'avoid',
                            }}
                        >
                            {getActivityCode(registry.activity)} -{' '}
                            {registry.activity.title}
                            <div
                                style={{
                                    marginLeft: '2.4rem',
                                }}
                            >
                                Carga horária:{' '}
                                {getWorkloadInHours(
                                    registry.activity.workloadInMinutes
                                )}{' '}
                                horas
                                <br />
                                Inscrição:{' '}
                                {renderDateWithTime(registry.registryDate)}
                                <br />
                                Presenças (
                                <span style={{ fontWeight: 'bold' }}>
                                    {registry.readyForCertificate
                                        ? 'Completo'
                                        : 'Incompleto'}
                                </span>
                                ){presences}
                            </div>
                        </div>
                    );
                }
            );

            return (
                <div key={user.cpf} style={{ marginBottom: '2.4rem', marginTop: '5%'}}>
                    <hr style={{
                        marginTop: '1%',
                        background: 'black',
                    }}></hr>
                    <div style={{ fontSize: 20 }}>
                        <b>{user.name}</b> ({user.cpf && maskCpf(user.cpf)})
                    </div>
                    <div
                        style={{
                            marginLeft: '2.4rem',
                            fontSize: 18,
                            fontWeight: 'normal',
                            marginTop: '2%',
                        }}
                    >
                        {activities}
                    </div>
                </div>
            );
        });

        const element = (
            <div>
                <div
                    style={{
                        fontSize: 20,
                        marginBottom: '1.6rem',
                        textAlign: 'center',
                    }}
                >
                    Participantes por evento - detalhado
                </div>
                <div style={{ fontSize: 18, textAlign: 'center' }}>
                    Evento: {event.editionDisplay}{' '}
                    {event.eventCategory.category}{' '}
                    {event.startDate.getFullYear()}
                </div>
                {participants}
            </div>
        );

        generatePdf(
            `relatorio_participantes_${renderEventName(event)}`,
            convertToStaticHtml(element)
        );
        setDownloading(false);
    };

    const renderParticipatingUsers = (
        users: People[]
    ): ReactElement[] | string => {
        if (users.length > 0) {
            return users.map((user) => {
                return (
                    <div key={user.cpf} style={{ marginBottom: '2.4rem' }}>
                        <PageSubtitle style={{ fontSize: 20 }}>
                            {user.name} ({user.cpf && maskCpf(user.cpf)})
                        </PageSubtitle>
                        <PageSubtitle
                            style={{
                                marginLeft: '2.4rem',
                                fontSize: 18,
                                fontWeight: 'normal',
                            }}
                        >
                            {user.activityRegistration?.map(
                                (registry, index) => {
                                    return (
                                        <div
                                            key={index}
                                            style={{ marginBottom: '2rem' }}
                                        >
                                            {getActivityCode(registry.activity)}
                                            - {registry.activity.title}
                                            <div
                                                style={{
                                                    marginLeft: '2.4rem',
                                                }}
                                            >
                                                Carga horária:{' '}
                                                {getWorkloadInHours(
                                                    registry.activity
                                                        .workloadInMinutes
                                                )}{' '}
                                                horas
                                                <br />
                                                Inscrição:{' '}
                                                {renderDateWithTime(
                                                    registry.registryDate
                                                )}
                                                <br />
                                                Presenças (
                                                <span
                                                    style={{
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    {registry.readyForCertificate
                                                        ? 'Completo'
                                                        : 'Incompleto'}
                                                </span>
                                                )
                                                {registry.presences.map(
                                                    (presence, index) => {
                                                        return (
                                                            <div
                                                                key={index}
                                                                style={{
                                                                    marginLeft:
                                                                        '2.4rem',
                                                                    fontSize: 16,
                                                                }}
                                                            >
                                                                {renderDateForPresence(
                                                                    new Date(
                                                                        presence.schedule.startDate
                                                                    ),
                                                                    presence
                                                                        .schedule
                                                                        .durationInMinutes
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </PageSubtitle>
                    </div>
                );
            });
        }
        return 'Não há participantes neste evento';
    };

    return (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
            <ModalOverlay />
            <ModalContent maxW="80%" maxH="90%" style={{ overflowY: 'scroll' }}>
                <ModalHeader>
                    Participantes do evento {renderEventName(event)}
                </ModalHeader>
                <ModalCloseButton />
                {!loading && users.length > 0 && (
                    <ModalFooter>
                        <div
                            style={{
                                display: 'grid',
                                margin: '2rem auto 3rem',
                            }}
                        >
                            <label htmlFor="search">Filtro carga horária</label>
                            <input
                                id="search"
                                type="number"
                                min="0"
                                value={isNaN(filter) ? '' : filter.toString()}
                                onChange={(e) =>
                                    setFilter(parseInt(e.target.value))
                                }
                                placeholder="Filtrar carga horária mínima"
                                style={{
                                    borderRadius: '5px',
                                    borderColor: '#bebebe',
                                    width: '100%',
                                    fontSize: 'max(16px,1em)',
                                    backgroundColor: '#fff',
                                    minHeight: '3.8rem',
                                    padding: '0 1rem',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                }}
                            >
                                <CustomButton
                                    style={{
                                        backgroundColor: COLORS.success,
                                        margin: '0.8rem',
                                    }}
                                    onClick={() => {
                                        setDownloading(true);
                                        generateSummarizedParticipantsEventPdf();
                                    }}
                                    disabled={downloading}
                                    noLoading={false}
                                >
                                    Baixar resumo
                                </CustomButton>
                                <CustomButton
                                    style={{
                                        backgroundColor: COLORS.success,
                                        margin: '0.8rem',
                                    }}
                                    onClick={() => {
                                        setDownloading(true);
                                        generateParticipantsEventPdf();
                                    }}
                                    disabled={downloading}
                                    noLoading={false}
                                >
                                    Baixar detalhado
                                </CustomButton>
                            </div>
                        </div>
                    </ModalFooter>
                )}
                <ModalBody>
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <ErrorMessage>
                            Ocorreu um erro ao tentar consultar os usuários.
                        </ErrorMessage>
                    ) : (
                        renderParticipatingUsers(users)
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

ShowParticipatingUsers.propTypes = {
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    users: PropTypes.any.isRequired,
    event: PropTypes.any.isRequired,
};

export default ShowParticipatingUsers;
