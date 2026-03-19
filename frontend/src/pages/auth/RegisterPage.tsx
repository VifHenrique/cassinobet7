import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import { Eye, EyeOff, Coins, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres')
      return
    }
    try {
      await register(form.email, form.username, form.password)
      toast.success('Conta criada! Bônus de R$ 1.000 creditado! 🎉')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erro ao criar conta')
    }
  }

  return (
    <div className="min-h-screen bg-casino-gradient flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-casino-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-casino-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mx-auto mb-4 glow-gold">
            <Coins className="w-8 h-8 text-casino-bg" />
          </div>
          <h1 className="font-display text-3xl font-bold gold-text">LuckVault</h1>
          <p className="text-casino-muted mt-1">Crie sua conta e ganhe bônus</p>
        </div>

        <div className="card">
          <div className="bg-casino-green/10 border border-casino-green/30 rounded-xl p-3 mb-5 flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <p className="text-casino-green text-sm font-medium">Bônus de boas-vindas: R$ 1.000,00</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-casino-muted mb-2">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-casino-muted mb-2">Nome de usuário</label>
              <input type="text" className="input-field" placeholder="jogador123" value={form.username} onChange={set('username')} required minLength={3} maxLength={20} />
            </div>
            <div>
              <label className="block text-sm font-medium text-casino-muted mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-casino-muted hover:text-casino-text">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading
                ? <div className="w-5 h-5 border-2 border-casino-bg/30 border-t-casino-bg rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" />Criar Conta</>
              }
            </button>
          </form>

          <p className="text-center mt-5 text-casino-muted text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-casino-gold hover:underline font-medium">Entrar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
