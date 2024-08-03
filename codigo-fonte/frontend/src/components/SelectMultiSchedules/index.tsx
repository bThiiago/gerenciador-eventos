import React, { useEffect, useState } from 'react';

import { Scope } from '@unform/core';

import CustomButton from 'components/Button';
import SchedulePicker, { Schedule } from 'components/SchedulePicker';
import COLORS from 'constants/COLORS';
import { ButtonWrapper, SchedulePickerWrapper } from './styled';
import { PageSubtitleLight } from 'custom-style-components';
import { fetchManyRooms } from 'services/fetch/rooms';
import createCancelTokenSource from 'utils/createCancelTokenSource';
import LoadingSpinner from 'components/LoadingSpinner';

interface Props {
    name: string;
    eventDates?: [Date, Date];
    initialSchedules?: StateProps[];
}

interface StateProps extends Schedule {
    name: string;
}

const SelectMultiSchedules: React.FC<Props> = ({
    name,
    eventDates,
    initialSchedules,
}: Props) => {
    const [selectList, setSelectList] = useState<StateProps[]>(
        initialSchedules ? initialSchedules : [{} as StateProps]
    );
    const [rooms, setRooms] = useState<{ value: number; label: string }[]>();

    useEffect(() => {
        const source = createCancelTokenSource();
        fetchManyRooms(source.token, { limit: Number.MAX_SAFE_INTEGER }).then(
            ({ rooms }) => {
                const mappedRooms = rooms.map((room) => {
                    return {
                        value: room.id,
                        label: `${room.code} - ${room.description} (Capacidade: ${room.capacity})`,
                    };
                });
                setRooms(mappedRooms);
            }
        );

        return () => source.cancel();
    }, []);

    const addNewScheduleHandler = (event?: React.MouseEvent<HTMLElement>) => {
        if (event) event.preventDefault();
        setSelectList((old) => {
            return [
                ...old,
                {
                    name: `select-${old.length + 1}`,
                },
            ];
        });
    };

    const removeScheduleHandler = (idToRemove: string) => {
        setSelectList((old) => {
            return old.filter((item) => {
                return item.name !== idToRemove;
            });
        });
    };

    const renderSchedulePickers = () => {
        return selectList.map((item, index) => {
            return (
                <Scope path={`${name}[${index}]`} key={`${item.name}`}>
                    <SchedulePickerWrapper>
                        <SchedulePicker
                            rooms={rooms}
                            name={item.name}
                            removable={index != 0}
                            dateProps={{
                                label: 'Data e horário',
                                placeholderText:
                                    'Selecione o dia e horário da atividade',
                            }}
                            roomSelectProps={{
                                label: 'Sala',
                                placeholder: 'Selecione uma sala',
                            }}
                            durationInputProps={{
                                label: 'Duração em minutos',
                                placeholder:
                                    'Informe a duração, em minutos, nesse dia',
                            }}
                            urlInputProps={{
                                label: 'Link da sala',
                                placeholder:
                                    'Adicione um link para uma sala virtual',
                            }}
                            onRemove={removeScheduleHandler}
                            eventDates={eventDates}
                        />
                    </SchedulePickerWrapper>
                </Scope>
            );
        });
    };

    return (
        <>
            <PageSubtitleLight>Datas e horários</PageSubtitleLight>
            {rooms ? (
                <>
                    {renderSchedulePickers()}
                    <ButtonWrapper>
                        <CustomButton
                            style={{
                                width: '100%',
                                backgroundColor: COLORS.primary,
                            }}
                            onClick={addNewScheduleHandler}
                        >
                            Adicionar novo horário
                        </CustomButton>
                    </ButtonWrapper>
                </>
            ) : (
                <LoadingSpinner />
            )}
        </>
    );
};

export default SelectMultiSchedules;
