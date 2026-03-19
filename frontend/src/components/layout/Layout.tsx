import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../stores/authStore'
import CountUp from 'react-countup'
import { LogOut, LayoutDashboard, Dices, Grip, Circle, ShieldCheck, Coins } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function Layout() {
  const { user, logout, refreshBalance } = useAuthStore()
  const navigate = useNavigate()
  const prevBalance = useRef(user?.balance ?? 0)

  useEffect(() => {
    const interval = setInterval(refreshBalance, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/games/slot', label: 'Slot Machine', icon: Grip },
    { to: '/games/dice', label: 'Dice', icon: Dices },
    { to: '/games/roulette', label: 'Roleta', icon: Circle },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ]

  return (
    <div className="min-h-screen bg-casino-gradient flex">
      {/* Sidebar */}
      <aside className="w-64 bg-casino-surface border-r border-casino-border flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-6 border-b border-casino-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center">
              <Coins className="w-5 h-5 text-casino-bg" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg gold-text">LuckVault</h1>
              <p className="text-casino-muted text-xs">Casino</p>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-casino-card border border-casino-border">
          <p className="text-casino-muted text-xs mb-1">Saldo</p>
          <div className="flex items-baseline gap-1">
            <span className="text-casino-muted text-sm">R$</span>
            <span className="font-mono font-bold text-xl text-casino-gold">
              <CountUp
                start={prevBalance.current}
                end={user?.balance ?? 0}
                decimals={2}
                duration={0.8}
                separator="."
                decimal=","
                onEnd={() => { prevBalance.current = user?.balance ?? 0 }}
              />
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 mt-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-casino-gold/10 text-casino-gold border border-casino-gold/20'
                    : 'text-casino-muted hover:text-casino-text hover:bg-casino-card'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-casino-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-casino-purple/30 border border-casino-purple/50 flex items-center justify-center text-casino-purple-light text-sm font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-casino-text truncate">{user?.username}</p>
              <p className="text-xs text-casino-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-casino-muted hover:text-casino-red hover:bg-casino-red/10 transition-all duration-200 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
