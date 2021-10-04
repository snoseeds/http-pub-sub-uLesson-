import { EntityRepository, Repository } from 'typeorm';
import { Topic } from '../domain/model/topic.entity';

@EntityRepository(Topic)
export class TopicRepository extends Repository<Topic> {

  findByName(topicName: string) {
    return this.findOne({
      name: topicName
    });
  }

  async incrementPublishedEventsCount(topic: Topic) {
    const topicLiveRecord = await this.findOne({
      where: { id: topic.id }
    });
    
    return this.save({
      ...topicLiveRecord,
      publishedEventsCount: topicLiveRecord.publishedEventsCount + 1
    });
  }

  async createNewTopic(topicName: string) {
    const newTopic = new Topic();
    newTopic.name = topicName;
    return this.save(newTopic);
  }
}