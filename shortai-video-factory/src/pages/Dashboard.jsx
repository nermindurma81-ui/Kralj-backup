import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Video, FileText, Sparkles, Calendar,
  ArrowUpRight, Clock, Loader2
} from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { getProjects } from '../lib/api'

export default function Dashboard() {
  const { projects, setProjects, loading, setLoading } = useProjectStore()
  const [stats, setStats] = useState({
    totalProjects: 0,
    videosGenerated: 0,
    scriptsCreated: 0,
    scheduledPosts: 0
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const data = await getProjects()
      setProjects(data)
      setStats({
        totalProjects: data.length,
        videosGenerated: data.filter(p => p.type === 'video').length,
        scriptsCreated: data.filter(p => p.type === 'script').length,
        scheduledPosts: data.filter(p => p.status === 'scheduled').length
      })
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const recentProjects = projects.slice(0, 5)

  const quickActions = [
    { label: 'New Idea', path: '/idea-lab', icon: Sparkles, color: 'from-yellow-500 to-orange-500' },
    { label: 'Write Script', path: '/script-lab', icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: 'Generate Video', path: '/video-generator', icon: Video, color: 'from-purple-500 to-pink-500' },
    { label: 'Schedule Post', path: '/calendar', icon: Calendar, color: 'from-green-500 to-emerald-500' }
  ]

  const statCards = [
    { label: 'Total Projects', value: stats.totalProjects, icon: FileText, change: '+12%' },
    { label: 'Videos Generated', value: stats.videosGenerated, icon: Video, change: '+8%' },
    { label: 'Scripts Created', value: stats.scriptsCreated, icon: FileText, change: '+23%' },
    { label: 'Scheduled Posts', value: stats.scheduledPosts, icon: Calendar, change: '+5%' }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your content factory overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <stat.icon className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {stat.change}
              </span>
            </div>
            <span className="stat-value">{loading ? <Loader2 className="w-7 h-7 animate-spin" /> : stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="card group hover:border-gray-600 transition-all hover:scale-[1.02]"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{action.label}</span>
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No projects yet. Start creating content!</p>
            <Link to="/idea-lab" className="btn-primary mt-4 inline-flex">Get Started</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div key={project.id} className="card flex items-center justify-between hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    project.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                    project.type === 'script' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {project.type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="font-medium">{project.title}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-700">{project.status}</span>
                    </div>
                  </div>
                </div>
                <Link to={`/${project.type === 'video' ? 'video-generator' : 'script-lab'}`} className="text-primary-400 text-sm hover:underline">
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
