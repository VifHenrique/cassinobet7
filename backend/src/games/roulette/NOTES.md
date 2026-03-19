// This file documents the roulette gateway's dependency injection.
// The RouletteGateway is provided inside GamesModule, which must import JwtModule.
// Add to games.module.ts imports:

// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';
//
// JwtModule.registerAsync({
//   imports: [ConfigModule],
//   useFactory: (config: ConfigService) => ({
//     secret: config.get('JWT_SECRET'),
//   }),
//   inject: [ConfigService],
// }),
//
// This allows RouletteGateway to inject JwtService for token verification.
