import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Users, BarChart2, TrendingUp, Dices, ShieldCheck } from 'lucide-react'

export default function AdminPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])
  const [tab, setTab] = useState<'metrics' | 'users' | 'bets'>('metrics')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/metrics'),
      api.get('/admin/users'),
      api.get('/admin/bets'),
    ]).then(([m, u, b]) => {
      setMetrics(m.data)
      setUsers(u.data)
      setBets(b.data)
    }).catch(() => toast.error('Erro ao carregar dados')).finally(() => setLoading(false))
  }, [])

  const toggleUser = async (id: string) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle`)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: data.isActive } : u))
      toast.success(`Usuário ${data.isActive ? 'ativado' : 'desativado'}`)
    } catch { toast.error('Erro ao alterar status') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-casino-gold/30 border-t-casino-gold rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-purple-400" />
        </div>
        <h1 className="font-display text-2xl font-bold">Painel Admin</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-casino-border pb-4">
        {[
          { key: 'metrics', label: 'Métricas', icon: BarChart2 },
          { key: 'users', label: 'Usuários', icon: Users },
          { key: 'bets', label: 'Apostas', icon: Dices },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === key ? 'bg-casino-card text-casino-gold border border-casino-gold/20' : 'text-casino-muted hover:text-casino-text'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total de Apostas', value: metrics.totalBets, icon: '🎲' },
              { label: 'Usuários', value: metrics.totalUsers, icon: '👥' },
            ].map(s => (
              <div key={s.label} className="card">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-casino-muted text-xs mt-2">{s.label}</p>
                <p className="font-mono font-bold text-2xl text-casino-gold">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-medium mb-4">Estatísticas por Jogo</h3>
            <div className="space-y-3">
              {metrics.gameStats?.map((g: any) => (
                <div key={g.game} className="bg-casino-surface rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{g.game}</span>
                    <span className="text-casino-muted text-sm">{g.count} apostas</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-casino-muted text-xs">Apostado</p><p className="text-casino-gold font-mono">R$ {parseFloat(g.totalWagered || 0).toFixed(2)}</p></div>
                    <div><p className="text-casino-muted text-xs">Pago</p><p className="text-casino-green font-mono">R$ {parseFloat(g.totalPaid || 0).toFixed(2)}</p></div>
                    <div><p className="text-casino-muted text-xs">Vitórias</p><p className="text-blue-400 font-mono">{g.wins}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-casino-muted border-b border-casino-border">
                <th className="pb-3 text-left">Usuário</th>
                <th className="pb-3 text-left">Email</th>
                <th className="pb-3 text-right">Saldo</th>
                <th className="pb-3 text-center">Função</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-casino-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-casino-surface/50">
                  <td className="py-3 font-medium">{u.username}</td>
                  <td className="py-3 text-casino-muted">{u.email}</td>
                  <td className="py-3 text-right font-mono text-casino-gold">R$ {parseFloat(u.balance).toFixed(2)}</td>
                  <td className="py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{u.role}</span></td>
                  <td className="py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? 'badge-win' : 'badge-loss'}`}>{u.isActive ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="py-3 text-center">
                    <button onClick={() => toggleUser(u.id)} className={`text-xs px-3 py-1 rounded-lg transition-all ${u.isActive ? 'text-casino-red hover:bg-casino-red/10' : 'text-casino-green hover:bg-casino-green/10'}`}>
                      {u.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bets' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-casino-muted border-b border-casino-border">
                <th className="pb-3 text-left">Data</th>
                <th className="pb-3 text-left">Jogo</th>
                <th className="pb-3 text-right">Aposta</th>
                <th className="pb-3 text-right">Pagamento</th>
                <th className="pb-3 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-casino-border">
              {bets.slice(0, 50).map(b => (
                <tr key={b.id} className="hover:bg-casino-surface/50">
                  <td className="py-3 text-casino-muted text-xs">{new Date(b.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="py-3 font-medium">{b.game}</td>
                  <td className="py-3 text-right font-mono">R$ {parseFloat(b.amount).toFixed(2)}</td>
                  <td className="py-3 text-right font-mono text-casino-gold">R$ {parseFloat(b.payout).toFixed(2)}</td>
                  <td className="py-3 text-center"><span className={b.status === 'WIN' ? 'badge-win' : 'badge-loss'}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
