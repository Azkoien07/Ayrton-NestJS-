import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, ManyToMany } from "typeorm";
import { roleEntity } from "../../roles/entity/role.entity";
import { taskEntity } from "@/src/tasks/entity/task.entity";

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

    @CreateDateColumn()
    createdAt: Date;
}