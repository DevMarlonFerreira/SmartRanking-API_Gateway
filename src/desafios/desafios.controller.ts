import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Get,
  Query,
  Put,
  Param,
  Delete,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CriarDesafioDto } from './dtos/criar-desafio.dto';
import { DesafioStatusValidacaoPipe } from './pipes/desafio-status-validation.pipe';
import { AtribuirDesafioPartidaDto } from './dtos/atribuir-desafio-partida.dto';
import { AtualizarDesafioDto } from './dtos/atualizar-desafio.dto';
import { ClientProxySmartRanking } from '../proxyrmq/client-proxy';
import { Jogador } from '../jogadores/interfaces/jogador.interface';
import { Desafio } from '../desafios/interfaces/desafio.interface';
import { DesafioStatus } from './desafio-status.enum';
import { Partida } from './interfaces/partida.interface';
import { lastValueFrom } from 'rxjs';

@Controller('api/v1/desafios')
export class DesafiosController {
  constructor(private clientProxySmartRanking: ClientProxySmartRanking) {}

  private readonly logger = new Logger(DesafiosController.name);

  private clientDesafios =
    this.clientProxySmartRanking.getClientProxyDesafiosInstance();

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  @Post()
  @UsePipes(ValidationPipe)
  async criarDesafio(@Body() criarDesafioDto: CriarDesafioDto) {
    this.logger.log(`criarDesafioDto: ${JSON.stringify(criarDesafioDto)}`);

    const jogadores$ = await this.clientAdminBackend.send(
      'consultar-jogadores',
      '',
    );
    const jogadores: Jogador[] = await lastValueFrom(jogadores$);

    criarDesafioDto.jogadores.map((jogadorDto) => {
      const jogadorFilter: Jogador[] = jogadores.filter(
        (jogador) => jogador._id == jogadorDto._id,
      );

      this.logger.log(`jogadorFilter: ${JSON.stringify(jogadorFilter)}`);

      if (jogadorFilter.length == 0) {
        throw new BadRequestException(
          `O id ${jogadorDto._id} não é um jogador!`,
        );
      }

      if (jogadorFilter[0].categoria != criarDesafioDto.categoria) {
        throw new BadRequestException(
          `O jogador ${jogadorFilter[0]._id} não faz parte da categoria informada!`,
        );
      }
    });

    const solicitanteEhJogadorDaPartida: Jogador[] =
      criarDesafioDto.jogadores.filter(
        (jogador) => jogador._id == criarDesafioDto.solicitante,
      );

    this.logger.log(
      `solicitanteEhJogadorDaPartida: ${JSON.stringify(solicitanteEhJogadorDaPartida)}`,
    );

    if (solicitanteEhJogadorDaPartida.length == 0) {
      throw new BadRequestException(
        `O solicitante deve ser um jogador da partida!`,
      );
    }

    const categoria$ = this.clientAdminBackend.send(
      'consultar-categorias',
      criarDesafioDto.categoria,
    );
    const categoria = lastValueFrom(categoria$);

    this.logger.log(`categoria: ${JSON.stringify(categoria)}`);

    if (!categoria) {
      throw new BadRequestException(`Categoria informada não existe!`);
    }

    await this.clientDesafios.emit('criar-desafio', criarDesafioDto);
  }

  @Get()
  async consultarDesafios(@Query('idJogador') idJogador: string): Promise<any> {
    if (idJogador) {
      const jogador$ = await this.clientAdminBackend.send(
        'consultar-jogadores',
        idJogador,
      );
      const jogador: Jogador = await lastValueFrom(jogador$);

      this.logger.log(`jogador: ${JSON.stringify(jogador)}`);
      if (!jogador) {
        throw new BadRequestException(`Jogador não cadastrado!`);
      }
    }

    const clientDesafios$ = this.clientDesafios.send('consultar-desafios', {
      idJogador: idJogador,
      _id: '',
    });
    return await lastValueFrom(clientDesafios$);
  }

  @Put('/:desafio')
  async atualizarDesafio(
    @Body(DesafioStatusValidacaoPipe) atualizarDesafioDto: AtualizarDesafioDto,
    @Param('desafio') _id: string,
  ) {
    const desafio$ = this.clientDesafios.send('consultar-desafios', {
      idJogador: '',
      _id: _id,
    });
    const desafio: Desafio = await lastValueFrom(desafio$);

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    if (desafio.status != DesafioStatus.PENDENTE) {
      throw new BadRequestException(
        'Somente desafios com status PENDENTE podem ser atualizados!',
      );
    }

    await this.clientDesafios.emit('atualizar-desafio', {
      id: _id,
      desafio: atualizarDesafioDto,
    });
  }

  @Post('/:desafio/partida/')
  async atribuirDesafioPartida(
    @Body(ValidationPipe) atribuirDesafioPartidaDto: AtribuirDesafioPartidaDto,
    @Param('desafio') _id: string,
  ) {
    const desafio$ = this.clientDesafios.send('consultar-desafios', {
      idJogador: '',
      _id: _id,
    });
    const desafio: Desafio = await lastValueFrom(desafio$);

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    if (desafio.status == DesafioStatus.REALIZADO) {
      throw new BadRequestException(`Desafio já realizado!`);
    }

    if (desafio.status != DesafioStatus.ACEITO) {
      throw new BadRequestException(
        `Partidas somente podem ser lançadas em desafios aceitos pelos adversários!`,
      );
    }

    if (!desafio.jogadores.includes(atribuirDesafioPartidaDto.def)) {
      throw new BadRequestException(
        `O jogador vencedor da partida deve fazer parte do desafio!`,
      );
    }

    const partida: Partida = {};
    partida.categoria = desafio.categoria;
    partida.def = atribuirDesafioPartidaDto.def;
    partida.desafio = _id;
    partida.jogadores = desafio.jogadores;
    partida.resultado = atribuirDesafioPartidaDto.resultado;

    await this.clientDesafios.emit('criar-partida', partida);
  }

  @Delete('/:_id')
  async deletarDesafio(@Param('_id') _id: string) {
    const desafio$ = this.clientDesafios.send('consultar-desafios', {
      idJogador: '',
      _id: _id,
    });
    const desafio: Desafio = await lastValueFrom(desafio$);

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    await this.clientDesafios.emit('deletar-desafio', desafio);
  }
}
