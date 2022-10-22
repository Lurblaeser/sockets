import { BaseDriver } from './base';
import {Client, Message, OnSubscribeSuccessCallback, SubscribeOptions} from 'paho-mqtt';
import { Topic, DriverContract } from '../types';

export class MQTTDriver extends BaseDriver implements DriverContract {
  private mqttClient: Client | null = null;

  public async connect(): Promise<void> {
    if (this.mqttClient) {
      this.mqttClient.disconnect()
      this.mqttClient = null
    }

    this.isConnecting = true

    const endpointURL = new URL(this.config.endpoint)
    // ws://test.mosquitto.org:8080
    // wss://test.mosquitto.org:8081
    this.mqttClient = new Client(
      endpointURL.href,
      "clientId"
    );

    if (this.config.logger) {
      console.log('test mqtt')
      this.eventbus.dispatch<object>(this.eventbusEventName, {
        action: 'sending',
        message: `Connecting to: ${this.config.endpoint}`,
        date: new Date().toLocaleString("en-US")
      })
    }

    this.mqttClient.connect({
      onSuccess: () => {
        this.isConnecting = false;
        this.isConnected = true;
        if (this.config.logger) {
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'sending',
            message: `Connected to: ${this.config.endpoint}`,
            date: new Date().toLocaleString("en-US")
          })
        }
      },
      onFailure: (error) => {
        if (this.config.logger) {
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'sending',
            status: 'error',
            message: `Error: ${JSON.stringify(error)}`,
            date: new Date().toLocaleString("en-US")
          })
        }

        // Can't connect to server
        if (error.errorCode === 7) {
          this.isConnecting = false;
          this.isConnected = false;
        }
      },
    });

    this.mqttClient.onConnectionLost = (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:"+responseObject.errorMessage);
        this.isConnecting = false;
        this.isConnected = false;

        if (this.config.logger) {
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'sending',
            status: 'error',
            message: `Disconnected from: ${this.config.endpoint}`,
            date: new Date().toLocaleString("en-US")
          })
        }
      } else {
        const endpointURL = new URL(this.config.endpoint)

        if (this.config.logger) {
          this.eventbus.dispatch<object>(this.eventbusEventName, {
            action: 'receiving',
            message: `Disconnected from ${endpointURL.protocol.replace(':', '')}: ${responseObject.errorMessage}`,
            date: new Date().toLocaleString("en-US")
          })
        }
      }
    }

    this.mqttClient.onMessageArrived = (message: Message) => {
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'receiving',
          message: `Reciving data from ${message.destinationName}: ${message.payloadString}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    }

    this.mqttClient.onMessageDelivered = (message: Message) => {
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `Message delivered to ${message.destinationName}: ${message.payloadString}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.mqttClient?.disconnect();
    this.isConnected = false;
    this.isConnecting = false;
  }

  public async subscribe(topic: string, callback: Function): Promise<any> {
    const options: SubscribeOptions = {}
    if (callback) {
      options['onSuccess'] = callback as OnSubscribeSuccessCallback
    }

    const subscribed = this.mqttClient?.subscribe(topic, options)

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
        this.mqttClient?.unsubscribe(tempTopic.topicName)

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
        message: `Sending message to ${topic}: ${data}`,
        date: new Date().toLocaleString("en-US")
      })
    }
    const message = new Message(data)
    message.destinationName = topic

    this.mqttClient?.send(message)
  }
}
