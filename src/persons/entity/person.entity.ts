import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, OneToOne, ManyToOne } from "typeorm";
import { userEntity } from "@/src/users/entity/user.entity";
import { documentTypeEntity } from "@/src/document-type/entity/documentType.entity";

@Entity('persons')
export class personEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    document: string;

    @Column()
    phone: string;

    @Column()
    bloodType: string;

    @Column()
    address: string;

    @Column({ nullable: true })
    photo?: string;

    @Column()
    state: boolean;

    @OneToOne(() => userEntity, (user) => user.person, { nullable: false, cascade: true })
    user: userEntity;

    @ManyToOne(() => documentTypeEntity, { eager: true, nullable: false })
    @JoinColumn({ name: 'document_type_id' })
    documentType: documentTypeEntity;

    @CreateDateColumn({
        type: 'datetime2',
        precision: 0,
    })
    createdAt: Date;
}