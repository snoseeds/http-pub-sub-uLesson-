import { Injectable, NestMiddleware, Res, Body, ValidationPipe } from '@nestjs/common';
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
import { Validator } from 'class-validator';
  
@Injectable()
export class ValidateSubscribeRequestDtoMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(SubscriberRepository) private readonly subscriberRepo: SubscriberRepository

  ){}
  readonly validator = new Validator();
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const newSubscriber = new SubscribeRequestDto();
      Object
        .entries(req.body)
        .forEach(([key, value]) => {
          newSubscriber[key] = value
        });
        console.log(JSON.stringify(newSubscriber));

      // Just to use @Body to validate subscriberequestdto
      const errors = await this.validator.validate(newSubscriber);
      if (errors.length > 0) {
        return res.status(400).send(new ResponseDto("failed", 400, "Bad request, details are in data", errors));
      }        
      return next()
  
    } catch(err) {
      return next(err);
    }
  }
}
