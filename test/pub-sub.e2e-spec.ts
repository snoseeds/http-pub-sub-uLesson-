import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, getConnection } from 'typeorm';
import { PubSubModule } from '../src/pub-sub/pub-sub.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { configService } from '../src/config/config.service';
import { PubSubService } from '../src/pub-sub/pub-sub.service';
import { EventRepository } from '../src/repository/event.repository';
import { SubscriberRepository } from '../src/repository/subscriber.repository';
import { SubscriptionRepository } from '../src/repository/subscription.repository';
import { TopicRepository } from '../src/repository/topic.repository';
import { Subscriber, Subscription } from 'rxjs';
import { join } from 'path';
const axios = require('axios');

describe('PubSubController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      // imports: [
      //   AppModule,
      //   TypeOrmModule.forFeature([EventRepository, SubscriptionRepository, SubscriberRepository, TopicRepository]),
      //   TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
      //   PubSubModule
      // ],
      // controllers: [AppController],
      // providers: [AppService, PubSubService],
      // exports: [PubSubService]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
    connection = getConnection();
  });

  afterEach(async () => {
    await connection.close();
    await app.close();
  });

  const topicForSuccessTest = 'capability';
  const successfulSubscription = {
    subscriptionDetails: null
  }
  describe('/subscribe/:topic (POST) (e2e)', () => {
    it('Failure: when topic is having a valid uuid format', async () => {
      const payload =  {
        url: "http://localhost:8000/chatroom"
      }
      // TO-DO use a uuid generator
      const uuid = '8aa9c057-15ed-456e-baa6-f91112f98fd1';
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${uuid}`)
        .send(payload)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "The topic to be subscribed to cannot have the format of a valid uuid",
          "data": null
        }
      ) 
    });

    it('Failure: when url payload is an invalid url', async () => {
      const payload =  {
        url: "playground"
      }
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/capability`)
        .send(payload)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "target": {
                      "url": "playground"
                  },
                  "value": "playground",
                  "property": "url",
                  "children": [],
                  "constraints": {
                      "isUrl": "url must be an URL address"
                  }
              }
          ]
        }
      ) 
    });

    it('Failure: request body is missing required field - url', async () => {
      const payload =  {};
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/capability`)
        .send(payload)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "target": {},
                  "property": "url",
                  "children": [],
                  "constraints": {
                      "isUrl": "url must be an URL address",
                      "isNotEmpty": "url should not be empty",
                      "isString": "url must be a string"
                  }
              }
          ]
        }
      ) 
    });

    const urlForSuccessTest = "http://localhost:8000/event";
    it(`Success: it should inform that it has created a new subscriber and a new topic
        for valid and new topic param and new url payload respectively,
        while creating a new subscription that pairs them together`, async () => {
      const topicName = topicForSuccessTest;
      const payload =  {
        url: urlForSuccessTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(payload)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Newly created subscriber");
      expect(body.data.topicStatus).toEqual("Newly created topic");
      expect(body.message).toEqual(`The subscriber with the url '${payload.url}' has been successfully subscribed to the topic with the name '${topicName}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;
      successfulSubscription.subscriptionDetails = subscriptionDetails
      const { subscriber, topic } = subscriptionDetails;

      const persistedSubscriber = await connection.getCustomRepository(SubscriberRepository).findByWebHook(payload.url);
      const persistedTopic = await connection.getCustomRepository(TopicRepository).findByName(topicName);
      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedSubscriber.id).toEqual(subscriber.id);
      expect(persistedTopic.id).toEqual(topic.id);
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
    });

    it('Failure: duplicate subscription by attempting to resubcribe a subscriber to a topic', async () => {
      // details of the successful subscription test just above will be used
      const topicName = topicForSuccessTest;
      const payload =  {
        url: urlForSuccessTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(payload)
        .expect(400)
      
      expect(body.message).toEqual("This subscriber has previously subscribed to this topic, please see subscription's details in data");
      expect(body.data.subscriptionDetails.id).toEqual(successfulSubscription.subscriptionDetails.id);

    });

    const urlToUsedForThisAndLastTest = 'http://localhost:8000/chatroom';
    const secondSuccessfulSubToUse = {
      subscriptionDetails: null
    }
    it(`Success: new subscriber, existing topic, new subscription`, async () => {
      // details of the successful subscription test's topic two steps will be used
      const topicName = topicForSuccessTest;
      const payload =  {
        url: urlToUsedForThisAndLastTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(payload)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Newly created subscriber");
      expect(body.data.topicStatus).toEqual("Existing topic");
      expect(body.message).toEqual(`The subscriber with the url '${payload.url}' has been successfully subscribed to the topic with the name '${topicName}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;
      secondSuccessfulSubToUse.subscriptionDetails = subscriptionDetails;
      const { subscriber } = subscriptionDetails;

      const persistedSubscriber = await connection.getCustomRepository(SubscriberRepository).findByWebHook(payload.url);
      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedSubscriber.id).toEqual(subscriber.id);
      // using the first successful subscription two tests above
      expect(body.data.subscriptionDetails.topic.id).toEqual(successfulSubscription.subscriptionDetails.topic.id);
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
    });

    const topicToUsedForTheNextTwoTests = 'software-development';
    const thirdSuccessfulSubToUse = {
      subscriptionDetails: null
    }
    it(`Success: existing subscriber, new topic, new subscription`, async () => {
      // details of the successful subscription test's url payload in three test above will be used
      const topicName = topicToUsedForTheNextTwoTests;
      const payload =  {
        url: urlForSuccessTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(payload)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Existing subscriber");
      expect(body.data.topicStatus).toEqual("Newly created topic");
      expect(body.message).toEqual(`The subscriber with the url '${payload.url}' has been successfully subscribed to the topic with the name '${topicName}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;
      thirdSuccessfulSubToUse.subscriptionDetails = subscriptionDetails;
      const { topic } = subscriptionDetails;

      const persistedTopic = await connection.getCustomRepository(TopicRepository).findByName(topicName);
      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedTopic.id).toEqual(topic.id);
      // using the first successful subscription three tests above
      expect(body.data.subscriptionDetails.subscriber.id).toEqual(successfulSubscription.subscriptionDetails.subscriber.id);
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
    });

    it(`Success: existing subscriber, existing topic, new subscription`, async () => {
      // We will use existing subsriber (url payload) created from the successful subscription tagged secondSuccessfulSubToUse
      // We will use existing topic created from the new subscription just above
      const topicName = topicToUsedForTheNextTwoTests;
      const payload =  {
        url: urlToUsedForThisAndLastTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(payload)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Existing subscriber");
      expect(body.data.topicStatus).toEqual("Existing topic");
      expect(body.message).toEqual(`The subscriber with the url '${payload.url}' has been successfully subscribed to the topic with the name '${topicName}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;

      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
      // using the first successful subscription and the successful subscription just above
      expect(body.data.subscriptionDetails.subscriber.id).toEqual(secondSuccessfulSubToUse.subscriptionDetails.subscriber.id);
      expect(body.data.subscriptionDetails.topic.id).toEqual(thirdSuccessfulSubToUse.subscriptionDetails.topic.id);
    });
  })

  describe('/publish/:subscriberIdOrTopicName (POST) (e2e)', () => {
    it('Failure: request body is empty', async () => {
      const payload =  {};
      const { body } = await request(app.getHttpServer())
        .post(`/publish/capability`)
        .send(payload)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Event's body cannot be empty",
          "data": null
        }
      ) 
    });

    it('failure: non existing event target', async () => {
      const payload =  {
        morale: "Be the hero you would wanna be"
      }
      const { body } = await request(app.getHttpServer())
        .post(`/publish/machines`)
        .send(payload)
        .expect(404)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 404,
          "message": "The event cannot be published to a non existent target as the route doesn't match any existing listener ID or topic name",
          "data": null
        }
      ) 
    });


    const subscriberDetailsForNextTwoCalls = {
      subscriptionDetails: []
    };
    it(`Success: publish to existing topic name and create a new event record
      - which is a record of a message being published to an event target`, async () => {
      const topicName = 'capacity';
      const message = {
        inspiration: "Audacity is a strength"
      };
      const subscribers = [
        "http://localhost:8000/eventy",
        "http://localhost:8000/chatroomy",
        "http://localhost:8000/workroomy",
        "http://localhost:8000/adventurey"
      ];

      
      // Spin up a server that has all the endpoints published to
      for (let subscriber of subscribers) {
        const { body }= await request(app.getHttpServer())
          .post(`/subscribe/${topicName}`)
          .send({
            url: subscriber
          })

          subscriberDetailsForNextTwoCalls.subscriptionDetails.push(body.data.subscriptionDetails);
      }


      const { body } = await request(app.getHttpServer())
        .post(`/publish/${topicName}`)
        .send(message)
        .expect(200)
      
      const { eventDetails, numOfRecipientsToBePublishedTo, topicDetails, subscriberDetails } = body.data
      const { id, eventTargetType, eventTargetTypeIdColVal, } = eventDetails;
      const topicPublishedTo = await connection.getCustomRepository(TopicRepository).findByName(topicName);
      const subscriptionsToTopic = await connection.getCustomRepository(SubscriptionRepository).findByTopicID(topicPublishedTo.id);
      const persistedEvent = await connection.getCustomRepository(EventRepository).findOne(id);
      
      expect(eventTargetType).toEqual("Topic");
      expect(topicDetails.id).toEqual(topicPublishedTo.id);
      expect(subscriberDetails).toEqual("Not Applicable");
      
      expect(body.message).toEqual("Publish request is successfully validated, logged and being processed, please note the eventId and details in data");

      expect(numOfRecipientsToBePublishedTo).toEqual(subscriptionsToTopic.length)
      expect(persistedEvent.id).toEqual(eventDetails.id);
      expect(eventTargetTypeIdColVal).toEqual(topicPublishedTo.id);
      expect(topicDetails.publishedEventsCount).toEqual(topicPublishedTo.publishedEventsCount);
      const recipientsUrls = subscriptionsToTopic.map(subscription => {
          return subscription.subscriber.url
      });

      // Spin up a server that has all the endpoints published to
      // Test to confirm that the subscribers actually got the published message
      const receiptsFromSendingSimilarPosts = [];
      for (let url of recipientsUrls) {
        try {
          const { data } = await axios.post(
            url,
            message
          );

          receiptsFromSendingSimilarPosts.push(data)
        } catch(error) {
          const { name, message } = error.toJSON();
          const err = `${name}: ${message}`;
          receiptsFromSendingSimilarPosts.push(err)
        };
      }

      const logpath = join(__dirname, '../src/pub-sub/published-events-status', `${eventDetails.id}.json`);
      const loggedEventObj = require(logpath);
      const { webhooksStatusesAndValues } = loggedEventObj;
      const loggedReceiptsAfterPublish = webhooksStatusesAndValues.map(result => {
        return result.value ? result.value.data : result.reason.error
      });
      expect(loggedReceiptsAfterPublish).toEqual(receiptsFromSendingSimilarPosts);
    
    });

    it(`Success: publish to existing subcriber using the subscriber id and create a new event record
      - which is a record of a message being published to an event target`, async () => {
      // We will use one of the newly created subscribers in the above test
      

      const subscriberId = subscriberDetailsForNextTwoCalls.subscriptionDetails[0].subscriber.id;
      const message = {
        inspiration: "Audacity is a strength"
      };

      const { body } = await request(app.getHttpServer())
        .post(`/publish/${subscriberId}`)
        .send(message)
        .expect(200)
      
      const { eventDetails, numOfRecipientsToBePublishedTo, topicDetails, subscriberDetails } = body.data
      const { id, eventTargetType, eventTargetTypeIdColVal, } = eventDetails;
      const subscriberPublishedTo = await connection.getCustomRepository(SubscriberRepository).findOne(subscriberId);
      const persistedEvent = await connection.getCustomRepository(EventRepository).findOne(id);
      
      expect(eventTargetType).toEqual("Subscriber");
      expect(subscriberDetails.id).toEqual(subscriberPublishedTo.id);
      expect(topicDetails).toEqual("Not Applicable");
      
      expect(body.message).toEqual("Publish request is successfully validated, logged and being processed, please note the eventId and details in data");

      expect(numOfRecipientsToBePublishedTo).toEqual(1)
      expect(persistedEvent.id).toEqual(eventDetails.id);
      expect(eventTargetTypeIdColVal).toEqual(subscriberPublishedTo.id);
      expect(subscriberDetails.directlyPublishedEventsCount).toEqual(subscriberPublishedTo.directlyPublishedEventsCount);
      const recipientsUrl = subscriberDetails.url;

      // Spin up a server that has all the endpoints published to
      // Test to confirm that the subscribers actually got the published message
      const receiptsFromSendingSimilarPosts = [];
        try {
          const { data } = await axios.post(
            recipientsUrl,
            message
          );

          receiptsFromSendingSimilarPosts.push(data)
        } catch(error) {
          const { name, message } = error.toJSON();
          const err = `${name}: ${message}`;
          receiptsFromSendingSimilarPosts.push(err)
        };

      const logpath = join(__dirname, '../src/pub-sub/published-events-status', `${eventDetails.id}.json`);
      const loggedEventObj = require(logpath);
      const { webhooksStatusesAndValues } = loggedEventObj;
      const loggedReceiptsAfterPublish = webhooksStatusesAndValues.map(result => {
        return result.value ? result.value.data : result.reason.error
      });
      expect(loggedReceiptsAfterPublish).toEqual(receiptsFromSendingSimilarPosts);
    
    });


  })  
});