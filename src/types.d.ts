import { MQTTDriver } from "./clients/mqtt";
import { SocketIODriver } from "./clients/socketio";
import { SockJsDriver } from "./clients/sockjs";
import { StompSockJsDriver } from "./clients/sockjs-stomp";
import { StompDriver } from "./clients/stomp";

/**
 * Shape of the generic driver
 */
export interface Topic {
  topicName: string;
  topic?: any;
}

export interface DriverContract {
  public isConnecting: boolean;
  public isConnected: boolean;
  public config: SocketConfig;

  public async connect(): Promise<void>;
  public async disconnect(): Promise<void>;
  public async event(topic: string, data: string): Promise<void>;
  public async subscribe(topic: string, callback: Function): Promise<any>;
  public async unsubscribe(topic: Topic): Promise<void>;
}

export interface DriversInterface {
  'sockjs': typeof SockJsDriver;
  'stomp': typeof StompDriver;
  'stomp-sockjs': typeof StompSockJsDriver;
  'mqtt': typeof MQTTDriver;
  'socketio': typeof SocketIODriver;
}

export interface SocketConfig {
  method: keyof DriversInterface;
  endpoint: string;
  logger: Function
}

export interface Method {
  name: string;
  code: string;
  disabled?: boolean;
  options?: {
    disableEventTopic: boolean,
    disableSubscriptionTopics: boolean,
  }
}
