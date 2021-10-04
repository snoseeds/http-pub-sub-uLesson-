import { EntityRepository, Repository } from 'typeorm';
import { Subscriber } from '../domain/model/subscriber.entity';


@EntityRepository(Subscriber)
export class SubscriberRepository extends Repository<Subscriber> {

  findBySubscriberID(subscriberId: string) {
    return this.findOne({
      id: subscriberId
    });
  }

  async findByWebHook(webHookUrl: string) {
    return this.findOne({
      url: webHookUrl
    });
  }

  async incrementDirectlyPublishedEventsCount(subscriber: Subscriber) {
    const subscriberLiveRecord = await this.findOne({
      where: { id: subscriber.id }
    });
    
    return this.save({
      ...subscriberLiveRecord,
      directlyPublishedEventsCount: subscriberLiveRecord.directlyPublishedEventsCount + 1
    });
  }
  
  async createNewSubscriber(url: string) {
    const newSubscriber = new Subscriber();
    newSubscriber.url = url;
    return this.save(newSubscriber);
  }
}