import { IsNotEmpty, IsOptional, IsString, isURL, IsUrl, ValidateIf } from 'class-validator';
import { Subscriber } from '../model/subscriber.entity';
import { Topic } from '../model/topic.entity';
import { Subscription } from '../model/subscription.entity';

export class SubscribeRequestDto {

  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
    require_tld: false
  })
  url: string;
}