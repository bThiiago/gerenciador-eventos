import {
    CustomTable,
    CustomTableButtonWrapper,
    CustomTd,
    DashboardPageContent,
    FormWrapper,
    PageSubtitle,
    PageTitle,
} from 'custom-style-components';
import React, { useEffect, useState } from 'react';
import { useParams, useRouteMatch } from 'react-router-dom';
import { ActivityRegistry, ActivityType, ScheduleType } from 'types/models';
import { GenericFrontError } from 'errors/GenericFrontError';
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from '@chakra-ui/modal';
import {
    IconButton,
    Checkbox,
    Tooltip,
    useToast,
    UseToastOptions,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import CustomButton from 'components/Button';
import ErrorMessage from 'components/ErrorMessage';
import GoBackButton from 'components/GoBackButton';
import LoadingSpinner from 'components/LoadingSpinner';
import COLORS from 'constants/COLORS';
import TOAST from 'constants/TOAST';
import { useAuth } from 'hooks/auth';
import { api } from 'services/axios';
import { fetchOneActivity } from 'services/fetch/activities';
import { fetchManyRegistriesByActivity } from 'services/fetch/registries';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import {
    renderDateAsDayMonth,
    renderDateAsTime,
    getDate
} from 'utils/dateUtils';
import { maskCpf } from 'utils/maskCpf';
import {
    downloadRegistryXls,
    downloadRegistryPdf,
    downloadPresenceListPdf
} from 'utils/reportUtils';

interface ParamTypes {
    activityId: string;
}

const MarkPresences: React.FC = () => {
    const toastId = 'presence';
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

    const { activityId } = useParams<ParamTypes>();
    const { user } = useAuth();
    const { path } = useRouteMatch();
    const isResponsibleWindow = path.includes('responsavel');
    const isAdminWindow = path.includes('admin') && path.includes('presencas');
    const isOrganizerWindow =
        path.includes('organizador') && path.includes('presencas');

    const [submittedPresence, setSubmittedPresence] = useState({
        loading: false,
        user: -1,
        schedule: -1,
    });
    const [isSubmiting, setIsSubmiting] = useState(false);

    const [readyForEmission, setReadyForEmission] = useState<boolean>();
    const [registryCompleted, setRegistryCompleted] = useState<boolean>();

    const [schedules, setSchedules] = useState<ScheduleType[]>();

    const [activity, setActivity] = useState<ActivityType>();
    const [registryList, setRegistryList] = useState<ActivityRegistry[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    useEffect(() => {
        const source = createCancelTokenSource();
        setLoading(true);
        if (user) {
            fetchOneActivity(source.token, activityId)
                .then((activity) => {
                    setActivity(activity);
                    const scheduleList = activity.schedules;

                    const currentDate = getDate();
                    const isReady = scheduleList.every(
                        (schedule) => schedule.startDate < currentDate
                    );
                    setRegistryCompleted(activity.readyForCertificateEmission);
                    setReadyForEmission(isReady);
                    setSchedules(activity.schedules);
                    return fetchManyRegistriesByActivity(
                        source.token,
                        activityId,
                        {
                            limit: Number.MAX_SAFE_INTEGER,
                        }
                    );
                })
                .then(({ registries }) => {
                    setRegistryList(registries);
                })
                .catch((err) => {
                    setError(err.message);
                    toast({
                        title: err.message,
                        status: 'error',
                    });
                })
                .finally(() => setLoading(false));
        }
        return () => source.cancel();
    }, []);

    const renderSchedules = () => {
        return schedules?.map((schedule, index) => {
            return (
                <th key={index + 100}>
                    {renderDateAsDayMonth(schedule.startDate)},{' '}
                    {renderDateAsTime(schedule.startDate)}
                </th>
            );
        });
    };

    const handlePresenceEmission = (
        toCheck: boolean,
        scheduleId: number,
        userId: number
    ) => {
        const url = `/activity/presence/schedule/${scheduleId}/user/${userId}`;
        setSubmittedPresence({
            loading: true,
            schedule: scheduleId,
            user: userId,
        });

        const apiCall = toCheck ? api.post : api.delete;

        apiCall(url)
            .then(() =>
                toast({
                    title: toCheck ? 'Presença marcada' : 'Presença desmarcada',
                    duration: 1500,
                    status: 'info',
                })
            )
            .catch((err) => {
                console.log(err);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() =>
                setSubmittedPresence({
                    loading: false,
                    schedule: -1,
                    user: -1,
                })
            );
    };

    const handleActivityPresenceEmission = () => {
        setIsSubmiting(true);
        api.put(`/activity/${activityId}`, {
            readyForCertificateEmission: true,
        })
            .then(() => {
                setRegistryCompleted(true);
                toast({
                    title: 'As presenças foram emitidas',
                    status: 'success',
                });
            })
            .catch((err) => {
                console.log(err);
                toast({
                    title: err.message,
                    status: 'error',
                });
            })
            .finally(() => {
                setIsSubmiting(false);
                setConfirmModalOpen(false);
                window.location.reload();
            });
    };

    const handleActivityPresenceSupress = () => {
        setIsSubmiting(false);
        api.put(`/activity/${activityId}`, {
            readyForCertificateEmission: false,
        })
            .then(() => {
                setRegistryCompleted(false);
                toast({
                    title: 'As presenças podem ser alteradas',
                    status: 'info',
                });
            })
            .catch((err) => {
                console.log(err);
                toast({
                    title: err.message,
                    status: 'error',
                });
            });
    };

    const unregisterUser = (userId: number) => {
        if (user) {
            api.delete(`/activity/registry/${activity?.id}/${userId}`)
                .then(() => {
                    toaster({
                        title: 'Inscrição removida',
                        status: 'success',
                    });
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
                .finally(() => {
                    window.location.reload();
                });
        }
    };

    const renderIfNoParticipant = () => {
        let message = 'Não há participantes nessa atividade';
        if (readyForEmission)
            message += ' Você pode optar por finalizar a atividade';
        return <div>{message}</div>;
    };

    const renderTableElements = (registries: ActivityRegistry[]) => {
        return registries.map((registry, index) => {
            return (
                <tr key={index}>
                    <CustomTd>
                        <CustomTableButtonWrapper>
                            <Tooltip
                                hasArrow
                                fontSize="1.2rem"
                                label="Remover Inscrição"
                            >
                                <IconButton
                                    variant="ghost"
                                    color="red.600"
                                    fontSize="1.5rem"
                                    icon={<DeleteIcon />}
                                    aria-label="Remover Inscrição"
                                    onClick={() =>
                                        unregisterUser(registry.user.id)
                                    }
                                />
                            </Tooltip>
                        </CustomTableButtonWrapper>
                    </CustomTd>
                    <CustomTd>
                        <div>{registry.user.name}</div>
                        <div>CPF {maskCpf(registry.user.cpf || '')}</div>
                        <div>
                            Data de inscrição:{' '}
                            {renderDateAsDayMonth(registry.registryDate) +
                                ' ' +
                                renderDateAsTime(registry.registryDate)}
                        </div>
                    </CustomTd>
                    {registry.presences.map((presence, index) => {
                        const targetSchedule =
                            registry.activity.schedules[index];
                        const canEnable = targetSchedule.startDate < getDate();
                        return (
                            <CustomTd align="center" key={index}>
                                {canEnable ? (
                                    <Checkbox
                                        onChange={(e) => {
                                            handlePresenceEmission(
                                                e.target.checked,
                                                registry.activity.schedules[
                                                    index
                                                ].id,
                                                registry.user.id
                                            );
                                        }}
                                        isDisabled={
                                            registryCompleted || isSubmiting
                                        }
                                        defaultChecked={presence.isPresent}
                                        colorScheme="green"
                                        size="lg"
                                    >
                                        {submittedPresence.loading &&
                                            submittedPresence.user ===
                                            registry.user.id &&
                                            submittedPresence.schedule ===
                                            targetSchedule.id ? (
                                                <LoadingSpinner />
                                            ) : (
                                                <>
                                                    <p
                                                        style={{
                                                            fontSize: '1.6rem',
                                                        }}
                                                    >
                                                    Presente
                                                    </p>
                                                </>
                                            )}
                                    </Checkbox>
                                ) : (
                                    'Para ocorrer'
                                )}
                            </CustomTd>
                        );
                    })}
                </tr>
            );
        });
    };

    return (
        <DashboardPageContent>
            <Modal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Deseja concluir a presença?</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Ao concluir a presença, sua atividade ficará pronta para
                        os certificados. Até o fim do evento ainda será possivel
                        alterar as presenças.
                    </ModalBody>
                    <ModalFooter>
                        <CustomButton
                            style={{
                                backgroundColor: COLORS.success,
                                marginRight: '0.8rem',
                            }}
                            onClick={() => handleActivityPresenceEmission()}
                        >
                            Emitir
                        </CustomButton>
                        <CustomButton
                            style={{ backgroundColor: COLORS.danger }}
                            onClick={() => setConfirmModalOpen(false)}
                        >
                            Cancelar
                        </CustomButton>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <FormWrapper>
                <PageTitle>Controle de presenças</PageTitle>
                <PageSubtitle>{activity && activity.title}</PageSubtitle>
                <GoBackButton />
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : loading ? (
                    <LoadingSpinner />
                ) : registryList && registryList.length > 0 ? (
                    <CustomTable>
                        <thead>
                            <tr>
                                <th>Ações</th>
                                <th>Participante</th>
                                {renderSchedules()}
                            </tr>
                        </thead>

                        <tbody>
                            {registryList && renderTableElements(registryList)}
                        </tbody>
                    </CustomTable>
                ) : (
                    renderIfNoParticipant()
                )}
                {!loading && (
                    <div style={{ marginTop: '0.8rem' }}>
                        {!registryCompleted &&
                            activity &&
                            registryList &&
                            (isResponsibleWindow ||
                                isAdminWindow ||
                                isOrganizerWindow) && (
                            <>
                                <CustomButton
                                    style={{
                                        backgroundColor: COLORS.success,
                                        marginRight: '0.8rem',
                                    }}
                                    title={
                                        !readyForEmission
                                            ? 'Não é possível emitir presenças quando todas as datas da atividade não ocorreram'
                                            : undefined
                                    }
                                    noLoading={!readyForEmission}
                                    disabled={
                                        !readyForEmission || isSubmiting
                                    }
                                    onClick={() =>
                                        setConfirmModalOpen(true)
                                    }
                                >
                                    Concluir atividade
                                </CustomButton>
                                <CustomButton
                                    style={{
                                        backgroundColor:
                                            COLORS.primaryLight,
                                        marginRight: '0.8rem',
                                    }}
                                    noLoading={!readyForEmission}
                                    disabled={
                                        !readyForEmission || isSubmiting
                                    }
                                    onClick={() =>
                                        downloadPresenceListPdf(
                                            activity,
                                            registryList
                                        )
                                    }
                                >
                                    Baixar Lista de Presença
                                </CustomButton>
                            </>
                        )}
                        {registryCompleted &&
                            (isResponsibleWindow ||
                                isAdminWindow ||
                                isOrganizerWindow) && (
                            <CustomButton
                                style={{
                                    backgroundColor: COLORS.success,
                                    marginRight: '0.8rem',
                                }}
                                title={
                                    !readyForEmission
                                        ? 'Não é possível emitir presenças quando todas as datas da atividade não ocorreram'
                                        : undefined
                                }
                                noLoading={!readyForEmission}
                                onClick={() =>
                                    handleActivityPresenceSupress()
                                }
                            >
                                Alterar presenças
                            </CustomButton>
                        )}
                        {registryCompleted && activity && registryList && (
                            <>
                                <CustomButton
                                    style={{
                                        backgroundColor: COLORS.primaryLight,
                                        marginRight: '0.8rem',
                                    }}
                                    onClick={() =>
                                        downloadRegistryPdf(
                                            activity,
                                            registryList
                                        )
                                    }
                                >
                                    Baixar Relatório
                                </CustomButton>
                                <CustomButton
                                    style={{
                                        backgroundColor: COLORS.primaryLight,
                                        marginRight: '0.8rem',
                                    }}
                                    onClick={() =>
                                        downloadRegistryXls(
                                            activity,
                                            registryList,
                                            'xlsx'
                                        )
                                    }
                                >
                                    Gerar presença .XLSX
                                </CustomButton>
                                <CustomButton
                                    style={{
                                        backgroundColor: COLORS.primaryLight,
                                        marginRight: '0.8rem',
                                    }}
                                    onClick={() =>
                                        downloadRegistryXls(
                                            activity,
                                            registryList,
                                            'xls'
                                        )
                                    }
                                >
                                    Gerar presença .XLS
                                </CustomButton>
                            </>
                        )}
                    </div>
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default MarkPresences;
