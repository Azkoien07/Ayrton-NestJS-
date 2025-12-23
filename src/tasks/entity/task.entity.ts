import { userEntity } from "@/src/users/entity/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from "typeorm";

@Entity('tasks')
export class taskEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    state: string;

    @Column()
    priority: string;

    @Column()
    type: string;

    @Column()
    createdAt: Date;

    @Column()
    expirationDate: Date;

    @Column()
    reminder: boolean

    @ManyToMany(() => userEntity, (user) => user.tasks)
    @JoinTable({
        name: 'user_tasks',
        joinColumn: { name: 'task_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
    })
    users: userEntity[];
}