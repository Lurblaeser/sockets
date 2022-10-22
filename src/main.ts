// import { BaseDriver } from './clients/base';
import { DriverContract, DriversInterface, SocketConfig, Topic } from './types';

import { StompDriver } from './clients/stomp';
import { SockJsDriver } from './clients/sockjs';
import { StompSockJsDriver } from './clients/sockjs-stomp';
import { MQTTDriver } from './clients/mqtt';
import { SocketIODriver } from './clients/socketio';
export class Socket implements DriverContract {
  public isConnecting = false;
  public isConnected = false;

  public Drivers: DriversInterface = {
    'sockjs': SockJsDriver,
    'stomp': StompDriver,
    'stomp-sockjs': StompSockJsDriver,
    'mqtt': MQTTDriver,
    'socketio': SocketIODriver,
  }

  constructor(config: SocketConfig) {
    const method = config.method as string;

    const Driver = this.Drivers[method as keyof typeof this.Drivers]

    return new Driver(config)
  }
  public config: SocketConfig;
  public connect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public event(_topic: string, _data: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public subscribe(_topic: string, _callback: Function): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public unsubscribe(_topic: Topic): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public async switchEndpoint(_endpoint: string) {
    throw new Error('Method not implemented.');
  }
}