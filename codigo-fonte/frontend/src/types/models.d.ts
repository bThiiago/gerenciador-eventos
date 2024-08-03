import { EditionDisplay, NameDisplay } from './interfaces';

export interface EventType {
    id: number;
    edition: number;
    description: string;
    startDate: Date;
    endDate?: Date;
    responsibleUsers?: Partial<People>[];
    statusVisible?: boolean;
    statusActive?: boolean;
    icon?: string;
    banner?: string;
    eventArea: EventArea;
    eventCategory: EventCategory;
    readyForCertificate?: boolean;
    registryStartDate: Date;
    registryEndDate: Date;
    display: NameDisplay;
    editionDisplay: EditionDisplay;
    canExclude?: boolean;
    canEditTime?: boolean;
}

export interface EventArea {
    id: number;
    name: string;
    sigla: string;
    canExclude?: boolean;
}

export interface EventCategory {
    id: number;
    category: string;
    url_src: string;
    canExclude?: boolean;
}

export interface RoomType {
    id: number;
    code: string;
    capacity?: number;
    canExclude?: boolean;
    description: string;
}

export interface ScheduleType {
    id: number;
    startDate: Date;
    durationInMinutes: number;
    room: RoomType;
    url: string;
}

export interface ActivityType {
    id: number;
    title: string;
    description: string;
    vacancy: number;
    workloadInMinutes: number;
    readyForCertificateEmission?: boolean;
    event: Partial<EventType>;
    schedules: ScheduleType[];
    responsibleUsers?: Partial<People>[];
    teachingUsers?: Partial<People>[];
    totalRegistry?: number;
    activityCategory: ActivityCategory;
    indexInCategory: number;
    activityRegistration?: { rating: number }[];
}

export interface ActivityCategory {
    id: number;
    code: string;
    description: string;
    canExclude: boolean;
}

export interface ActivityRegistry {
    id: number;
    registryDate: Date;
    user: People;
    activity: ActivityType;
    presences: {
        id: number;
        isPresent: boolean;
        schedule: ScheduleType;
    }[];
    readyForCertificate: boolean;
}

export interface People {
    id: number;
    name: string;
    email?: string;
    cpf?: string;
    cellphone?: string;
    birthDate?: Date;
    cep?: string;
    city?: string;
    uf?: string;
    address?: string;
    activityRegistration?: ActivityRegistry[];
    managingActivities?: ActivityType[];
    active?: boolean;
}

export type EventAreaAPIModel = EventArea;
export type EventCategoryAPIModel = EventCategory;
export type ActivityCategoryAPIModel = ActivityCategory;
export type RoomAPIModel = RoomType;

export interface ScheduleAPIModel extends ScheduleType {
    startDate: string;
}

export interface ActivityAPIModel extends Partial<ActivityType> {
    id: number;
    event?: EventAPIModel;
    schedules?: ScheduleAPIModel[];
    responsibleUsers?: PeopleAPIModel[];
    teachingUsers?: PeopleAPIModel[];
    activityCategory: ActivityCategoryAPIModel;
}

export interface EventAPIModel {
    id: number;
    startDate?: string;
    endDate?: string;
    responsibleUsers?: PeopleAPIModel[];
    eventArea?: EventAreaAPIModel;
    eventCategory?: EventCategoryAPIModel;
    registryStartDate: string;
    registryEndDate: string;
}

export interface PeopleAPIModel extends Partial<People> {
    id: number;
    birthDate?: string;
    activityRegistration?: ActivityRegistryAPIModel[];
}

export interface ActivityRegistryAPIModel extends ActivityRegistry {
    registryDate: string;
    user?: PeopleAPIModel;
    activity: ActivityAPIModel;
}

export interface City {
    id: number;
    nome: string;
}

export interface Uf {
    id: number;
    sigla: string;
    nome: string;
}
