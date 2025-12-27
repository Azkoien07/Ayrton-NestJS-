import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, ManyToMany, OneToOne } from "typeorm";
import { roleEntity } from "../../roles/entity/role.entity";
import { taskEntity } from "@/src/tasks/entity/task.entity";
import { personEntity } from "@/src/persons/entity/person.entity";

@Entity('users')
export class userEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @ManyToOne(() => roleEntity, (role) => role.users, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: roleEntity;

    @ManyToMany(() => taskEntity, (task) => task.users)
    tasks: taskEntity[];

    @OneToOne(() => personEntity, (person) => person.user, { nullable: false, eager: true })
    @JoinColumn({ name: 'person_id' })
    person: personEntity;

    @CreateDateColumn({
        type: 'datetime2',
        precision: 0,
    })
    createdAt: Date;
}