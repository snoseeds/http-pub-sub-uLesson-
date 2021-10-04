import { Request, Response, NextFunction } from 'express';
import { ResponseDto } from '../../domain/dto/response.dto';
import { Injectable, NestMiddleware, Res } from '@nestjs/common';

@Injectable()
export class ValidatePublishRequestDtoMiddleware implements NestMiddleware {
  constructor(
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      if (Object.keys(req.body).length == 0) {
        return res.status(400).send(new ResponseDto("failed", 400, "Event's body cannot be empty", null));
      }
      return next()
    } catch(err) {
      return next(err);
    }
  }
}

