import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RouletteService, RouletteBet } from './roulette.service';

interface RoundState {
  phase: 'betting' | 'spinning' | 'result';
  timeLeft: number;
  bets: Map<string, RouletteBet[]>;
  lastNumber?: number;
  lastColor?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'roulette',
})
export class RouletteGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private round: RoundState = {
    phase: 'betting',
    timeLeft: 20,
    bets: new Map(),
  };

  private timer: NodeJS.Timeout;
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private rouletteService: RouletteService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.startRoundLoop();
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const payload = this.jwtService.verify(token, { secret: this.config.get('JWT_SECRET') });
        this.connectedUsers.set(client.id, payload.sub);
      }
    } catch {}

    client.emit('round:state', {
      phase: this.round.phase,
      timeLeft: this.round.timeLeft,
      lastNumber: this.round.lastNumber,
      lastColor: this.round.lastColor,
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('bet:place')
  async handleBet(@ConnectedSocket() client: Socket, @MessageBody() data: { bets: RouletteBet[] }) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }
    if (this.round.phase !== 'betting') {
      client.emit('error', { message: 'Betting is closed' });
      return;
    }

    this.round.bets.set(userId, data.bets);
    client.emit('bet:confirmed', { bets: data.bets });
  }

  private startRoundLoop() {
    this.round = { phase: 'betting', timeLeft: 20, bets: new Map() };
    this.server?.emit('round:start', { timeLeft: 20 });

    this.timer = setInterval(async () => {
      this.round.timeLeft--;

      if (this.round.phase === 'betting') {
        this.server?.emit('round:timer', { timeLeft: this.round.timeLeft });

        if (this.round.timeLeft <= 0) {
          this.round.phase = 'spinning';
          this.server?.emit('round:spinning');

          // Process all bets
          setTimeout(async () => {
            const number = this.rouletteService.spin();
            const color = this.rouletteService.getColor(number);

            // Process each user's bets
            for (const [userId, bets] of this.round.bets.entries()) {
              try {
                const result = await this.rouletteService.placeBetsAndSpin(userId, bets);
                // Notify specific user
                for (const [socketId, uid] of this.connectedUsers.entries()) {
                  if (uid === userId) {
                    this.server?.to(socketId).emit('round:result:personal', result);
                  }
                }
              } catch (err) {
                console.error(`Error processing roulette bet for user ${userId}:`, err);
              }
            }

            this.round.lastNumber = number;
            this.round.lastColor = color;
            this.round.phase = 'result';

            this.server?.emit('round:result', { number, color });

            // Start next round after 5s
            clearInterval(this.timer);
            setTimeout(() => this.startRoundLoop(), 5000);
          }, 3000);
        }
      }
    }, 1000);
  }
}
