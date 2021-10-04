import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { SubscriberRepository } from '../../repository/subscriber.repository';
import { Subscriber } from '../../domain/model/subscriber.entity';
import { EventTargetType } from '../../domain/enum/event-target-type.enum';
import { PubSubService } from '../pub-sub.service';
  
@Injectable()
export class CheckIfTargetIsSubscriberMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(SubscriberRepository) private readonly subscriberRepo: SubscriberRepository,
    private readonly pubSubService: PubSubService
  ){}
  
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const { subscriberIdOrTopicName } = req.params;
      const eventData = JSON.stringify(req.body);

      try {
        const subscriberResult: Subscriber = await this.subscriberRepo.findBySubscriberID(subscriberIdOrTopicName);
        if (subscriberResult) {
          req.body.eventTargetObj = this.pubSubService.makeEventObject(EventTargetType.SUBSCRIBER, subscriberResult.id, eventData);
          const updatedSubscriber = await this.subscriberRepo.incrementDirectlyPublishedEventsCount(subscriberResult);
          req.body.subscriber = updatedSubscriber;
          req.body.listeners = [subscriberResult.url];
          req.body.isEventTargetResolved = true;
        }
      } catch (err) {
        return next();
      }
      return next();
    } catch(err) {
      return next(err);
    }
  }
}
