import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from '../domain/model/subscriber.entity';
import { Topic } from '../domain/model/topic.entity';
import { TopicRepository } from '../repository/topic.repository';
import { Subscription } from '../domain/model/subscription.entity';
import { Event } from '../domain/model/event.entity';
import { EventTargetType } from '../domain/enum/event-target-type.enum';
const axios = require('axios');
import fs = require('fs');
import { join } from 'path'

@Injectable()
export class PubSubService {

  constructor(
    @InjectRepository(TopicRepository) private readonly topicRepo: TopicRepository
  ) {}

  makeEventObject(eventTargetType, eventTargetTypeIdColVal: string, dataJSON: string) {
    return {
      eventTargetType,
      eventTargetTypeIdColVal,
      dataJSON
    }
  }

  async publish(listeners: string[], createdEvent: Event) {
    const dispatchesPromises: Promise<string>[] = [];
    for (let webHookUrl of listeners) {
      dispatchesPromises.push(
        (async function asyncFunc (): Promise<any> {
          try {
            const { data } = await axios.post(
                webHookUrl,
                JSON.parse(createdEvent.dataJSON)
              )
            // console.log("here we are", data);
            return {
              webHookUrl,
              data
            }
          } catch (error) {
            const { name, message } = error.toJSON();
            throw {
              webHookUrl,
              error: `${name}: ${message}`
            }
          }
        })()
      );
    }
    console.log(createdEvent);
    try {
      const webhooksStatusesAndValues = await Promise.allSettled(dispatchesPromises);
      
      const eventStatusLogObj = {
        ...createdEvent,
        numOfSubscribers: listeners.length,
        webhooksStatusesAndValues,
      };

      fs.writeFileSync(
        // join(__dirname, 'published-events-status', `${createdEvent.createDateTime}-${createdEvent.id}.json`),
        join(__dirname, 'published-events-status', `${createdEvent.id}.json`),
        JSON.stringify(eventStatusLogObj, null, 2)
      );
      console.log(`Done logging the status object of the event with id of '${createdEvent.id}'`);
    } catch (err) {

    }
  }
}
