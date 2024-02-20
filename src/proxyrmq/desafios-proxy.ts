import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DesafiosProxyInstance {
  private static _instance: DesafiosProxyInstance;

  constructor() {}

  getDesafiosProxyInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_URL}`,
        ],
        queue: 'desafios',
      },
    });
  }

  static getInstance() {
    if (this._instance) {
      return this._instance.getDesafiosProxyInstance();
    }

    this._instance = new DesafiosProxyInstance();
    return this._instance.getDesafiosProxyInstance();
  }
}
