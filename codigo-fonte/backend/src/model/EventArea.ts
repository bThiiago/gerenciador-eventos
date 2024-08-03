import { InvalidUrlSrc } from '@errors/invalidErrors/InvalidUrlSrc';
import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, BeforeInsert } from 'typeorm';

@Entity({ name: 'event_area' })
export class EventArea {
    constructor(name?: string, sigla?: string) {
        this.name = name;
        this.sigla = sigla;
    }

    @BeforeUpdate()
    beforeUpdate(): void {
        const regexp = /^[a-zA-Z0-9-_]+$/;
        if (this.sigla && !regexp.test(this.sigla))
            throw new InvalidUrlSrc('Category URL must not contain special symbols or space');
    }

    @BeforeInsert()
    beforeInsert(): void {
        const regexp = /^[a-zA-Z0-9-_]+$/;
        if (!regexp.test(this.sigla))
            throw new InvalidUrlSrc('Category URL must not contain special symbols or space');
    }

    @PrimaryGeneratedColumn({ name: 'id' })
    id?: number;

    @Column('varchar', { name: 'name', length : 80 })
    name: string;

    @Column('varchar', { unique: true, name: 'sigla', length : 20 })
    sigla: string;

}
