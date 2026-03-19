# 🎰 LuckVault Casino Platform

Plataforma de jogos estilo cassino com **Slot Machine**, **Roleta Europeia** e **Dice** — construída com NestJS, React, PostgreSQL, Redis e WebSockets.

---

## 🧱 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + Framer Motion |
| Backend | Node.js + NestJS (modular) |
| Banco de dados | PostgreSQL 15 |
| Cache / Rate Limit | Redis 7 |
| Tempo real | WebSocket via Socket.io |
| Auth | JWT + bcrypt |
| Infra | Docker + Docker Compose |

---

## 📁 Estrutura de Pastas

```
casino-platform/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/               # JWT auth, guards, strategies
│   │   ├── users/              # Entidade User, service, controller
│   │   ├── wallet/             # Saldo, transações, histórico
│   │   ├── games/
│   │   │   ├── slot/           # Slot machine (POST /games/slot/spin)
│   │   │   ├── dice/           # Dice game (POST /games/dice/roll)
│   │   │   └── roulette/       # Roleta WebSocket + Gateway
│   │   ├── admin/              # Painel administrativo
│   │   └── common/             # Guards, decorators, pipes
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── stores/authStore.ts  # Zustand global state
        ├── services/api.ts      # Axios instance
        ├── pages/
        │   ├── auth/           # Login, Register
        │   ├── DashboardPage
        │   ├── AdminPage
        │   └── games/          # Slot, Dice, Roulette
        └── components/layout/  # Sidebar + Layout
```

---

## 🚀 Rodando Localmente

### Pré-requisitos
- Docker + Docker Compose
- Node.js 20+ (para desenvolvimento sem Docker)

### Com Docker (recomendado)

```bash
# 1. Clone o repositório
git clone <repo-url>
cd casino-platform

# 2. Copie o .env (já configurado para desenvolvimento)
cp .env.example .env

# 3. Suba todos os serviços
docker-compose up --build

# Acesse:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Sem Docker (desenvolvimento)

```bash
# Terminal 1 — PostgreSQL e Redis via Docker
docker-compose up postgres redis

# Terminal 2 — Backend
cd backend
npm install
cp .env.example .env
npm run start:dev

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev
```

---

## 🔌 Endpoints da API

### Auth
```
POST /api/auth/register   → { email, username, password }
POST /api/auth/login      → { email, password }
```

### Wallet
```
GET  /api/wallet          → { balance }
GET  /api/wallet/history  → [Transaction]
```

### Jogos
```
POST /api/games/slot/spin  → { betAmount }
POST /api/games/dice/roll  → { betAmount, target, isOver }
GET  /api/games/slot/stats → paytable e RTP
```

### Roleta (WebSocket)
```
Namespace: /roulette
Auth: { token: "JWT" }

Client → Server:
  bet:place  → { bets: [{ type, value?, amount }] }

Server → Client:
  round:state   → fase atual
  round:start   → nova rodada (timeLeft: 20s)
  round:timer   → contagem regressiva
  round:spinning → apostas encerradas
  round:result  → { number, color }
  round:result:personal → { payout, isWin, balance }
```

### Admin (requer role=admin)
```
GET   /api/admin/metrics          → métricas gerais
GET   /api/admin/users            → lista de usuários
GET   /api/admin/bets             → histórico de apostas
PATCH /api/admin/users/:id/toggle → ativar/desativar usuário
```

---

## ⚙️ Variáveis de Ambiente

### Backend (.env)
```env
NODE_ENV=development
DATABASE_URL=postgresql://casino_user:casino_secret_2024@localhost:5432/casino_db
REDIS_URL=redis://:casino_redis_2024@localhost:6379
JWT_SECRET=troque_isso_em_producao_chave_muito_segura
JWT_EXPIRES_IN=7d
INITIAL_BALANCE=1000
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## 🔐 Segurança Implementada

- ✅ JWT com expiração configurável
- ✅ Senhas com bcrypt (salt rounds: 12)
- ✅ RNG criptograficamente seguro (`crypto.randomInt`)
- ✅ Validação de todos os inputs com class-validator
- ✅ Rate limiting (ThrottlerModule): 10 req/s, 50/10s, 200/min
- ✅ Transações PostgreSQL com `pessimistic_write lock` (evita race conditions no saldo)
- ✅ Helmet.js para headers de segurança
- ✅ CORS configurado
- ✅ Whitelist de DTOs (proíbe campos extras)
- ✅ Validação de saldo no backend (nunca confia no frontend)

---

## 💰 Lógica dos Jogos

### 🎰 Slot Machine
- 3 rolos com 8 símbolos: 🍒🍋🍊🍇⭐💎7️⃣🃏
- Símbolos raros têm menos peso (probabilidade balanceada)
- RTP configurado: 96%
- Multiplicadores: 1.5x até 100x
- Endpoint síncrono

### 🎲 Dice
- Rola 1–100 com `crypto.randomInt`
- Usuário escolhe alvo (2–98) e direção (acima/abaixo)
- Multiplicador = `(1 / winChance) * 0.99`
- House edge: 1%
- Exemplo: target=50, isOver=true → 49% de chance → ~2x

### 🎡 Roleta Europeia
- 0–36, roleta europeia (house edge ~2.7%)
- Apostas: número exato, cor, par/ímpar, alto/baixo, dúzias
- Sistema em tempo real com WebSocket
- Rodadas automáticas: 20s de apostas → spin → 5s resultado → nova rodada
- Broadcast para todos + resultado pessoal para cada jogador

---

## ☁️ Deploy em Produção (AWS)

### Opção 1 — EC2 + RDS + Redis Cloud

```bash
# 1. Lance uma instância EC2 (t3.medium ou maior)
# 2. Crie RDS PostgreSQL (db.t3.micro para começar)
# 3. Crie ElastiCache Redis ou use Redis Cloud

# No EC2:
sudo apt update && sudo apt install docker.io docker-compose -y

# Configure .env de produção:
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/casino_db
REDIS_URL=redis://:senha@redis-endpoint:6379
JWT_SECRET=gere_uma_chave_de_64_chars_random
INITIAL_BALANCE=1000

# Suba apenas backend + frontend (DB e Redis externos):
docker-compose up backend frontend --build -d
```

### Opção 2 — Tudo no Docker Compose (VPS)

```bash
# Em qualquer VPS com 2GB+ RAM:
docker-compose up --build -d

# Configure reverse proxy (Nginx/Caddy) na frente:
# Frontend → porta 3000 → dominio.com
# Backend  → porta 3001 → api.dominio.com

# SSL com Certbot:
certbot --nginx -d dominio.com -d api.dominio.com
```

### Checklist de Produção
- [ ] Trocar `JWT_SECRET` por chave aleatória de 64+ chars
- [ ] Trocar senhas de PostgreSQL e Redis
- [ ] Definir `FRONTEND_URL` corretamente no backend
- [ ] Configurar `synchronize: false` no TypeORM e usar migrations
- [ ] Configurar HTTPS (SSL)
- [ ] Configurar backups automáticos do PostgreSQL
- [ ] Monitorar com PM2 ou supervisor se não usar Docker
- [ ] Configurar logs centralizados (ex: CloudWatch, Datadog)

---

## 🧪 Testando a API (curl)

```bash
# Registrar
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","username":"jogador1","password":"senha1234"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"senha1234"}' | jq -r '.token')

# Ver saldo
curl http://localhost:3001/api/wallet \
  -H "Authorization: Bearer $TOKEN"

# Girar slot
curl -X POST http://localhost:3001/api/games/slot/spin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"betAmount":10}'

# Rolar dados
curl -X POST http://localhost:3001/api/games/dice/roll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"betAmount":10,"target":50,"isOver":true}'
```

---

## 🛣️ Roadmap Futuro

- [ ] Gateway de pagamento (Stripe, PIX via Mercado Pago)
- [ ] Blackjack e Baccarat
- [ ] Sistema de bônus e promoções
- [ ] Programa de fidelidade (pontos)
- [ ] 2FA (autenticação de dois fatores)
- [ ] Separação em microsserviços
- [ ] Kafka para eventos de apostas
- [ ] Dashboard de analytics em tempo real

---

## 📜 Licença

MIT — Use, modifique e distribua à vontade.
