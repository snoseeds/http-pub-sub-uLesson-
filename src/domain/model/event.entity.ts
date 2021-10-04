import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EventTargetType } from '../enum/event-target-type.enum';

@Entity()
export class Event extends BaseEntity {

  @Column({ type: 'varchar' })
  dataJSON: string;

  @Column()
  eventTargetType: EventTargetType;

  @Column({ type: 'varchar' })
  eventTargetTypeIdColVal: string;
}
