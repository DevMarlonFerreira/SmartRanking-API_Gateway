import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JogadoresCategoriasProxyInstance {
  private static _instance: JogadoresCategoriasProxyInstance;

  constructor() {}

  getJogadoresCategoriasProxyInstance(): ClientProxy {
    console.log('1111111111111')
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqps://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_URL}`,
        ],
        queue: 'jogadores-categorias',
      },
    });
  }

  static getInstance() {
    if (this._instance) {
      return this._instance.getJogadoresCategoriasProxyInstance();
    }

    this._instance = new JogadoresCategoriasProxyInstance();
    return this._instance.getJogadoresCategoriasProxyInstance();
  }
}
