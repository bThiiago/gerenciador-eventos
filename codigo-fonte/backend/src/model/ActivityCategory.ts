import { InvalidActivityCategoryCode } from '@errors/invalidErrors/InvalidActivityCategoryCode';
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ActivityCategory {
    constructor(
        code?: string,
        description?: string,
    ) {
        this.code = code;
        this.description = description;
    }

    @BeforeUpdate()
    beforeUpdate(): void {
        const regexp = /^[a-zA-Z]+$/;
        if (this.code && !regexp.test(this.code))
            throw new InvalidActivityCategoryCode('Activity category code must not contain special symbol, numbers or space');
    }

    @BeforeInsert()
    beforeInsert(): void {
        const regexp = /^[a-zA-Z]+$/;
        if (!regexp.test(this.code))
            throw new InvalidActivityCategoryCode('Activity category code must not contain special symbol, numbers or space');
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { nullable: false, length: 2, unique : true })
    code: string;

    @Column('varchar', { nullable: false, length: 200 })
    description: string;
}
