import {
    AfterLoad,
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { InvalidVacancyValue } from '../errors/invalidErrors/InvalidVacancyValue';
import { InvalidWorkloadMinutesValue } from '../errors/invalidErrors/InvalidWorkloadMinutesValue';
import { Event } from './Event';
import { Schedule } from './Schedule';
import { User } from './User';
import { ActivityRegistry } from './ActivityRegistry';
import { ResponsibleUsersUndefined } from '../errors/undefinedErrors/ResponsibleUsersUndefined';
import { SchedulesUndefined } from '../errors/undefinedErrors/SchedulesUndefined';
import { ActivityCategory } from './ActivityCategory';
import { dataSource } from '@database/connection';

@Entity()
export class Activity {
    constructor(
        title?: string,
        description?: string,
        vacancy?: number,
        workloadInMinutes?: number,
        event?: Event,
        schedules?: Schedule[],
        responsibleUsers?: User[],
        teachingUsers?: User[],
        activityCategory?: ActivityCategory,
        readyForCertificateEmission?: boolean
    ) {
        this.title = title;
        this.description = description;
        this.vacancy = vacancy;
        this.workloadInMinutes = workloadInMinutes;
        this.event = event;
        this.schedules = schedules;
        this.responsibleUsers = responsibleUsers;
        this.teachingUsers = teachingUsers;
        this.activityCategory = activityCategory;
        this.readyForCertificateEmission = readyForCertificateEmission;
    }

    @BeforeUpdate()
    public async beforeUpdate(): Promise<void> {
        if (this.vacancy <= 0)
            throw new InvalidVacancyValue(
                'Número de vagas inferior ou igual a zero'
            );

        if (this.workloadInMinutes <= 0)
            throw new InvalidWorkloadMinutesValue(
                'Carga horária inferior ou igual a zero'
            );
    }

    @BeforeInsert()
    public async beforeInsert(): Promise<void> {
        if(!this.indexInCategory && this.event && this.activityCategory)
            this.indexInCategory =  await dataSource
                .getRepository(Activity)
                .createQueryBuilder('activity')
                .innerJoin('activity.event', 'event')
                .innerJoin('activity.activityCategory', 'category')
                .select(['activity.id', 'event.id', 'category.id'])
                .where('event.id = :eventId', { eventId : this.event.id })
                .andWhere('category.id = :categoryId', { categoryId : this.activityCategory.id })
                .getCount() + 1;

        if (this.vacancy <= 0)
            throw new InvalidVacancyValue(
                'Número de vagas inferior ou igual a zero'
            );

        if (this.workloadInMinutes <= 0)
            throw new InvalidWorkloadMinutesValue(
                'Carga horária inferior ou igual a zero'
            );

        if (this.schedules == null || this.schedules.length == 0)
            throw new SchedulesUndefined();

        if (this.responsibleUsers == null || this.responsibleUsers.length == 0)
            throw new ResponsibleUsersUndefined();
    }

    @AfterLoad()
    sortItems(): void {
        if (this?.schedules?.length) {
            this.schedules.sort((a, b) => {
                if (a.startDate < b.startDate) return -1;
                if (b.startDate < a.startDate) return 1;
                return 0;
            });
        }
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { nullable: false, length: 100 })
    title: string;

    @Column('varchar', { nullable: false, length: 1500 })
    description: string;

    /** Vagas totais disponíveis para a atividade */
    @Column('int', { nullable: false })
    vacancy: number;

    @Column('int', { nullable: false })
    workloadInMinutes: number;

    @Column('boolean', { nullable: false, default: false, select: false })
    readyForCertificateEmission: boolean;

    @ManyToOne(() => Event, (event) => event.activities, {
        nullable: false,
        cascade: false,
        onDelete: 'CASCADE',
    })
    event: Event;

    @OneToMany(() => Schedule, (schedule) => schedule.activity, {
        cascade: ['insert', 'update'],
    })
    schedules: Schedule[];

    @ManyToMany(() => User, (user) => user.activitiesResponsibility)
    @JoinTable({ name: 'responsible_activity' })
    responsibleUsers: User[];

    @ManyToMany(() => User, (user) => user.managingActivities)
    @JoinTable({ name: 'manager_activity' })
    teachingUsers: User[];

    @OneToMany(
        () => ActivityRegistry,
        (activityRegistry) => activityRegistry.activity
    )
    activityRegistration: ActivityRegistry[];

    @ManyToOne(() => ActivityCategory, { nullable: false })
    @JoinColumn({ name: 'activity_category_id' })
    activityCategory: ActivityCategory;

    @Column('int', { name: '', nullable: false })
    indexInCategory: number;
}