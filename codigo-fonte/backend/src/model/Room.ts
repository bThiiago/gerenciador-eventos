import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InvalidCapacityValue } from '../errors/invalidErrors/InvalidCapacityValue';
import { Schedule } from './Schedule';

@Entity({ name: 'room' })
export class Room {
    constructor(code?: string, capacity?: number, description?: string) {
        this.code = code;
        this.capacity = capacity;
        this.description = description;
    }

    @BeforeUpdate()
    public async beforeUpdate(): Promise<void> {
        await this.beforeInsert();
    }

    @BeforeInsert()
    public async beforeInsert(): Promise<void> {
        if (this.capacity <= 0) {
            throw new InvalidCapacityValue(
                'The capacity cannot be equal or lower to zero'
            );
        }
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 4, nullable: false, unique : true })
    code: string;

    @Column('int', { nullable: false })
    capacity: number;

    @Column('varchar', {length: 50, nullable: false})
    description: string;

    @OneToMany(() => Schedule, (schedule) => schedule.room)
    schedules: Schedule[];
}
