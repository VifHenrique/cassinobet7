import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import { Circle, Clock, Plus, Trash2 } from 'lucide-react'

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
const getColor = (n: number) => n === 0 ? 'green' : RED_NUMBERS.has(n) ? 'red' : 'black'

const BET_TYPES = [
  { label: '0', type: 'number', value: 0, odds: '35:1', color: 'bg-green-700' },
  { label: 'Vermelho', type: 'red', odds: '1:1', color: 'bg-red-700' },
  { label: 'Preto', type: 'black', odds: '1:1', color: 'bg-gray-800' },
  { label: 'Par', type: 'even', odds: '1:1', color: 'bg-blue-800' },
  { label: 'Ímpar', type: 'odd', odds: '1:1', color: 'bg-indigo-800' },
  { label: '1-18', type: 'low', odds: '1:1', color: 'bg-teal-800' },
  { label: '19-36', type: 'high', odds: '1:1', color: 'bg-cyan-800' },
  { label: '1ª Dúzia', type: 'dozen1', odds: '2:1', color: 'bg-purple-800' },
  { label: '2ª Dúzia', type: 'dozen2', odds: '2:1', color: 'bg-violet-800' },
  { label: '3ª Dúzia', type: 'dozen3', odds: '2:1', color: 'bg-fuchsia-800' },
]

interface PlacedBet { type: string; value?: number; amount: number; label: string }

export default function RoulettePage() {
  const { user, token, updateBalance } = useAuthStore()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [phase, setPhase] = useState<'betting' | 'spinning' | 'result'>('betting')
  const [timeLeft, setTimeLeft] = useState(20)
  const [lastNumber, setLastNumber] = useState<number | null>(null)
  const [lastColor, setLastColor] = useState<string>('')
  const [placedBets, setPlacedBets] = useState<PlacedBet[]>([])
  const [betAmount, setBetAmount] = useState(10)
  const [history, setHistory] = useState<{ number: number; color: string }[]>([])
  const [personalResult, setPersonalResult] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || ''
    const s = io(`${wsUrl}/roulette`, {
      auth: { token },
      transports: ['websocket'],
    })

    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    s.on('round:state', (data) => {
      setPhase(data.phase)
      setTimeLeft(data.timeLeft)
      if (data.lastNumber !== undefined) setLastNumber(data.lastNumber)
      if (data.lastColor) setLastColor(data.lastColor)
    })

    s.on('round:start', (data) => {
      setPhase('betting')
      setTimeLeft(data.timeLeft)
      setPlacedBets([])
      setPersonalResult(null)
    })

    s.on('round:timer', (data) => setTimeLeft(data.timeLeft))

    s.on('round:spinning', () => {
      setPhase('spinning')
      toast('🎡 Rodando...', { icon: '⏳' })
    })

    s.on('round:result', (data) => {
      setPhase('result')
      setLastNumber(data.number)
      setLastColor(data.color)
      setHistory(prev => [{ number: data.number, color: data.color }, ...prev.slice(0, 19)])
    })

    s.on('round:result:personal', (data) => {
      setPersonalResult(data)
      updateBalance(data.balance)
      if (data.isWin) {
        toast.success(`🎉 Ganhou! +R$ ${data.payout.toFixed(2)}`, {
          duration: 5000,
          style: { background: '#0a2e0a', border: '1px solid #00c853', color: '#00c853' }
        })
      } else if (data.totalBet > 0) {
        toast(`Não foi dessa vez. -R$ ${data.totalBet.toFixed(2)}`, { icon: '😔' })
      }
    })

    s.on('error', (err) => toast.error(err.message))

    setSocket(s)
    return () => { s.disconnect() }
  }, [token])

  const addBet = (type: string, label: string, value?: number) => {
    if (phase !== 'betting') { toast.error('Apostas encerradas!'); return }
    setPlacedBets(prev => {
      const existing = prev.findIndex(b => b.type === type && b.value === value)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing].amount += betAmount
        return updated
      }
      return [...prev, { type, label, amount: betAmount, value }]
    })
  }

  const removeBet = (i: number) => setPlacedBets(prev => prev.filter((_, idx) => idx !== i))

  const sendBets = () => {
    if (!socket || placedBets.length === 0) { toast.error('Adicione apostas primeiro!'); return }
    const totalBet = placedBets.reduce((s, b) => s + b.amount, 0)
    if ((user?.balance ?? 0) < totalBet) { toast.error('Saldo insuficiente!'); return }
    socket.emit('bet:place', { bets: placedBets.map(b => ({ type: b.type, value: b.value, amount: b.amount })) })
    toast.success('Apostas confirmadas! 🎲')
  }

  const totalBet = placedBets.reduce((s, b) => s + b.amount, 0)

  // Number grid (1-36 + 0)
  const numberGrid = Array.from({ length: 36 }, (_, i) => i + 1)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <Circle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Roleta Europeia</h1>
            <p className="text-casino-muted text-sm">0 a 36 · Ao vivo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-casino-green animate-pulse' : 'bg-casino-red'}`} />
          <span className="text-xs text-casino-muted">{connected ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Phase indicator */}
          <div className={`card flex items-center justify-between ${phase === 'spinning' ? 'border-casino-gold/50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                phase === 'betting' ? 'bg-casino-green animate-pulse' :
                phase === 'spinning' ? 'bg-casino-gold animate-spin' : 'bg-casino-blue'
              }`} />
              <span className="font-medium">
                {phase === 'betting' ? '🟢 Apostas abertas' :
                 phase === 'spinning' ? '🎡 Girando...' : '✅ Resultado'}
              </span>
            </div>
            {phase === 'betting' && (
              <div className="flex items-center gap-2 text-casino-gold">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold text-xl">{timeLeft}s</span>
              </div>
            )}
            {lastNumber !== null && (
              <div className="flex items-center gap-2">
                <span className="text-casino-muted text-sm">Último:</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${lastColor === 'red' ? 'bg-red-600' : lastColor === 'black' ? 'bg-gray-800' : 'bg-green-700'}`}>
                  {lastNumber}
                </div>
              </div>
            )}
          </div>

          {/* Number grid */}
          <div className="card">
            <div className="grid grid-cols-9 gap-1 mb-2">
              {numberGrid.map(n => {
                const color = getColor(n)
                return (
                  <button
                    key={n}
                    onClick={() => addBet('number', `Nº ${n}`, n)}
                    disabled={phase !== 'betting'}
                    className={`aspect-square rounded-lg text-white text-xs font-bold transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                      ${color === 'red' ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    {n}
                  </button>
                )
              })}
              <button
                onClick={() => addBet('number', 'Nº 0', 0)}
                disabled={phase !== 'betting'}
                className="aspect-square rounded-lg text-white text-xs font-bold bg-green-700 hover:bg-green-600 transition-all hover:scale-105 disabled:opacity-50"
              >
                0
              </button>
            </div>
          </div>

          {/* Bet type buttons */}
          <div className="grid grid-cols-5 gap-2">
            {BET_TYPES.slice(1).map(bt => (
              <button
                key={bt.type}
                onClick={() => addBet(bt.type, bt.label, bt.value)}
                disabled={phase !== 'betting'}
                className={`${bt.color} rounded-xl p-2 text-white text-xs font-medium text-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div>{bt.label}</div>
                <div className="text-white/60 text-xs">{bt.odds}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bet panel */}
        <div className="space-y-4">
          {/* Bet amount */}
          <div className="card">
            <label className="text-casino-muted text-sm mb-2 block">Valor da aposta</label>
            <input type="number" min={1} value={betAmount} onChange={e => setBetAmount(Number(e.target.value))} className="input-field font-mono mb-2" />
            <div className="grid grid-cols-4 gap-1">
              {[5, 10, 25, 50].map(v => (
                <button key={v} onClick={() => setBetAmount(v)} className={`py-1 rounded-lg text-xs font-medium ${betAmount === v ? 'bg-casino-gold text-casino-bg' : 'bg-casino-surface text-casino-muted hover:text-casino-text'}`}>
                  R${v}
                </button>
              ))}
            </div>
          </div>

          {/* Placed bets */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Minhas Apostas</h3>
              {placedBets.length > 0 && (
                <button onClick={() => setPlacedBets([])} className="text-casino-red text-xs hover:underline">Limpar</button>
              )}
            </div>
            {placedBets.length === 0 ? (
              <p className="text-casino-muted text-xs text-center py-4">Clique nos números/opções para apostar</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {placedBets.map((b, i) => (
                  <div key={i} className="flex items-center justify-between bg-casino-surface rounded-lg px-3 py-2">
                    <span className="text-sm">{b.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-casino-gold font-mono text-sm">R$ {b.amount}</span>
                      <button onClick={() => removeBet(i)} className="text-casino-muted hover:text-casino-red">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalBet > 0 && (
              <div className="mt-3 pt-3 border-t border-casino-border flex justify-between text-sm">
                <span className="text-casino-muted">Total:</span>
                <span className="text-casino-gold font-mono font-bold">R$ {totalBet.toFixed(2)}</span>
              </div>
            )}
          </div>

          <motion.button
            onClick={sendBets}
            disabled={phase !== 'betting' || placedBets.length === 0}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar Apostas
          </motion.button>

          {/* History */}
          {history.length > 0 && (
            <div className="card">
              <h3 className="text-xs text-casino-muted mb-2">Histórico de números</h3>
              <div className="flex flex-wrap gap-1">
                {history.map((h, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${h.color === 'red' ? 'bg-red-700' : h.color === 'black' ? 'bg-gray-800' : 'bg-green-700'}`}>
                    {h.number}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal result */}
          {personalResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`card border ${personalResult.isWin ? 'border-casino-green/50 bg-casino-green/5' : 'border-casino-red/20'}`}
            >
              <p className="text-casino-muted text-xs mb-1">Seu resultado</p>
              <p className={`font-bold text-xl font-mono ${personalResult.isWin ? 'text-casino-green' : 'text-casino-red'}`}>
                {personalResult.isWin ? `+R$ ${personalResult.payout?.toFixed(2)}` : `-R$ ${personalResult.totalBet?.toFixed(2)}`}
              </p>
              <p className="text-casino-muted text-xs">Saldo: R$ {personalResult.balance?.toFixed(2)}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
