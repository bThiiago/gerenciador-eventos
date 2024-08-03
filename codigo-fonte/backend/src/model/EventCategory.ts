import { InvalidUrlSrc } from '@errors/invalidErrors/InvalidUrlSrc';
import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, BeforeInsert } from 'typeorm';

@Entity({ name: 'event_category' })
export class EventCategory {
    constructor(category?: string, url_src?: string) {
        this.category = category;
        this.url_src = url_src;
    }

    @BeforeUpdate()
    beforeUpdate(): void {
        const regexp = /^[a-zA-Z0-9-_]+$/;
        if (this.url_src && !regexp.test(this.url_src))
            throw new InvalidUrlSrc('Category URL must not contain special symbols or space');
    }

    @BeforeInsert()
    beforeInsert(): void {
        const regexp = /^[a-zA-Z0-9-_]+$/;
        if (!regexp.test(this.url_src))
            throw new InvalidUrlSrc('Category URL must not contain special symbols or space');
    }

    @PrimaryGeneratedColumn({ name: 'id' })
    id?: number;

    @Column('varchar', { name: 'category', length : 80 })
    category: string;

    @Column('varchar', { unique: true, name: 'url_src', length : 20 })
    url_src: string;

}
