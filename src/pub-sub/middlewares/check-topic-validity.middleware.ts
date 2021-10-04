import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { SubscriberRepository } from '../../repository/subscriber.repository';
import { TopicRepository } from '../../repository/topic.repository';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { Subscriber } from '../../domain/model/subscriber.entity';
import { Subscription } from '../../domain/model/subscription.entity';
import { Topic } from '../../domain/model/topic.entity';
import { Event } from '../../domain/model/event.entity';
import { EventTargetType } from '../../domain/enum/event-target-type.enum';
import { ResponseDto } from '../../domain/dto/response.dto';
import { REQUEST } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { SubscribeRequestDto } from '../../domain/dto/subscribe.request.dto';
  
@Injectable()
export class CheckTopicValidityMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(SubscriberRepository) private readonly subscriberRepo: SubscriberRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { topic } = req.params;

      // Check to make sure that topic is not a valid uuid on our platform, to avoid a rare clash
      // the catch function will be the path to continue if all is fine
      try {
        await this.subscriberRepo.findBySubscriberID(topic);
        return res.status(400).send(new ResponseDto("failed", 400, "The topic to be subscribed to cannot have the format of a valid uuid", null));
      } catch (err) {
        // Being here means the topic isn't a valid uuid in our platform
      }
      return next()
  
    } catch(err) {
      return next(err);
    }
  }
}
