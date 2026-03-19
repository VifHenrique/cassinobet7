import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import { Grip, Dices, Circle, TrendingUp, TrendingDown, Clock, Trophy } from 'lucide-react'
import CountUp from 'react-countup'

const gameCards = [
  {
    to: '/games/slot', label: 'Slot Machine', icon: Grip,
    desc: 'Gire os rolos e ganhe até 100x!',
    color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30', glow: 'hover:shadow-yellow-500/20',
    badge: 'RTP 96%'
  },
  {
    to: '/games/dice', label: 'Dice', icon: Dices,
    desc: 'Escolha seu alvo e multiplique!',
    color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', glow: 'hover:shadow-blue-500/20',
    badge: 'Até 99x'
  },
  {
    to: '/games/roulette', label: 'Roleta Europeia', icon: Circle,
    desc: 'Número, cor ou dúzia – aposte!',
    color: 'from-red-500/20 to-pink-500/20', border: 'border-red-500/30', glow: 'hover:shadow-red-500/20',
    badge: 'Ao Vivo'
  },
]

interface Bet {
  id: string; game: string; amount: number; payout: number; status: string; createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/wallet/history?limit=10')
      .then(r => setBets([]))
      .catch(() => {})
      .finally(() => setLoading(false))
    // Fetch recent bets from wallet history
    api.get('/wallet/history?limit=20')
      .then(r => {
        // map transactions to display
      })
      .catch(() => {})
  }, [])

  const wins = bets.filter(b => b.status === 'WIN').length
  const losses = bets.filter(b => b.status === 'LOSS').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-casino-text">
          Bem-vindo, <span className="gold-text">{user?.username}</span> 👋
        </h1>
        <p className="text-casino-muted mt-1">Pronto para a sorte te favorecer hoje?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Saldo Atual', value: user?.balance ?? 0, prefix: 'R$ ', icon: '💰',
            color: 'text-casino-gold', isCurrency: true,
          },
          {
            label: 'Vitórias', value: wins, icon: '🏆',
            color: 'text-casino-green', isCurrency: false,
          },
          {
            label: 'Derrotas', value: losses, icon: '💔',
            color: 'text-casino-red', isCurrency: false,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-casino-muted text-sm">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`font-mono font-bold text-2xl ${stat.color}`}>
              {stat.prefix}
              <CountUp end={stat.value} decimals={stat.isCurrency ? 2 : 0} duration={1} separator="." decimal="," />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Games */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Escolha seu Jogo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameCards.map((game, i) => (
            <motion.div
              key={game.to}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 + 0.2 }}
            >
              <Link
                to={game.to}
                className={`block bg-gradient-to-br ${game.color} border ${game.border} rounded-2xl p-6 
                            hover:shadow-xl ${game.glow} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-casino-surface/50 flex items-center justify-center">
                    <game.icon className="w-6 h-6 text-casino-text" />
                  </div>
                  <span className="text-xs bg-casino-surface/60 text-casino-muted px-2 py-1 rounded-full">
                    {game.badge}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-casino-text mb-1">{game.label}</h3>
                <p className="text-casino-muted text-sm">{game.desc}</p>
                <div className="mt-4 text-casino-gold text-sm font-medium group-hover:translate-x-1 transition-transform">
                  Jogar agora →
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-casino-muted" />
          <h3 className="font-medium text-casino-text">Atividade Recente</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-casino-muted">
          <Trophy className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Jogue para ver seu histórico aqui</p>
        </div>
      </div>
    </div>
  )
}
