import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'IA News Scripts', icon: '⚡', desc: 'Módulo 1' },
  { to: '/lifestyle', label: 'Lifestyle Deep-Dive', icon: '📹', desc: 'Módulo 2' },
  { to: '/history', label: 'Historial', icon: '🕐', desc: 'Sesiones' },
]

export function Sidebar() {
  return (
    <aside className="w-52 flex-shrink-0 flex flex-col" style={{ background: 'hsl(240 5.9% 10%)', color: 'hsl(240 4.8% 95.9%)' }}>
      <div className="px-5 py-6 border-b" style={{ borderColor: 'hsl(240 3.7% 15.9%)' }}>
        <div className="text-sm font-bold text-white">Content Studio</div>
        <div className="text-xs mt-0.5" style={{ color: 'hsl(240 3.8% 46.1%)' }}>AI Script Generator</div>
      </div>

      <div className="mt-4 flex-1">
        <div className="px-5 py-2 text-xs uppercase tracking-widest" style={{ color: 'hsl(240 3.8% 35%)' }}>Módulos</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-5 py-2.5 text-xs border-l-2 transition-colors ${
                isActive
                  ? 'text-white border-white bg-white/5'
                  : 'border-transparent hover:bg-white/5'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? 'white' : 'hsl(240 3.8% 65%)' })}
          >
            <span>{item.icon}</span>
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs" style={{ color: 'hsl(240 3.8% 46%)' }}>{item.desc}</div>
            </div>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
