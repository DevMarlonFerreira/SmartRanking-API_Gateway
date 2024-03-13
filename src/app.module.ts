import { Module } from '@nestjs/common';
import { CategoriasModule } from './categorias/categorias.module';
import { JogadoresModule } from './jogadores/jogadores.module';
import { ClientProxySmartRanking } from './proxyrmq/client-proxy';
import { ProxyRMQModule } from './proxyrmq/proxyrmq.module';
import { JogadoresController } from './jogadores/jogadores.controller';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from './aws/aws.module';
import { DesafiosModule } from './desafios/desafios.module';
import { RankingsModule } from './rankings/rankings.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ isGlobal: true }),
    ConfigModule.forRoot({ envFilePath: '.env' }),
    CategoriasModule,
    JogadoresModule,
    ProxyRMQModule,
    AwsModule,
    DesafiosModule,
    RankingsModule,
  ],
  controllers: [JogadoresController],
  providers: [ClientProxySmartRanking],
})
export class AppModule {}
