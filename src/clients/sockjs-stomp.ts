import { BaseDriver } from './base';
import SockJS from 'sockjs-client/dist/sockjs';
import { CompatClient, FrameImpl, Stomp } from '@stomp/stompjs';
import { DriverContract, Topic } from '../types';

export class StompSockJsDriver extends BaseDriver implements DriverContract {
  private sockjs: typeof SockJS | null = null;
  private stompClient: any | CompatClient = null;

  public async connect(): Promise<void> {
    if (this.stompClient) {
      this.stompClient.disconnect()
      this.stompClient = null
    }

    this.isConnecting = true;

    this.sockjs = new SockJS(this.config.endpoint)
    this.sockjs.onclose = (code: any, reason: any) => {
      console.log(code, reason)
    }
    this.stompClient = Stomp.over(this.sockjs)

    this.stompClient.connect(
      {},
      (_frame: FrameImpl) => {
        this.isConnecting = false;
        this.isConnected = true;
        if (this.config.logger) {
          console.log('test sockjs stomp')
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'sending',
            message: `Connected to: ${this.config.endpoint}`,
            date: new Date().toLocaleString("en-US")
          })
        }
      },
      (frame: any) => {
        this.isConnecting = false;
        // Will be invoked in case of error encountered at Broker
        // Bad login/passcode typically will cause an error
        // Complaint brokers will set `message` header with a brief message. Body may contain details.
        // Compliant brokers will terminate the connection after any error
        if (this.config.logger) {
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'sending',
            status: 'error',
            message: `Error:\n${frame.headers['message']}\n${JSON.stringify(frame.body)}`,
            date: new Date().toLocaleString("en-US")
          })
        }
        this.isConnected = false;
      },
      (frame: FrameImpl) => {
        this.isConnecting = false;
        this.stompClient.deactivate();
        this.isConnected = false;
        if (this.config.logger) {
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'sending',
            message: `Disconnected: ${frame.body}`,
            date: new Date().toLocaleString("en-US")
          })
        }
      }
    );
  }

  public async disconnect(): Promise<void> {
    this.stompClient.deactivate();
    this.isConnected = false;
  }

  public async subscribe(topic: string, callback: Function): Promise<any> {
    const subscribed = this.stompClient.subscribe(topic, (payload: any) => {
      if (callback) {
        callback({
          destination: payload.headers.destination,
          body: payload.body,
        })
      }

      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'receiving',
          message: `Reciving data from ${payload.headers.destination}: ${payload.body}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    });
    

    const topicData = {
      topicName: topic,
      topic: subscribed
    }

    this.topics.push(topicData)

    return topicData;
  }

  public async unsubscribe(topic: Topic): Promise<void> {
    for (const tempTopic of this.topics) {
      if (tempTopic.topicName === topic.topicName) {
        tempTopic.topic.unsubscribe()
        if (this.config.logger) {
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'sending',
            message: `Unsubscribed from topic: ${tempTopic.topicName}`,
            date: new Date().toLocaleString("en-US")
          })
        }
        this.topics = this.topics.filter((item: Topic) => tempTopic.topicName !== item.topicName)
      }
    }
  }

  public async event(topic: string, data: string): Promise<void> {
    if (typeof data !== 'string') {
      data = JSON.stringify(data)
    }

    if (this.config.logger) {
      this.eventbus.dispatch<object>(this.eventbusEventName, {
        action: 'sending',
        message: `Sending data to ${topic}: ${data}`,
        date: new Date().toLocaleString("en-US")
      })
    }
    this.stompClient.send(topic, {}, data)
  }
}
