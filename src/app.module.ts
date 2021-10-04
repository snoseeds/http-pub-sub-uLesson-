import { Module, NestModule, RequestMethod, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configService } from './config/config.service';
import { PubSubController } from './pub-sub/pub-sub.controller';
import { PubSubService } from './pub-sub/pub-sub.service';
import { ValidatePublishRequestDtoMiddleware } from './pub-sub/middlewares/validate-publish-request-dto.middleware'
import { CheckIfTargetIsSubscriberMiddleware } from './pub-sub/middlewares/check-if-target-is-subscriber.middleware';
import { CheckIfTargetIsTopicMiddleware } from './pub-sub/middlewares/check-if-target-is-topic.middleware';
import { CheckTopicValidityMiddleware } from '../src/pub-sub/middlewares/check-topic-validity.middleware';
import { ValidateSubscribeRequestDtoMiddleware } from '../src/pub-sub/middlewares/validate-subscribe-request-dto.middleware';
import { CreateSubscriberIfNotExistMiddleware } from '../src/pub-sub/middlewares/create-subscriber-if-not-exist.middleware';
import { CreateTopicIfNotExistMiddleware } from '../src/pub-sub/middlewares/create-topic-if-not-exist.middleware';
import { CreateSubscriptionIfNotExistMiddleware } from '../src/pub-sub/middlewares/create-subscription-if-not-exist.middleware';
import { LogEventMiddleware } from '../src/pub-sub/middlewares/log-event.middleware';
import { PubSubModule } from './pub-sub/pub-sub.module';
import { EventRepository } from '../src/repository/event.repository';
import { SubscriberRepository } from '../src/repository/subscriber.repository';
import { SubscriptionRepository } from '../src/repository/subscription.repository';
import { TopicRepository } from '../src/repository/topic.repository';


@Module({
  imports: [
    PubSubModule,
    TypeOrmModule.forFeature([EventRepository, SubscriptionRepository, SubscriberRepository, TopicRepository]),
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    PubSubModule
  ],
  controllers: [AppController],
  providers: [AppService, PubSubService],
  exports: [PubSubService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidateSubscribeRequestDtoMiddleware, CheckTopicValidityMiddleware, CreateSubscriberIfNotExistMiddleware, CreateTopicIfNotExistMiddleware, CreateSubscriptionIfNotExistMiddleware)
      .forRoutes({ path: 'subscribe/:topic', method: RequestMethod.POST });

    consumer
      .apply(ValidatePublishRequestDtoMiddleware, CheckIfTargetIsSubscriberMiddleware, CheckIfTargetIsTopicMiddleware, LogEventMiddleware)
      .forRoutes({ path: 'publish/:subscriberIdOrTopicName', method: RequestMethod.POST });
  }
}