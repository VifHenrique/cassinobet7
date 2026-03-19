/**
 * seed.ts — Cria usuário admin e dados de teste
 * Execute: npx ts-node seed.ts
 * (dentro do container backend ou localmente com DB rodando)
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://casino_user:casino_secret_2024@localhost:5432/casino_db',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  ssl: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Conectado ao banco de dados');

  const userRepo = AppDataSource.getRepository('users');

  // Admin user
  const adminExists = await userRepo.findOne({ where: { email: 'admin@luckvault.com' } });
  if (!adminExists) {
    const hash = await bcrypt.hash('admin1234', 12);
    await userRepo.save({
      email: 'admin@luckvault.com',
      username: 'admin',
      password: hash,
      balance: 999999,
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Admin criado: admin@luckvault.com / admin1234');
  } else {
    console.log('ℹ️  Admin já existe');
  }

  // Test player
  const playerExists = await userRepo.findOne({ where: { email: 'jogador@luckvault.com' } });
  if (!playerExists) {
    const hash = await bcrypt.hash('jogador1234', 12);
    await userRepo.save({
      email: 'jogador@luckvault.com',
      username: 'jogador_teste',
      password: hash,
      balance: 5000,
      role: 'player',
      isActive: true,
    });
    console.log('✅ Jogador teste criado: jogador@luckvault.com / jogador1234');
  }

  await AppDataSource.destroy();
  console.log('🎰 Seed concluído!');
}

seed().catch(console.error);
