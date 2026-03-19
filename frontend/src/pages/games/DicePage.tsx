import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Dices, TrendingUp, TrendingDown } from 'lucide-react'

export default function DicePage() {
  const { user, updateBalance } = useAuthStore()
  const [bet, setBet] = useState(10)
  const [target, setTarget] = useState(50)
  const [isOver, setIsOver] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

  const winChance = isOver ? (99 - target) / 100 : (target - 1) / 100
  const multiplier = winChance > 0 ? ((1 / winChance) * 0.99).toFixed(4) : '0'
  const profit = (bet * parseFloat(multiplier) - bet).toFixed(2)

  const roll = async () => {
    if (rolling) return
    if ((user?.balance ?? 0) < bet) { toast.error('Saldo insuficiente!'); return }
    setRolling(true)
    setResult(null)

    try {
      const { data } = await api.post('/games/dice/roll', { betAmount: bet, target, isOver })
      setResult(data)
      updateBalance(data.balance)
      setHistory(prev => [data, ...prev.slice(0, 14)])

      if (data.isWin) {
        toast.success(`🎲 Ganhou! Resultado: ${data.roll} • +R$ ${data.payout.toFixed(2)}`, {
          duration: 3000,
          style: { background: '#0a2e0a', border: '1px solid #00c853', color: '#00c853' }
        })
      } else {
        toast(`🎲 Resultado: ${data.roll} — Não foi dessa vez`, { icon: '💔' })
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao rolar')
    } finally {
      setRolling(false)
    }
  }

  // Bar position for result indicator
  const resultPos = result ? (result.roll / 100) * 100 : null

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Dices className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Dice</h1>
          <p className="text-casino-muted text-sm">Escolha seu alvo e multiplique seu saldo</p>
        </div>
      </div>

      <div className="card space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Multiplicador', value: `${multiplier}x`, color: 'text-casino-gold' },
            { label: 'Chance de Ganhar', value: `${(winChance * 100).toFixed(2)}%`, color: 'text-blue-400' },
            { label: 'Lucro Potencial', value: `R$ ${profit}`, color: 'text-casino-green' },
          ].map(s => (
            <div key={s.label} className="bg-casino-surface rounded-xl p-4 text-center">
              <p className="text-casino-muted text-xs mb-1">{s.label}</p>
              <p className={`font-mono font-bold text-xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Dice bar */}
        <div className="relative">
          <div className="h-12 bg-casino-surface rounded-xl overflow-hidden relative">
            {/* Color zones */}
            {isOver ? (
              <>
                <div className="absolute inset-y-0 left-0 bg-casino-red/30" style={{ width: `${target}%` }} />
                <div className="absolute inset-y-0 bg-casino-green/30" style={{ left: `${target}%`, right: 0 }} />
              </>
            ) : (
              <>
                <div className="absolute inset-y-0 left-0 bg-casino-green/30" style={{ width: `${target}%` }} />
                <div className="absolute inset-y-0 bg-casino-red/30" style={{ left: `${target}%`, right: 0 }} />
              </>
            )}

            {/* Target line */}
            <div className="absolute inset-y-0 w-0.5 bg-casino-gold z-10" style={{ left: `${target}%` }} />

            {/* Result indicator */}
            <AnimatePresence>
              {resultPos !== null && (
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`absolute inset-y-0 flex items-center z-20`}
                  style={{ left: `${resultPos}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold font-mono
                    ${result?.isWin ? 'bg-casino-green border-casino-green text-white' : 'bg-casino-red border-casino-red text-white'}`}>
                    {result?.roll}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scale */}
          <div className="flex justify-between text-casino-muted text-xs mt-1 px-1">
            {[0, 25, 50, 75, 100].map(n => <span key={n}>{n}</span>)}
          </div>
        </div>

        {/* Target + Over/Under */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-casino-muted text-sm mb-2 block">Alvo: <span className="text-casino-gold font-mono">{target}</span></label>
            <input
              type="range" min={2} max={98} value={target}
              onChange={e => setTarget(Number(e.target.value))}
              className="w-full accent-casino-gold"
            />
          </div>
          <div>
            <label className="text-casino-muted text-sm mb-2 block">Direção</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOver(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-all
                  ${isOver ? 'bg-casino-green/20 border border-casino-green/50 text-casino-green' : 'bg-casino-surface text-casino-muted hover:text-casino-text border border-transparent'}`}
              >
                <TrendingUp className="w-4 h-4" /> Acima
              </button>
              <button
                onClick={() => setIsOver(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-all
                  ${!isOver ? 'bg-casino-red/20 border border-casino-red/50 text-casino-red' : 'bg-casino-surface text-casino-muted hover:text-casino-text border border-transparent'}`}
              >
                <TrendingDown className="w-4 h-4" /> Abaixo
              </button>
            </div>
          </div>
        </div>

        {/* Bet + Roll */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-casino-muted text-sm mb-2 block">Aposta (R$)</label>
            <input
              type="number" min={1} max={10000} value={bet}
              onChange={e => setBet(Math.min(10000, Math.max(1, Number(e.target.value))))}
              className="input-field font-mono"
            />
          </div>
          <div className="flex gap-2">
            {[0.5, 2].map(mult => (
              <button key={mult} onClick={() => setBet(b => Math.min(10000, Math.max(1, Math.round(b * mult))))}
                className="btn-secondary text-xs px-3 py-3">
                {mult === 0.5 ? '½x' : '2x'}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          onClick={roll} disabled={rolling}
          whileTap={{ scale: 0.97 }}
          className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {rolling
            ? <><div className="w-5 h-5 border-2 border-casino-bg/30 border-t-casino-bg rounded-full animate-spin" /> Rolando...</>
            : <><Dices className="w-5 h-5" /> Rolar Dados</>
          }
        </motion.button>

        {/* Last result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${result.isWin ? 'bg-casino-green/10 border-casino-green/30' : 'bg-casino-red/10 border-casino-red/30'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-casino-muted text-xs">Resultado</p>
                <p className={`font-mono font-bold text-3xl ${result.isWin ? 'text-casino-green' : 'text-casino-red'}`}>{result.roll}</p>
                <p className="text-casino-muted text-xs">{isOver ? `Precisava > ${target}` : `Precisava < ${target}`}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-xl ${result.isWin ? 'text-casino-green' : 'text-casino-red'}`}>
                  {result.isWin ? `+R$ ${result.payout.toFixed(2)}` : `-R$ ${result.betAmount.toFixed(2)}`}
                </p>
                {result.isWin && <p className="text-casino-muted text-xs">{result.multiplier}x multiplicador</p>}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-casino-muted mb-3">Histórico</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <div key={i} className={`rounded-lg px-3 py-1.5 text-xs font-mono font-bold
                ${h.isWin ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'}`}>
                {h.roll}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
