import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { FormHandles, SubmitHandler } from '@unform/core';
import { Form } from '@unform/web';
import { useHistory, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import {
    DashboardPageContent,
    FormWrapper,
    PageSubtitle,
    PageTitle,
} from 'custom-style-components';

import CustomButton from 'components/Button';
import DateRangePicker from 'components/DatePickers/DateRangePicker';
import ToggleUnform from 'components/ToggleUnform';
import Select from 'components/Select';

import { api } from 'services/axios';
import { EventArea, EventType, People } from 'types/models';
import getValidationError from 'utils/getValidationErrors';
import COLORS from 'constants/COLORS';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import { useToast } from '@chakra-ui/toast';
import TOAST from 'constants/TOAST';
import { fetchOneEvent } from 'services/fetch/events';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import ErrorMessage from 'components/ErrorMessage';
import LoadingSpinner from 'components/LoadingSpinner';
import { fetchManyUsers } from 'services/fetch/users';
import { fetchManyAreas } from 'services/fetch/eventAreas';
import { stringifyUserWithCpf } from 'utils/stringifyUserWithCpf';
import GoBackButton from 'components/GoBackButton';
import TextArea from 'components/TextArea';
import renderEventName from 'utils/renderEventName';
import RadioOptions from 'components/RadioOptions';
import { EditionDisplay, NameDisplay } from 'types/enums';
import { Input } from '@chakra-ui/react';
import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';
import { getDate } from 'utils/dateUtils';
import { eventEditSchema } from 'validation/eventSchema';

interface ParamTypes {
    eventId: string;
}

interface FormData {
    edition: number;
    name: string;
    area: number;
    responsibleUsers: number[];
    description: string;
    dateRange: [Date, Date];
    dateRangeRegistry: [Date, Date];
    statusVisible: boolean;
    statusActive: boolean;
    nameDisplay: number;
    editionDisplay: number;
    icon: ArrayBuffer;
}

const EditEvent: React.FC = () => {
    const history = useHistory();
    const formRef = useRef<FormHandles>(null);
    const filePickerRef = useRef<HTMLInputElement>(null);
    const bannerPickerRef = useRef<HTMLInputElement>(null);
    const { eventId } = useParams<ParamTypes>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [event, setEvent] = useState<EventType>();
    const [people, setPeople] = useState<People[]>([]);
    const [areas, setAreas] = useState<EventArea[]>([]);
    const [chosenEndDate, setChosenEndDate] = useState<Date>();
    const [selectedIcon, setSelectedIcon] = useState<string>();
    const [selectedBanner, setSelectedBanner] = useState<string>();

    const [submitLoading, setSubmitLoading] = useState(false);
    const [confirmClearDateModalOpen, setConfirmClearDateModalOpen] =
        useState(false);

    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const [previewEvent, setPreviewEvent] = useState<Partial<EventType>>({
        display: NameDisplay.SHOW_ALL,
        editionDisplay: EditionDisplay.ROMAN,
        eventCategory: undefined,
        edition: undefined,
        startDate: undefined,
    });

    const updatePreviewEvent = () => {
        setTimeout(() => {
            if (event && formRef.current) {
                const getValue = formRef.current.getFieldValue;
                setPreviewEvent({
                    display: parseInt(getValue('nameDisplay')),
                    editionDisplay: parseInt(getValue('editionDisplay')),
                    eventArea: event.eventArea,
                    eventCategory: event.eventCategory,
                    edition: event.edition,
                    startDate: getValue('dateRange')[0]
                        ? new Date(getValue('dateRange')[0])
                        : undefined,
                });
            }
        }, 50);
    };

    useEffect(updatePreviewEvent, [event]);

    useEffect(() => {
        if (error) {
            toast({
                title: error,
                status: 'error',
            });
        }
    }, [error]);

    useEffect(() => {
        if (chosenEndDate) {
            setLoading(false);
        }
    }, [chosenEndDate]);

    useEffect(() => {
        const source = createCancelTokenSource();
        setLoading(true);
        fetchManyAreas(source.token, {
            limit: Number.MAX_SAFE_INTEGER,
        }).then((result) => {
            setAreas(result.areas);
        });
        fetchManyUsers(source.token, { limit: Number.MAX_SAFE_INTEGER })
            .then(({ users }) => {
                setPeople(users);
                return fetchOneEvent(source.token, eventId);
            })
            .then((event) => {
                setEvent(event);
                setChosenEndDate(event.endDate);
            })
            .catch((error) => {
                if (error instanceof GenericFrontError) {
                    let message = error.message;
                    if (error instanceof ResponseError && error.status === 404)
                        message = 'Evento não encontrado.';
                    setError(message);
                }
            })
            .finally(() => setLoading(false));
        return () => source.cancel();
    }, []);

    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const onIconChange: ChangeEventHandler<any> = (event) => {
        const resetFilePickerText = () => {
            if (filePickerRef.current) filePickerRef.current.value = '';
            setSelectedIcon(undefined);
        };

        const selectedFile = event.target.files[0];

        if (!selectedFile) {
            resetFilePickerText();
            return;
        }

        // se o arquivo tiver mais de 4mb
        if (selectedFile.size / 1048576 > 4) {
            resetFilePickerText();
            toast({
                title: 'Erro',
                description: 'Ícone muito grande',
                status: 'error',
            });
            return;
        }

        selectedFile.arrayBuffer().then((buffer: ArrayBuffer) => {
            setSelectedIcon(
                `data:${
                    event.target.files[0].type
                };base64,${arrayBufferToBase64(buffer)}`
            );
        });
    };

    const onBannerChange: ChangeEventHandler<any> = (event) => {
        const resetFilePickerText = () => {
            if (bannerPickerRef.current) bannerPickerRef.current.value = '';
            setSelectedBanner(undefined);
        };

        const selectedFile = event.target.files[0];

        if (!selectedFile) {
            resetFilePickerText();
            return;
        }

        // se o arquivo tiver mais de 4mb
        if (selectedFile.size / 1048576 > 4) {
            resetFilePickerText();
            toast({
                title: 'Erro',
                description: 'Banner muito grande',
                status: 'error',
            });
            return;
        }

        selectedFile.arrayBuffer().then((buffer: ArrayBuffer) => {
            setSelectedBanner(
                `data:${
                    event.target.files[0].type
                };base64,${arrayBufferToBase64(buffer)}`
            );
        });
    };

    const handlerClear = () => {
        console.log('Aviso de limpeza de campo');
    };

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        try {
            formRef.current?.setErrors({});

            await eventEditSchema.validate(data, {
                abortEarly: false,
            }); 

            const request_data = {
                eventArea: {
                    id: data.area,
                },
                responsibleUsers: data.responsibleUsers.map((r) => ({ id: r })),
                startDate: data.dateRange
                    ? data.dateRange[0].toISOString()
                    : undefined,
                endDate: data.dateRange
                    ? !isNaN(data.dateRange[1].getTime())
                        ? data.dateRange[1].toISOString()
                        : data.dateRange[0]?.toISOString()
                    : undefined,
                statusActive: data.statusActive,
                statusVisible: data.statusVisible,
                registryStartDate: data.dateRangeRegistry
                    ? data.dateRangeRegistry[0].toISOString()
                    : undefined,
                registryEndDate: data.dateRangeRegistry
                    ? !isNaN(data.dateRangeRegistry[1].getTime())
                        ? data.dateRangeRegistry[1].toISOString()
                        : data.dateRangeRegistry[0]?.toISOString()
                    : undefined,
                display: data.nameDisplay,
                editionDisplay: data.editionDisplay,
                description: data.description,
                icon: selectedIcon,
                banner: selectedBanner,
            };

            await api.put(`/sge/${eventId}`, request_data);
            toast({
                title: 'Evento atualizado',
                status: 'success',
            });
            history.push('/dashboard/admin/edicoes');
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);

                console.log(erros);
                formRef.current?.setErrors(erros);
                return;
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    message = 'Não foi possível alterar os dados do evento';
                }
                toast({
                    title: message,
                    status: 'error',
                });
            }
            setSubmitLoading(false);
        }
    };

    return (
        <DashboardPageContent>
            <FormWrapper>
                <ConfirmDeleteComponent
                    modalOpen={confirmClearDateModalOpen}
                    setModalOpen={setConfirmClearDateModalOpen}
                    handleDelete={() => handlerClear()}
                    customTitle="Alteração no período do evento"
                    customMessage="Ao alterar o período do evento o período de inscrição é apagado, lembre-se de preecher novamente."
                    customModal={true}
                />
                <PageTitle>Alterar evento</PageTitle>
                <PageSubtitle>{event && renderEventName(event)}</PageSubtitle>
                <GoBackButton />
                {error ? (
                    <ErrorMessage>{error}</ErrorMessage>
                ) : loading ? (
                    <LoadingSpinner />
                ) : (
                    <Form
                        ref={formRef}
                        onSubmit={onSubmit}
                        initialData={{
                            area: {
                                value: event?.eventArea?.id,
                                label: event?.eventArea?.name,
                            },
                            responsibleUsers: event?.responsibleUsers?.map(
                                (r) => ({
                                    value: r.id,
                                    label: stringifyUserWithCpf(r),
                                })
                            ),
                            dateRange: [event?.startDate, event?.endDate],
                            dateRangeRegistry:
                                event?.endDate?.getTime() ===
                                chosenEndDate?.getTime()
                                    ? [
                                        event?.registryStartDate,
                                        event?.registryEndDate,
                                    ]
                                    : [undefined, undefined],
                            nameDisplay: event?.display?.toString(),
                            editionDisplay: event?.editionDisplay.toString(),
                            description: event?.description,
                            icon: event?.icon,
                            banner: event?.banner,
                        }}
                        onChange={updatePreviewEvent}
                    >
                        <label htmlFor="preview_name">
                            Prévia formatada do nome do evento:
                        </label>
                        <h2>
                            {previewEvent.eventCategory
                                ? previewEvent.edition
                                    ? previewEvent.startDate
                                        ? renderEventName(previewEvent)
                                        : 'Selecione o período'
                                    : 'Defina a edição'
                                : 'Selecione o evento'}
                        </h2>
                        <RadioOptions
                            name="nameDisplay"
                            label="Apresentação de nome"
                            options={[
                                {
                                    label: 'Apresentar edição e ano',
                                    value: NameDisplay.SHOW_ALL.toString(),
                                },
                                {
                                    label: 'Apresentar apenas a edição',
                                    value: NameDisplay.SHOW_EDITION_ONLY.toString(),
                                },
                                {
                                    label: 'Apresentar apenas o ano',
                                    value: NameDisplay.SHOW_YEAR_ONLY.toString(),
                                },
                                {
                                    label: 'Não apresentar nem a edição nem o ano',
                                    value: NameDisplay.SHOW_NONE.toString(),
                                },
                            ]}
                        />
                        <RadioOptions
                            name="editionDisplay"
                            label="Formato da edição"
                            options={[
                                {
                                    label: 'Arábico (1, 2, 3, 4...)',
                                    value: EditionDisplay.ARABIC.toString(),
                                },
                                {
                                    label: 'Romano (I, II, III, IV...)',
                                    value: EditionDisplay.ROMAN.toString(),
                                },
                                {
                                    label: 'Ordinal (1°, 2°, 3°, 4°...)',
                                    value: EditionDisplay.ORDINAL.toString(),
                                },
                            ]}
                        />
                        <Select
                            name="area"
                            label="Área"
                            options={areas.map((a) => ({
                                value: a.id,
                                label: a.name,
                            }))}
                            placeholder="Escolha a área"
                        />
                        <Select
                            name="responsibleUsers"
                            label="Organizadores do evento"
                            options={people.map((user) => {
                                return {
                                    value: user.id,
                                    label: stringifyUserWithCpf(user),
                                };
                            })}
                            placeholder="Escolha ao menos um organizador"
                            isMulti
                        />
                        <DateRangePicker
                            name="dateRange"
                            disabledKeyboardNavigation
                            label="Selecione o período do evento"
                            minDate={getDate()}
                            placeholderText="Selecione uma data inicial e final"
                            onValueChange={(_, end) => {
                                setChosenEndDate(end);
                                updatePreviewEvent();
                            }}
                            onMody={(flag) =>
                                setConfirmClearDateModalOpen(flag)
                            }
                        />
                        <DateRangePicker
                            key={chosenEndDate?.getTime()}
                            disabledKeyboardNavigation
                            label="Selecione o período de inscrição"
                            name="dateRangeRegistry"
                            minDate={getDate()}
                            maxDate={chosenEndDate}
                            placeholderText={
                                !chosenEndDate
                                    ? 'Você deve definir a data do evento antes'
                                    : 'Selecione uma data inicial e final'
                            }
                        />
                        <ToggleUnform
                            name="statusVisible"
                            label="Visibilidade do evento"
                            defaultChecked={event?.statusVisible}
                        />
                        <ToggleUnform
                            name="statusActive"
                            label="Evento ativo"
                            defaultChecked={event?.statusActive}
                        />
                        <TextArea
                            label="Descrição"
                            name="description"
                            rows={3}
                            placeholder="Descrição do evento (até 5000 caracteres)."
                        />
                        Ícone
                        <Input
                            type="file"
                            name="icon"
                            accept="image/*"
                            onChange={onIconChange}
                            ref={filePickerRef}
                        />
                        Banner
                        <Input
                            type="file"
                            name="banner"
                            accept="image/*"
                            onChange={onBannerChange}
                            ref={bannerPickerRef}
                        />
                        <CustomButton
                            disabled={submitLoading}
                            style={{ backgroundColor: COLORS.success }}
                        >
                            Atualizar dados
                        </CustomButton>
                    </Form>
                )}
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default EditEvent;
