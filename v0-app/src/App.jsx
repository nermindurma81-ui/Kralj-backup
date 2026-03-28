import React, { useState } from 'react'
import { Sparkles, Zap, Brain, Palette, Video, Image, Mic, Code, BarChart, Settings, Send, Lightbulb, TrendingUp, Users, Star, Flame, Copy, RefreshCw, ArrowRight, Plus, X, Check, MessageSquare, Cpu, Shield, Rocket, Layers, GitBranch, FileText, Calendar, Bell, Search, Menu } from 'lucide-react'

function App() {
  const [showChat, setShowChat] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const skills = [
    { name: 'v0-dev', category: 'Platform', icon: Code },
    { name: 'app-builder', category: 'Platform', icon: Layers },
    { name: 'agentic-coding', category: 'AI', icon: Brain },
    { name: 'cc-godmode', category: 'AI', icon: Cpu },
    { name: 'ui-ux-design', category: 'Design', icon: Palette },
    { name: 'tailwind-design', category: 'Design', icon: Palette },
    { name: 'youtube-automation', category: 'Automation', icon: Video },
    { name: 'social-media', category: 'Automation', icon: Bell },
    { name: 'security-audit', category: 'Security', icon: Shield },
    { name: 'web-browsing', category: 'DevOps', icon: Search },
  ]

  const stats = [
    { label: 'Total Skills', value: '45', trend: '+100%', icon: Layers, color: 'from-purple-500 to-pink-500' },
    { label: 'Projects', value: '2', trend: '+1', icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: 'Deployments', value: '3', trend: '+2', icon: Rocket, color: 'from-green-500 to-emerald-500' },
    { label: 'Uptime', value: '99.9%', trend: '+0.1%', icon: BarChart, color: 'from-orange-500 to-red-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">v0 App</h1>
                <p className="text-white/40 text-xs">Powered by 45 Skills</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              {['overview', 'skills', 'projects', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium transition-colors ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Bell className="w-5 h-5 text-white/60" />
              </button>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                Deploy
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to v0 App
          </h1>
          <p className="text-xl text-white/60 max-w-2xl">
            Built with all 45 skills — from v0-dev UI generation to multi-agent automation
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="group p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">{stat.trend}</span>
              </div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Skills Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Installed Skills</h2>
            <button className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {skills.map((skill, i) => (
              <div key={i} className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <skill.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/40 text-xs">{skill.category}</span>
                </div>
                <h3 className="text-white font-medium">{skill.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Plus, label: 'New Project', desc: 'Start from scratch' },
                  { icon: Code, label: 'Generate UI', desc: 'Use v0-dev' },
                  { icon: Video, label: 'Create Video', desc: 'AI-powered' },
                  { icon: BarChart, label: 'View Analytics', desc: 'Track performance' },
                ].map((action, i) => (
                  <button key={i} className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform">
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium">{action.label}</span>
                    </div>
                    <p className="text-white/40 text-sm">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 h-full">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-blue-400" />
                AI Assistant
              </h3>
              <p className="text-white/60 mb-6">
                Need help? Your AI assistant is ready to help with any task using all 45 skills.
              </p>
              <button 
                onClick={() => setShowChat(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Open Chat
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Modal */}
      {showChat && <ChatModal onClose={() => setShowChat(false)} />}
    </div>
  )
}

function ChatModal({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hey! I\'m your AI assistant powered by 45 skills. What can I help you build today? 🚀' }
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: 'user', content: input }])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I can help with that! Using my 45 skills including v0-dev, AI coding, design, and automation. What specifically would you like to create?' }])
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">AI Assistant</h3>
              <p className="text-white/40 text-xs">45 skills ready</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white/10 text-white/80'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button onClick={handleSend} className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
