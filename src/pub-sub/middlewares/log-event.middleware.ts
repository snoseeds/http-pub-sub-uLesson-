import { Injectable, NestMiddleware} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { EventRepository } from '../../repository/event.repository';
import { Event } from '../../domain/model/event.entity';
  
@Injectable()
export class LogEventMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(EventRepository) private readonly eventRepo: EventRepository,
  ){}
  
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const createdEvent: Event = await this.eventRepo.createEvent(req.body.eventTargetObj);
      req.body.createdEvent = createdEvent;
      return next();
    } catch(err) {
      return next(err);
    }  
  }
}
