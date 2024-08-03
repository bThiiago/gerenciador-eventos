import { EndDateBeforeStartDateRegistryError } from '@errors/specialErrors/EndDateBeforeStartDateErrorRegistry';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    ManyToMany,
    JoinTable,
    BeforeUpdate,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { EndDateBeforeStartDateError } from '../errors/specialErrors/EndDateBeforeStartDateError';
import { EndDateUndefined } from '../errors/undefinedErrors/EndDateUndefined';
import { ResponsibleUsersUndefined } from '../errors/undefinedErrors/ResponsibleUsersUndefined';
import { StartDateUndefined } from '../errors/undefinedErrors/StartDateUndefined';
import { Activity } from './Activity';
import { EventArea } from './EventArea';
import { EventCategory } from './EventCategory';
import { User } from './User';

export enum NameDisplay {
    SHOW_ALL = 0,
    SHOW_EDITION_ONLY = 1,
    SHOW_YEAR_ONLY = 2,
    SHOW_NONE = 9,
}

export enum EditionDisplay {
    ARABIC = 0,
    ORDINAL = 1,
    ROMAN = 2,
}

@Entity()
export class Event {
    constructor(
        edition?: number,
        description?: string,
        startDate?: Date,
        endDate?: Date,
        eventArea?: EventArea,
        eventCategory?: EventCategory,
        responsibleUsers?: User[],
        registryStartDate?: Date,
        registryEndDate?: Date,
        display?: number,
        editionDisplay?: number,
        icon?: string,
        banner?: string
    ) {
        this.edition = edition;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.eventArea = eventArea;
        this.eventCategory = eventCategory;
        this.responsibleUsers = responsibleUsers;
        this.registryStartDate = registryStartDate;
        this.registryEndDate = registryEndDate;
        this.display = display;
        this.editionDisplay = editionDisplay;
        this.icon = icon;
        this.banner = banner;
    }

    @BeforeInsert()
    public async beforeInsert(): Promise<void> {
        if (!this.startDate) {
            throw new StartDateUndefined(
                'The attribute startDate is undefined'
            );
        }

        if (!this.registryStartDate) {
            throw new StartDateUndefined(
                'The attribute registryStartDate is undefined'
            );
        }

        if (!this.endDate) {
            throw new EndDateUndefined('The attribute endDate is undefined');
        } else {
            this.endDate.setHours(23, 59, 59, 999);
        }

        if (!this.registryEndDate) {
            throw new EndDateUndefined(
                'The attribute registryEndDate is undefined'
            );
        } else {
            this.registryEndDate.setHours(23, 59, 59, 999);
        }

        this.statusVisible = true;
        this.statusActive = false;

        if (!this.responsibleUsers || this.responsibleUsers.length == 0) {
            throw new ResponsibleUsersUndefined();
        }

        await this.validateStartAndEndDate();
    }

    @BeforeUpdate()
    public async validateStartAndEndDate(): Promise<void> {
        if (this.startDate === null) {
            throw new StartDateUndefined(
                'The attribute startDate is undefined'
            );
        }

        if (this.registryStartDate === null) {
            throw new StartDateUndefined(
                'The attribute registryStartDate is undefined'
            );
        }

        if (this.endDate === null) {
            throw new EndDateUndefined('The attribute endDate is undefined');
        } else if (this.endDate) {
            this.endDate.setHours(23, 59, 59, 999);
        }

        if (this.registryEndDate === null) {
            throw new EndDateUndefined(
                'The attribute registryEndDate is undefined'
            );
        } else {
            this.registryEndDate.setHours(23, 59, 59, 999);
        }

        if (this.endDate.getTime() < this.startDate.getTime()) {
            throw new EndDateBeforeStartDateError();
        }
        if (this.registryEndDate.getTime() < this.registryStartDate.getTime()) {
            throw new EndDateBeforeStartDateRegistryError();
        }
    }

    @PrimaryGeneratedColumn()
    id?: number;

    @Column('int', { nullable: false })
    edition: number;

    @Column('varchar', { nullable: false, length: 5000 })
    description: string;

    @Column('timestamptz')
    startDate: Date;

    @Column('timestamptz')
    endDate: Date;

    @Column('timestamptz')
    registryStartDate: Date;

    @Column('timestamptz')
    registryEndDate: Date;

    @Column('boolean', { default: false })
    statusVisible: boolean;

    @Column('boolean', { default: false })
    statusActive: boolean;

    @ManyToMany(() => User, (user) => user.eventsResponsibility, {
        nullable: false,
    })
    @JoinTable({ name: 'organizer_event' })
    responsibleUsers: User[];

    @OneToMany(() => Activity, (activity) => activity.event)
    activities: Activity[];

    @ManyToOne(() => EventArea, { nullable: false })
    @JoinColumn({ name: 'event_area_id' })
    eventArea: EventArea;

    @ManyToOne(() => EventCategory, { nullable: false })
    @JoinColumn({ name: 'event_category_id' })
    eventCategory: EventCategory;

    @Column({
        type: 'enum',
        enum: NameDisplay,
    })
    display?: NameDisplay;

    @Column({
        type: 'enum',
        enum: EditionDisplay,
    })
    editionDisplay?: EditionDisplay;

    @Column('text', { nullable: true })
    icon?: string;

    @Column('text', { nullable: true })
    banner?: string;
}
