import { EventBus } from '../eventbus';
import { DriverContract, DriversInterface, SocketConfig, Topic } from '../types';

export class BaseDriver implements DriverContract {
  public isConnecting = false;
  public isConnected = false;
  public config;
  public topics: Topic[];
  public eventbus: EventBus;
  public eventbusEventName: string = 'socket-method-events';

  public Drivers: DriversInterface;

  constructor(config: SocketConfig) {
    this.config = config;

    this.topics = []
    this.eventbus = EventBus.newInstance()

    if (this.config.logger) {
      console.log('test 11')
      this.eventbus.register(this.eventbusEventName, this.config.logger);
    }
  }

  public async switchEndpoint(endpoint: string) {
    this.config.endpoint = endpoint
  }

  public async connect() {}
  public async disconnect() {}
  public async event(_topic: string, _data: string) {}
  public async subscribe(_topic: string, _callback: Function): Promise<any> {}
  public async unsubscribe(_topic: Topic): Promise<void> {}
}