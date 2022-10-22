import { BaseDriver } from './base';
import { Client, FrameImpl } from '@stomp/stompjs';
import { DriverContract, SocketConfig, Topic } from '../types';

export class StompDriver extends BaseDriver implements DriverContract {
  private stompClient: any | Client = null;

  constructor(config: SocketConfig) {
    super(config);
  }

  public async connect(): Promise<void> {
    console.log('connect')
    if (this.stompClient) {
      this.stompClient.deactivate()
      this.stompClient = null
    }

    this.isConnecting = true;

    try {
      this.stompClient = new Client({
        brokerURL: this.config.endpoint,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })
    } catch (error) {
      console.log('error', error)
    }
    console.log('test stomp')
    if (this.config.logger) {
      this.eventbus.dispatch<object>(this.eventbusEventName, {
        action: 'sending',
        message: `Connecting to: ${this.config.endpoint}`,
        date: new Date().toLocaleString("en-US")
      })
    }

    this.stompClient.onStompError = (frame: FrameImpl) => {
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
    };
    this.stompClient.onConnect = (_frame: FrameImpl) => {
      this.isConnecting = false;
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `Connected to: ${this.config.endpoint}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    }
    this.stompClient.onUnhandledMessage = (frame: FrameImpl) => {
      console.log('onUnhandledMessage', frame)
    }
    this.stompClient.onUnhandledReceipt = (frame: FrameImpl) => {
      console.log('onUnhandledReceipt', frame)
    }
    this.stompClient.onUnhandledFrame = (frame: FrameImpl) => {
      console.log('onUnhandledFrame', frame)
    }
    this.stompClient.onWebSocketClose = (frame: FrameImpl) => {
      console.log('onWebSocketClose', frame)
    }
    this.stompClient.onWebSocketError = (frame: FrameImpl) => {
      console.log('onWebSocketError', frame)
    }
    this.stompClient.onDisconnect = (frame: FrameImpl) => {
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

    try {
      this.stompClient.activate()
    } catch (error) {
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `Connect error: ${JSON.stringify(error)}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    }
    this.isConnected = true;
  }

  public async disconnect(): Promise<void> {
    this.stompClient.deactivate();
    this.isConnected = false;
  }

  public async subscribe(topic: string, callback: Function): Promise<any> {
    const subscribed = this.stompClient.subscribe(topic, (payload: FrameImpl) => {
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
        console.log(tempTopic)
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
    if (this.config.logger) {
      this.eventbus.dispatch<object>(this.eventbusEventName, {
        action: 'sending',
        message: `Sending data to ${topic}: ${data}`,
        date: new Date().toLocaleString("en-US")
      })
    }
    this.stompClient.publish({
      destination: topic,
      body: data,
      skipContentLengthHeader: true,
    })
  }
}
