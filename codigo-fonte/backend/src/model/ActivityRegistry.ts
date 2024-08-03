import {
    Entity,
    ManyToOne,
    Column,
    OneToMany,
    JoinColumn,
    Unique,
    PrimaryGeneratedColumn,
    AfterLoad,
} from 'typeorm';
import { User } from './User';
import { Activity } from './Activity';
import { Presence } from './Presence';

@Entity()
@Unique(['user', 'activity'])
export class ActivityRegistry {
    constructor(activity?: Activity, user?: User) {
        this.user = user;
        this.activity = activity;
    }

    @AfterLoad()
    sortItems() : void {
        if (this?.presences?.length && this.presences[0].schedule) {
            this.presences.sort((a, b) => {
                if(a.schedule.startDate < b.schedule.startDate) return -1;
                if (b.schedule.startDate < a.schedule.startDate) return 1;
                return 0;
            });
        }
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('timestamp', { nullable: false, default: () => 'CURRENT_DATE' })
    registryDate: Date;

    @ManyToOne(() => User, (user) => user.activityRegistration, {
        nullable: false,
    })
    @JoinColumn()
    user: User;

    @ManyToOne(() => Activity, (activity) => activity.activityRegistration, {
        nullable: false,
    })
    @JoinColumn()
    activity: Activity;

    @OneToMany(() => Presence, (presence) => presence.activityRegistry, {
        cascade: ['insert', 'update'],
    })
    presences: Presence[];

    @Column('boolean', { nullable: false, default: true })
    readyForCertificate: boolean;

    @Column('int', { default: 0 })
    rating: number;
}
