import { EntityRepository, Repository } from 'typeorm';
import { Event } from '../domain/model/event.entity';


@EntityRepository(Event)
export class EventRepository extends Repository<Event> {

  createEvent(newEvent: Event) {
    return this.save(newEvent);
  }
}