import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import {
    DashboardPageContent,
    FormWrapper,
    PageTitle,
} from 'custom-style-components';
import { Form } from '@unform/web';
import { FormHandles, SubmitHandler } from '@unform/core';
import * as Yup from 'yup';

import DateRangePicker from 'components/DatePickers/DateRangePicker';
import Select from 'components/Select';
import Button from 'components/Button';
import { api } from 'services/axios';
import getValidationError from 'utils/getValidationErrors';

import COLORS from 'constants/COLORS';
import { EventArea, EventCategory, EventType, People } from 'types/models';
import TextArea from 'components/TextArea';
import TOAST from 'constants/TOAST';
import { useToast } from '@chakra-ui/toast';
import { GenericFrontError } from 'errors/GenericFrontError';
import { ResponseError } from 'errors/ResponseError';
import { fetchManyUsers } from 'services/fetch/users';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import { fetchManyAreas } from 'services/fetch/eventAreas';
import { fetchManyCategories } from 'services/fetch/eventCategories';
import { useHistory } from 'react-router';
import { stringifyUserWithCpf } from 'utils/stringifyUserWithCpf';
import GoBackButton from 'components/GoBackButton';
import { EditionDisplay, NameDisplay } from 'types/enums';
import renderEventName from 'utils/renderEventName';
import RadioOptions from 'components/RadioOptions';
import ConfirmDeleteComponent from 'components/ConfirmDeleteComponent';
import InputMask from 'components/InputMask';
import { Input } from '@chakra-ui/react';
import { getDate } from 'utils/dateUtils';
import { eventSchema} from 'validation/eventSchema';

interface FormData {
    edition: number;
    area: number;
    description: string;
    responsible: number[];
    category: number;
    dateRange: [Date, Date];
    dateRangeRegistry: [Date, Date];
    nameDisplay: number;
    editionDisplay: number;
    icon: ArrayBuffer;
}

const CreateEvent: React.FC = () => {
    const toast = useToast({
        duration: TOAST.DURATION,
        position: TOAST.DEFAULT_POSITION,
        isClosable: TOAST.CLOSABLE_BY_DEFAULT,
    });

    const formRef = useRef<FormHandles>(null);
    const filePickerRef = useRef<HTMLInputElement>(null);
    const bannerPickerRef = useRef<HTMLInputElement>(null);
    const history = useHistory();
    const [people, setPeople] = useState<People[]>([]);
    const [areas, setAreas] = useState<EventArea[]>([]);
    const [categories, setCategories] = useState<EventCategory[]>([]);
    const [chosenEndDate, setChosenEndDate] = useState<Date>();
    const [selectedIcon, setSelectedIcon] = useState<string>();
    const [selectedBanner, setSelectedBanner] = useState<string>();

    const [submitLoading, setSubmitLoading] = useState(false);

    const [previewEvent, setPreviewEvent] = useState<Partial<EventType>>({
        display: NameDisplay.SHOW_ALL,
        editionDisplay: EditionDisplay.ROMAN,
        eventCategory: undefined,
        edition: undefined,
        startDate: undefined,
    });

    const updatePreviewEvent = () => {
        setTimeout(() => {
            if (formRef.current) {
                const getValue = formRef.current.getFieldValue;
                setPreviewEvent({
                    display: parseInt(getValue('nameDisplay')),
                    editionDisplay: parseInt(getValue('editionDisplay')),
                    eventCategory: categories.find(
                        (cat) => cat.id == getValue('category')
                    ),
                    edition:
                        getValue('edition') !== ''
                            ? parseInt(getValue('edition'))
                            : undefined,
                    startDate: getValue('dateRange')[0]
                        ? new Date(getValue('dateRange')[0])
                        : undefined,
                });
            }
        }, 50);
    };
    const [confirmClearDateModalOpen, setConfirmClearDateModalOpen] =
        useState(false);

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchManyUsers(source.token, {
            limit: Number.MAX_SAFE_INTEGER
        }).then(({ users }) => {
            setPeople(users);
        });
        fetchManyCategories(source.token, {
            limit: Number.MAX_SAFE_INTEGER,
        }).then((result) => {
            setCategories(result.categories);
        });
        fetchManyAreas(source.token, {
            limit: Number.MAX_SAFE_INTEGER,
        }).then((result) => {
            setAreas(result.areas);
        });

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
 
    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitLoading(true);
        try {
            formRef.current?.setErrors({});

            await eventSchema.validate(data, {
                abortEarly: false,
            });

            const request_data = {
                edition: data.edition,
                description: data.description,
                startDate: data.dateRange[0].toISOString(),
                endDate:
                    data.dateRange[1] && !isNaN(data.dateRange[1].getTime())
                        ? data.dateRange[1].toISOString()
                        : data.dateRange[0].toISOString(),
                registryStartDate: data.dateRangeRegistry[0].toISOString(),
                registryEndDate:
                    data.dateRangeRegistry[1] &&
                    !isNaN(data.dateRangeRegistry[1].getTime())
                        ? data.dateRangeRegistry[1].toISOString()
                        : data.dateRangeRegistry[0].toISOString(),
                responsibleUsers: data.responsible.map((r) => ({ id: r })),
                eventArea: {
                    id: data.area,
                },
                eventCategory: {
                    id: data.category,
                },
                display: data.nameDisplay,
                editionDisplay: data.editionDisplay,
                icon: selectedIcon,
                banner: selectedBanner,
            };

            await api.post('/sge', request_data);
            toast({
                title: 'Evento cadastrado',
                status: 'success',
            });
            history.push('/dashboard/admin/edicoes');
        } catch (error) {
            setSubmitLoading(false);
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);
                formRef.current?.setErrors(erros);
            } else if (error instanceof GenericFrontError) {
                let message = error.message;
                if (error instanceof ResponseError) {
                    message = 'Não foi possível cadastrar o evento';
                    if (error.status == 409)
                        message = 'Já existe um evento com a edição informada';
                }
                toast({
                    title: message,
                    status: 'error',
                });
            }
        }
    };

    const handlerClear = () => {
        console.log('Aviso de limpeza de campo');
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
                <PageTitle>Cadastrar uma nova edição</PageTitle>
                <GoBackButton />
                <Form
                    ref={formRef}
                    onSubmit={onSubmit}
                    initialData={{
                        nameDisplay: NameDisplay.SHOW_ALL.toString(),
                        editionDisplay: EditionDisplay.ROMAN.toString(),
                    }}
                    onChange={updatePreviewEvent}
                >
                    {previewEvent.eventCategory &&
                        previewEvent.edition &&
                        previewEvent.startDate && (
                        <label htmlFor="preview_name">
                            Prévia formatada do nome do evento:
                        </label>
                    )}
                    <h2>
                        {previewEvent.eventCategory
                            ? previewEvent.edition
                                ? previewEvent.startDate
                                    ? renderEventName(previewEvent)
                                    : 'Selecione o período'
                                : 'Defina a edição'
                            : 'Selecione o evento'}
                    </h2>
                    <Select
                        name="area"
                        label="Área"
                        options={areas.map((area) => {
                            return {
                                value: area.id,
                                label: area.name + ` (${area.sigla})`,
                            };
                        })}
                        placeholder="Escolha a área"
                    />
                    <Select
                        name="category"
                        label="Evento"
                        options={categories.map((category) => {
                            return {
                                value: category.id,
                                label:
                                    category.category +
                                    ` (${category.url_src})`,
                            };
                        })}
                        placeholder="Escolha qual o evento a ser realizado"
                        onChange={updatePreviewEvent}
                    />
                    <InputMask
                        label="Edição"
                        name="edition"
                        placeholder="Informe o número da edição (Ex: 1, 2, 3...)"
                        type="number"
                        maxLength={3}
                        mask={'editionMask'}
                    />
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
                        name="responsible"
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
                        onMody={(flag) => setConfirmClearDateModalOpen(flag)}
                    />
                    <DateRangePicker
                        key={chosenEndDate?.getTime()}
                        disabledKeyboardNavigation
                        label="Selecione o período de inscrição"
                        name="dateRangeRegistry"
                        minDate={getDate()}
                        maxDate={chosenEndDate}
                        disabled={!chosenEndDate}
                        placeholderText={
                            !chosenEndDate
                                ? 'Você deve definir a data do evento antes'
                                : 'Selecione uma data inicial e final'
                        }
                    />
                    <TextArea
                        label="Descrição"
                        name="description"
                        rows={3}
                        placeholder="Descrição do evento (até 5000 caracteres)"
                        maxLength={5000}
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
                    <Button
                        style={{ backgroundColor: COLORS.success }}
                        disabled={submitLoading}
                    >
                        Cadastrar evento
                    </Button>
                </Form>
            </FormWrapper>
        </DashboardPageContent>
    );
};

export default CreateEvent;
