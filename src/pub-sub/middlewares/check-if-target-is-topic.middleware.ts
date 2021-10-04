import { Injectable, NestMiddleware, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { SubscriberRepository } from '../../repository/subscriber.repository';
import { TopicRepository } from '../../repository/topic.repository';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { Subscriber } from '../../domain/model/subscriber.entity';
import { Subscription } from '../../domain/model/subscription.entity';
import { Topic } from '../../domain/model/topic.entity';
import { EventTargetType } from '../../domain/enum/event-target-type.enum';
import { ResponseDto } from '../../domain/dto/response.dto';
import { PubSubService } from '../pub-sub.service';
  
@Injectable()
export class CheckIfTargetIsTopicMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(SubscriberRepository) private readonly subscriberRepo: SubscriberRepository,
    @InjectRepository(TopicRepository) private readonly topicRepo: TopicRepository,
    @InjectRepository(SubscriptionRepository) private readonly subscriptionRepo: SubscriptionRepository,
    private readonly pubSubService: PubSubService
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    if (req.body.isEventTargetResolved === true) {
      return next();
    }

    const { subscriberIdOrTopicName } = req.params;
    const eventData = JSON.stringify(req.body);

    try {
      const topicResult: Topic = await this.topicRepo.findByName(subscriberIdOrTopicName);
      if (topicResult) {
        req.body.eventTargetObj = this.pubSubService.makeEventObject(EventTargetType.TOPIC, topicResult.id, eventData);
        const updatedTopic = await this.topicRepo.incrementPublishedEventsCount(topicResult);
        req.body.topic = updatedTopic;
        const subscriptions: Subscription[] = await this.subscriptionRepo.findByTopicID(topicResult.id);
        req.body.listeners = subscriptions.map(subscription => subscription.subscriber.url);
        return next();
      }
  
      return res.status(404).send(new ResponseDto("failed", 404, "The event cannot be published to a non existent target as the route doesn't match any existing listener ID or topic name", null));
    } catch(err) {
      return next(err);
    }
  }
}
