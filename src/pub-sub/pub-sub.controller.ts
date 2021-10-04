import { Body, Controller, Param, Req, Post, Res } from '@nestjs/common';
import { PubSubService } from './pub-sub.service';
import { SubscribeRequestDto } from '../domain/dto/subscribe.request.dto';
import { ResponseDto } from '../domain/dto/response.dto';
import { Request, Response } from 'express';
const fireAndForgetter = require('fire-and-forgetter').default;

@Controller()
export class PubSubController {
  constructor(private readonly pubSubService: PubSubService) {}

  public fireAndForget = fireAndForgetter();
  @Post('publish/:subscriberIdOrTopicName')
  publish(@Req() req: Request, @Res() res: Response) {
    // this.fireAndForget(() => this.pubSubService
    //   .publish(req.body.listerners, req.body.eventTargetObj));

    this.pubSubService
    .publish(req.body.listeners, req.body.createdEvent);

    return res.status(200).send(
      new ResponseDto(
        "success",
        200,
        "Publish request is successfully validated, logged and being processed, please note the eventId and details in data",
        {
          eventDetails: req.body.createdEvent,
          numOfRecipientsToBePublishedTo: req.body.listeners.length,
          topicDetails: req.body.topic || "Not Applicable",
          subscriberDetails: req.body.subscriber || "Not Applicable",
        }
      )
    )
  }

  @Post('subscribe/:topic')
  subscribe(@Param('topic') topic: string, @Req() req: Request, @Res() res: Response) {
    const {
      url,
      subscriberStatus,
      topicStatus,
      subscriptionDetails,
    } = req.body;
    return res.status(201).send(
      new ResponseDto(
        "success",
        201,
        `The subscriber with the url '${url}' has been successfully subscribed to the topic with the name '${topic}', please note the subscription's details in data`,
        {
          subscriberStatus,
          topicStatus,
          subscriptionDetails
        }
      )
    )
  }
}
