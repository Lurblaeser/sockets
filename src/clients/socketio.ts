import { BaseDriver } from './base';
import { DriverContract, Topic } from '../types';
import { io, Socket } from "socket.io-client";

export interface ServerToClientEvents {
  [key: string]: (d: string) => void;
}

export class SocketIODriver extends BaseDriver implements DriverContract {
  private socket: Socket<ServerToClientEvents> | null = null;

  public async connect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnecting = true;

    this.socket = io(this.config.endpoint);


    if (this.config.logger) {
      this.eventbus.dispatch<object>(this.eventbusEventName, {
        action: 'sending',
        message: `Connecting to: ${this.config.endpoint}`,
        date: new Date().toLocaleString("en-US")
      })
    }

    // client-side
    this.socket.on("connect", () => {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      this.isConnecting = false;
      this.isConnected = true;

      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `Connected to: ${this.config.endpoint}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    });

    this.socket.on("disconnect", (reason, description) => {
      this.isConnecting = false
      this.isConnected = false;

      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `Disconnected: ${reason}`,
          extra: description,
          date: new Date().toLocaleString("en-US")
        })
      }
    });

    this.socket.on('connect_error', (error: any) => {
      this.isConnecting = false;
      console.log(error)
      this.isConnected = !!this.socket?.active as boolean;
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `${error}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    })

    this.socket.connect()
  }

  public async disconnect(): Promise<void> {
    this.socket?.disconnect();
    this.isConnected = false;
  }

  public async subscribe(topic: string, callback: Function): Promise<any> {
    const subscribed = this.socket?.on(topic, (payload) => {
      if (callback) {
        callback({
          destination: topic,
          body: payload,
        })
      }
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'receiving',
          message: `Reciving data from ${topic}: ${JSON.stringify(payload)}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    })

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
        tempTopic.topic.off(tempTopic.topicName)
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
    this.socket?.emit(topic, data)
  }
}
