import { Injectable, NestMiddleware, Res, Body} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { Subscription } from '../../domain/model/subscription.entity';
import { ResponseDto } from '../../domain/dto/response.dto';
import { SubscribeRequestDto } from '../../domain/dto/subscribe.request.dto';

@Injectable()
export class CreateSubscriptionIfNotExistMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(SubscriptionRepository) private readonly subscriptionRepo: SubscriptionRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { subscriber, topic } = req.body;
      try {
        const subscription: Subscription = await this.subscriptionRepo.findByCompoundKey(`${subscriber.id}${topic.id}`);
        if (subscription) {
          return res.status(400).send(new ResponseDto(
            "failed",
            400,
            "This subscriber has previously subscribed to this topic, please see subscription's details in data",
            {
              subscriptionDetails: subscription
            }
          ));
        }
        req.body.subscriptionDetails = await this.subscriptionRepo.createNewSubscription(subscriber, topic);
        return next();
      } catch (err) {
        return next(err);
      }
    } catch(err) {
      return next(err);
    }
  }
}
