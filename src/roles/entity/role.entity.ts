import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { userEntity } from "../../users/entity/user.entity";

@Entity('roles')
export class roleEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => userEntity, (user) => user.role)
    users: userEntity[];
}
