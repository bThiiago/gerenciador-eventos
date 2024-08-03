import {
    Entity,
    ManyToOne,
    Column,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { ActivityRegistry } from './ActivityRegistry';
import { Schedule } from './Schedule';

@Entity()
@Unique(['activityRegistry', 'schedule'])
export class Presence {
    constructor(schedule ?: Schedule, activityRegistry ?: ActivityRegistry) {
        this.activityRegistry = activityRegistry;
        this.schedule = schedule;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        () => ActivityRegistry,
        (activityRegistry) => activityRegistry.presences,
        {
            onDelete: 'CASCADE',
            orphanedRowAction: 'delete',
        }
    )
    activityRegistry: ActivityRegistry;

    @ManyToOne(() => Schedule, {
        nullable : false,
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    schedule: Schedule;

    @Column('boolean', {
        nullable: false,
        default: true,
    })
    isPresent: boolean;
}
