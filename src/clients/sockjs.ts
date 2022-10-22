import { BaseDriver } from './base';
import SockJS from 'sockjs-client/dist/sockjs';
import { DriverContract } from '../types';

export class SockJsDriver extends BaseDriver implements DriverContract {
  private sockjs: typeof SockJS | null = null;

  public async connect(): Promise<void> {
    if (this.sockjs) {
      this.sockjs.close()
      this.sockjs = null
    }

    this.isConnecting = true;
    this.sockjs = new SockJS(this.config.endpoint)
    if (this.config.logger) {
      console.log('test sockjs')
      this.eventbus.dispatch<object>(this.eventbusEventName, {
        action: 'sending',
        message: `Connecting to: ${this.config.endpoint}`,
        date: new Date().toLocaleString("en-US")
      })
    }
    this.sockjs.onopen = () => {
      this.isConnecting = false;
      this.isConnected = true;
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `Connected to: ${this.config.endpoint}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    };
    this.sockjs.onmessage = (message: any) => {
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'receiving',
          message: `Reciving data: ${message.data}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    };
    this.sockjs.onclose = (message: any) => {
      this.isConnecting = false;
      this.isConnected = false;
      if (this.config.logger) {
        this.eventbus.dispatch<object>(this.eventbusEventName, {
          action: 'sending',
          message: `Disconnected: ${message.reason}`,
          date: new Date().toLocaleString("en-US")
        })
      }
    };
  }

  public async disconnect(): Promise<void> {
    this.sockjs.close()
    this.isConnected = false;
  }

  public async subscribe(): Promise<void> {
    throw new Error('Subscribe is not implemented')
  }

  public async unsubscribe(): Promise<void> {
    throw new Error('Unsubscribe is not implemented')
  }

  public async event(_topic: string, data: string): Promise<void> {
    if (this.config.logger) {
      this.eventbus.dispatch<object>(this.eventbusEventName, {
        action: 'sending',
        message: `Sending data: ${data}`,
        date: new Date().toLocaleString("en-US")
      })
    }
    this.sockjs.send(data)
  }
}