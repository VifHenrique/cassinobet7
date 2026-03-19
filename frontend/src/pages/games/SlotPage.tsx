import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Grip, Minus, Plus, RotateCcw } from 'lucide-react'

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣', '🃏']
const PAYTABLE = [
  { combo: '🃏🃏🃏', mult: '100x', color: 'text-casino-gold' },
  { combo: '7️⃣7️⃣7️⃣', mult: '50x', color: 'text-casino-gold' },
  { combo: '💎💎💎', mult: '25x', color: 'text-purple-400' },
  { combo: '⭐⭐⭐', mult: '15x', color: 'text-yellow-400' },
  { combo: '🍇🍇🍇', mult: '8x', color: 'text-purple-300' },
  { combo: '🍊🍊🍊', mult: '5x', color: 'text-orange-400' },
  { combo: '🍋🍋🍋', mult: '4x', color: 'text-yellow-300' },
  { combo: '🍒🍒🍒', mult: '3x', color: 'text-red-400' },
]

export default function SlotPage() {
  const { user, updateBalance } = useAuthStore()
  const [reels, setReels] = useState(['🎰', '🎰', '🎰'])
  const [spinning, setSpinning] = useState(false)
  const [bet, setBet] = useState(10)
  const [lastResult, setLastResult] = useState<any>(null)
  const [showWin, setShowWin] = useState(false)
  const [spinHistory, setSpinHistory] = useState<any[]>([])

  const adjustBet = (delta: number) => {
    setBet(prev => Math.min(10000, Math.max(1, prev + delta)))
  }

  const spin = async () => {
    if (spinning) return
    if ((user?.balance ?? 0) < bet) {
      toast.error('Saldo insuficiente!')
      return
    }
    setSpinning(true)
    setShowWin(false)
    setLastResult(null)

    // Animate reels
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ])
    }, 80)

    try {
      const { data } = await api.post('/games/slot/spin', { betAmount: bet })

      setTimeout(() => {
        clearInterval(interval)
        setReels(data.reels)
        setLastResult(data)
        updateBalance(data.balance)
        setSpinHistory(prev => [data, ...prev.slice(0, 9)])

        if (data.isWin) {
          setShowWin(true)
          toast.success(`🎉 Ganhou! +R$ ${data.payout.toFixed(2)} (${data.multiplier}x)`, {
            duration: 4000,
            style: { background: '#0a2e0a', border: '1px solid #00c853', color: '#00c853' }
          })
          setTimeout(() => setShowWin(false), 3000)
        } else {
          toast('😔 Tente novamente!', { icon: '🎰' })
        }
        setSpinning(false)
      }, 1500)
    } catch (err: any) {
      clearInterval(interval)
      setReels(['❌', '❌', '❌'])
      toast.error(err.response?.data?.message || 'Erro ao girar')
      setSpinning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
          <Grip className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-casino-text">Slot Machine</h1>
          <p className="text-casino-muted text-sm">RTP 96% • Até 100x de multiplicador</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main slot */}
        <div className="lg:col-span-2 space-y-4">
          {/* Machine */}
          <div className={`card relative overflow-hidden transition-all duration-300 ${showWin ? 'animate-win-flash glow-gold' : ''}`}>
            {/* Win overlay */}
            <AnimatePresence>
              {showWin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center z-10 bg-casino-bg/70 rounded-2xl"
                >
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎉</div>
                    <div className="font-display text-3xl font-bold text-casino-gold">
                      +R$ {lastResult?.payout?.toFixed(2)}
                    </div>
                    <div className="text-casino-muted mt-1">{lastResult?.multiplier}x multiplicador</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reels */}
            <div className="bg-casino-bg rounded-xl border border-casino-border p-6 mb-6">
              <div className="flex justify-center gap-4">
                {reels.map((symbol, i) => (
                  <motion.div
                    key={i}
                    className={`w-24 h-24 rounded-xl border-2 flex items-center justify-center text-5xl
                      ${spinning ? 'border-casino-gold/50 bg-casino-gold/5' : 
                        lastResult?.isWin ? 'border-casino-green/50 bg-casino-green/5' : 'border-casino-border bg-casino-surface'}
                      transition-all duration-300`}
                    animate={spinning ? { y: [0, -8, 8, -4, 4, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>

              {/* Payline */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-px flex-1 bg-casino-gold/30" />
                <span className="text-casino-gold text-xs font-mono">PAYLINE</span>
                <div className="h-px flex-1 bg-casino-gold/30" />
              </div>
            </div>

            {/* Bet control */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <p className="text-casino-muted text-xs mb-2">Aposta</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustBet(-10)} className="btn-secondary p-2">
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="font-mono font-bold text-xl text-casino-gold">R$ {bet.toFixed(2)}</span>
                  </div>
                  <button onClick={() => adjustBet(10)} className="btn-secondary p-2">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-casino-muted text-xs mb-1">Saldo</p>
                <p className="font-mono font-bold text-casino-gold">R$ {(user?.balance ?? 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Quick bets */}
            <div className="flex gap-2 mb-4">
              {[5, 10, 25, 50, 100].map(v => (
                <button key={v} onClick={() => setBet(v)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${bet === v ? 'bg-casino-gold text-casino-bg' : 'bg-casino-surface text-casino-muted hover:text-casino-text'}`}
                >R${v}</button>
              ))}
            </div>

            {/* Spin button */}
            <motion.button
              onClick={spin}
              disabled={spinning}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {spinning ? (
                <><div className="w-6 h-6 border-2 border-casino-bg/30 border-t-casino-bg rounded-full animate-spin" /> Girando...</>
              ) : (
                <><RotateCcw className="w-5 h-5" /> GIRAR</>
              )}
            </motion.button>
          </div>

          {/* Spin history */}
          {spinHistory.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-casino-muted mb-3">Últimas jogadas</h3>
              <div className="space-y-2">
                {spinHistory.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-lg">{s.reels?.join(' ')}</span>
                    <span className={s.isWin ? 'text-casino-green' : 'text-casino-red'}>
                      {s.isWin ? `+R$ ${s.payout?.toFixed(2)}` : `-R$ ${s.betAmount?.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Paytable */}
        <div className="card">
          <h3 className="font-display font-semibold text-casino-text mb-4">Tabela de Prêmios</h3>
          <div className="space-y-3">
            {PAYTABLE.map(({ combo, mult, color }) => (
              <div key={combo} className="flex items-center justify-between bg-casino-surface rounded-lg px-3 py-2">
                <span className="text-lg font-mono">{combo}</span>
                <span className={`font-bold text-sm font-mono ${color}`}>{mult}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-casino-border">
            <p className="text-casino-muted text-xs">🍒🍒 = 1.5x | 7️⃣7️⃣ = 5x | 💎💎 = 3x</p>
          </div>
        </div>
      </div>
    </div>
  )
}
