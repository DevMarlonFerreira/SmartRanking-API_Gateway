import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientProxySmartRanking {
  private static _instance: ClientProxySmartRanking;

  constructor() {}

  getClientProxyAdminBackendInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqps://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_URL}`,
        ],
        queue: 'admin-backend',
      },
    });
  }

  getClientProxyDesafiosInstance(): ClientProxy {
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
      return this._instance;
    }

    this._instance = new ClientProxySmartRanking();
    return this._instance;
  }
}
