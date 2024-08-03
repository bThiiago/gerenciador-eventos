import React from 'react';
import { ReactDatePickerProps } from 'react-datepicker';

import { FormDataWrapper, RowGroup } from './styled';

import 'react-datepicker/dist/react-datepicker.css';
import './sizefix.css';
import COLORS from 'constants/COLORS';
import Select, { SelectProps } from 'components/Select';
import Input, { InputProps as ComponentInputProps } from 'components/Input';
import CustomButton from 'components/Button';
import DateTimePicker from 'components/DatePickers/DateTimePicker';

type InputProps = ComponentInputProps & {
    label?: string;
};

interface Props {
    name: string;
    dateProps?: Omit<ReactDatePickerProps, 'onChange'> & {
        label?: string;
    };
    rooms : { value: number; label: string }[] | undefined;
    roomSelectProps?: Partial<SelectProps>;
    durationInputProps?: Partial<InputProps>;
    urlInputProps?: Partial<InputProps>;
    removable?: boolean;
    onRemove?: { (idToRemove: string): void };
    eventDates?: [Date, Date];
}

export interface Schedule {
    id?: number;
    date?: Date;
    durationInMinutes?: number;
    room?: number;
    url?: string;
}

const SchedulePicker: React.FC<Props> = ({
    name,
    dateProps,
    roomSelectProps,
    rooms,
    durationInputProps,
    urlInputProps,
    removable,
    onRemove,
    eventDates,
}: Props) => {
    return (
        <>
            <RowGroup>
                <FormDataWrapper>
                    {eventDates ? (
                        <DateTimePicker
                            name="dateTime"
                            label={dateProps?.label}
                            {...dateProps}
                            minDate={eventDates[0]}
                            maxDate={eventDates[1]}
                        />
                    ) : (
                        <DateTimePicker
                            name="dateTime"
                            label={dateProps?.label}
                            {...dateProps}
                        />
                    )}
                </FormDataWrapper>
                <FormDataWrapper>
                    <Input
                        name="durationInMinutes"
                        type="number"
                        {...durationInputProps}
                    />
                </FormDataWrapper>
            </RowGroup>
            <RowGroup>
                <FormDataWrapper>
                    {rooms && (
                        <Select
                            name="room"
                            isClearable={true}
                            label={roomSelectProps?.label}
                            options={rooms}
                            {...roomSelectProps}
                        />
                    )}
                </FormDataWrapper>
                <FormDataWrapper>
                    <Input name="url" {...urlInputProps} />
                </FormDataWrapper>
            </RowGroup>
            {removable && (
                <CustomButton
                    style={{
                        backgroundColor: COLORS.danger,
                        color: COLORS.light,
                    }}
                    onClick={() => (onRemove ? onRemove(name) : undefined)}
                >
                    Remover
                </CustomButton>
            )}
        </>
    );
};

export default SchedulePicker;
