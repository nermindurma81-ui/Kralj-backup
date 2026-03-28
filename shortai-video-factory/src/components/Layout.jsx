import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Lightbulb, FileText, Sparkles, Film, Video, Mic,
  Subtitles, Image, TrendingUp, Compass, Calendar, Layers,
  Bot, Target, Search, Settings, ChevronLeft, ChevronRight, Menu, Clapperboard, Zap, Hash
} from 'lucide-react'
import ApiManager from './ApiManager'
import PlatformConnector from './PlatformConnector'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/idea-lab', icon: Lightbulb, label: 'Idea Lab' },
  { path: '/script-lab', icon: FileText, label: 'Script Lab' },
  { path: '/viral-hooks', icon: Sparkles, label: 'Viral Hooks' },
  { path: '/storyboard', icon: Film, label: 'Storyboard' },
  { path: '/video-generator', icon: Video, label: 'Video Generator' },
  { path: '/voice-generator', icon: Mic, label: 'Voice Generator' },
  { path: '/caption-lab', icon: Subtitles, label: 'Caption Lab' },
  { path: '/thumbnail-ai', icon: Image, label: 'Thumbnail AI' },
  { path: '/viral-score', icon: TrendingUp, label: 'Viral Score' },
  { path: '/trends', icon: Compass, label: 'Trend Discovery' },
  { path: '/calendar', icon: Calendar, label: 'Content Calendar' },
  { path: '/bulk-generator', icon: Layers, label: 'Bulk Generator' },
  { path: '/auto-factory', icon: Bot, label: 'Auto Factory' },
  { path: '/competitor-analyzer', icon: Target, label: 'Competitor Analyzer' },
  { path: '/niche-finder', icon: Search, label: 'Niche Finder' },
  { path: '/video-assembler', icon: Clapperboard, label: 'Video Assembler' },
  { path: '/pipeline', icon: Zap, label: 'Pipeline' },
  { path: '/hashtags', icon: Hash, label: 'Hashtags' }
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [showApiManager, setShowApiManager] = useState(false)
  const [showPlatformConnector, setShowPlatformConnector] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-gray-900 border-r border-gray-800
          flex flex-col transition-all duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">ShortAI</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors hidden lg:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hidden">
          <div className="space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
                }
                end={item.path === '/'}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-gray-800 p-3 space-y-2">
          <button
            onClick={() => { setShowApiManager(true); setMobileOpen(false) }}
            className={`sidebar-link w-full ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>API Management</span>}
          </button>
          <button
            onClick={() => { setShowPlatformConnector(true); setMobileOpen(false) }}
            className={`sidebar-link w-full ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <Target className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Platforms</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-gray-800">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold gradient-text">ShortAI Video Factory</span>
        </div>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Modals */}
      <ApiManager isOpen={showApiManager} onClose={() => setShowApiManager(false)} />
      <PlatformConnector isOpen={showPlatformConnector} onClose={() => setShowPlatformConnector(false)} />
    </div>
  )
}
