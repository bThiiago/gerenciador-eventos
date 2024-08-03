import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { dataSource } from '../database/connection';
import { InvalidSchedule } from '../errors/invalidErrors/InvalidSchedule';
import { Activity } from './Activity';
import { Room } from './Room';

@Entity({ name : 'schedule' })
export class Schedule {
    constructor(startDate ?: Date, durationInMinutes ?: number, room ?: Room, url ?: string) {
        this.startDate = startDate; 
        this.durationInMinutes = durationInMinutes; 
        this.room = room; 
        this.url = url; 
    }

    @BeforeUpdate()
    public async beforeUpdate(): Promise<void> {
        const repo = dataSource.getRepository(Schedule);
        const targetSchedule = await repo.findOneBy({ id: this.id });

        if(this.url && this.url.length == 0) {
            this.url = undefined;
        }

        if(this.url == null && this.room == null && targetSchedule.room == null) {
            throw new InvalidSchedule('O horário obrigatoriamente precisa de uma sala ou de um link associado.');
        } else if(this.room == null && this.url == null && targetSchedule.url == null) {
            throw new InvalidSchedule('O horário obrigatoriamente precisa de uma sala ou de um link associado.');
        }
    }

    @BeforeInsert()
    public async beforeInsert(): Promise<void> {
        if(this.url && this.url.length == 0) {
            this.url = undefined;
        }
        if(this.url == null && this.room == null) {
            throw new InvalidSchedule('O horário obrigatoriamente precisa de uma sala ou de um link associado.');
        }
    }

    @PrimaryGeneratedColumn()
    id : number;

    @Column('timestamp', { nullable : false })
    startDate : Date;

    @Column('int', { nullable : false })
    durationInMinutes : number;

    @Column('varchar', { length: 300, nullable : true })
    url : string;

    @ManyToOne(() => Room, room => room.schedules)
    room : Room;

    @ManyToOne(() => Activity, activity => activity.schedules, { onDelete : 'CASCADE', orphanedRowAction: 'delete' })
    activity : Activity;
}