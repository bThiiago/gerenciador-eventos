import {
    Column,
    ChildEntity,
    BeforeInsert,
    BeforeUpdate,
    ManyToMany,
    OneToMany,
} from 'typeorm';
import { UserLevel } from './UserLevel';
import { People } from './People';
import bcrypt from 'bcrypt';
import * as cpf from 'node-cpf';
import { InvalidCpf } from '../errors/invalidErrors/InvalidCpf';
import { PasswordUndefined } from '../errors/undefinedErrors/PasswordUndefined';
import { CPFUndefined } from '../errors/undefinedErrors/CpfUndefined';
import { Activity } from './Activity';
import { Event } from './Event';
import { ActivityRegistry } from './ActivityRegistry';

@ChildEntity()
export class User extends People {
    constructor(
        name?: string,
        email?: string,
        cpf?: string,
        cellphone?: string,
        birthDate?: Date,
        cep?: string,
        city?: string,
        uf?: string,
        address?: string,
        login?: string,
        password?: string,
        level?: UserLevel,
    ) {
        super(name, email, cpf, cellphone, birthDate, cep, city, uf, address);
        this.login = login;
        this.password = password;
        this.level = level;
    }

    @BeforeUpdate()
    async beforeUpdate(): Promise<void> {
        if (this.password === null) {
            throw new PasswordUndefined();
        }

        if (this.password) {
            this.password = await bcrypt.hash(this.password, 8);
        }

        if (this.cpf && !cpf.validate(this.cpf)) {
            throw new InvalidCpf();
        }
    }

    @BeforeInsert()
    async beforeInsert(): Promise<void> {
        if (!this.password) throw new PasswordUndefined();
        if (!this.cpf) throw new CPFUndefined();

        await this.beforeUpdate();
    }

    @Column('varchar', { length: 120, select: false, unique: true })
    login?: string;

    @Column('varchar', { length: 60, select: false, nullable: false })
    password?: string;

    @Column({
        type: 'enum',
        enum: UserLevel,
        default: UserLevel.DEFAULT,
    })
    level?: UserLevel; // nivel de acesso

    @ManyToMany(() => Event, (event) => event.responsibleUsers)
    eventsResponsibility: Event[];

    @ManyToMany(() => Activity, (activity) => activity.responsibleUsers)
    activitiesResponsibility: Activity[];

    @ManyToMany(() => Activity, (activity) => activity.teachingUsers)
    managingActivities: Activity[];

    @OneToMany(
        () => ActivityRegistry,
        (activityRegistry) => activityRegistry.user
    )
    activityRegistration: ActivityRegistry[];

    @Column({ type: 'boolean', default: true, select : false })
    active: boolean;
}
