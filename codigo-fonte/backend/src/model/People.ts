import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    TableInheritance,
} from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class People {
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
    ) {
        this.name = name;
        this.email = email;
        this.cpf = cpf;
        this.cellphone = cellphone;
        this.birthDate = birthDate;
        this.cep = cep;
        this.city = city;
        this.uf = uf;
        this.address = address;
    }

    @PrimaryGeneratedColumn()
    id?: number;

    @Column('varchar', { length : 150 })
    name: string;

    @Column('varchar', { length: 120, unique: true, select: false })
    email: string;

    @Column('varchar', { length: 11, unique: true, select: false })
    cpf: string;

    @Column('varchar', { length: 16, unique: true, select: false })
    cellphone: string;

    @Column('timestamptz', { select: false })
    birthDate: Date; // data de nascimento

    @Column('varchar', { length: 8, nullable: true })
    cep: string;

    @Column('varchar', { length: 120, nullable: true })
    city: string;

    @Column('varchar', { length: 2, nullable: true })
    uf: string;

    @Column('varchar', { length: 120, nullable: true })
    address: string;

}
