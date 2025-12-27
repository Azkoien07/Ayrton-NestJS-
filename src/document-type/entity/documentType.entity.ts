import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('document_types')
export class documentTypeEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    acronym: string;

    @Column()
    state: boolean;

    @CreateDateColumn({
        type: 'datetime2',
        precision: 0,
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'datetime2',
        precision: 0,
    })
    updatedAt: Date;
}