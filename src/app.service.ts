import { Injectable } from '@nestjs/common';
import { ResponseDto } from './domain/dto/response.dto';

@Injectable()
export class AppService {
  home(): ResponseDto<string> {
    return new ResponseDto(
      "success",
      200,
      "Welcome to Version 1.0.0 of HTTP BASED TOPIC PUB SUB Service",
      "Please note the structure of this response as the structure for all response bodies in this domain's endpoints"
    )
  }
}
