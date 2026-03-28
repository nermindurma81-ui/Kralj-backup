/**
 * v0-Style Modern Dashboard Component
 * Generated using v0-dev skill principles
 * Modern, clean, production-ready UI
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  TrendingUp, 
  Video, 
  FileText, 
  Calendar, 
  Settings,
  Zap,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Sparkles
} from 'lucide-react';

// Modern gradient background
const GradientBg = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    {children}
  </div>
);

// Glassmorphism card
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl ${className}`}>
    {children}
  </div>
);

// Animated stat card
const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <GlassCard className="p-6 hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/60 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}% from last week
          </p>
        )}
      </div>
      <div className={`p-4 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </GlassCard>
);

// Quick action button
const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all duration-300"
  >
    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-white font-medium">{label}</span>
    <ArrowRight className="w-4 h-4 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" />
  </button>
);

// Recent project item
const ProjectItem = ({ title, status, date, platform }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
    <div className={`w-2 h-2 rounded-full ${
      status === 'completed' ? 'bg-green-400' : 
      status === 'processing' ? 'bg-yellow-400' : 'bg-red-400'
    }`} />
    <div className="flex-1">
      <p className="text-white font-medium">{title}</p>
      <p className="text-white/40 text-sm">{platform} • {date}</p>
    </div>
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
      status === 'completed' ? 'bg-green-400/20 text-green-400' : 
      status === 'processing' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-red-400/20 text-red-400'
    }`}>
      {status}
    </span>
  </div>
);

// Main Dashboard Component
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    videosGenerated: 0,
    scriptsCreated: 0,
    scheduledPosts: 0
  });

  const quickActions = [
    { icon: Sparkles, label: 'New Idea', path: '/idea-lab' },
    { icon: FileText, label: 'Write Script', path: '/script-lab' },
    { icon: Video, label: 'Generate Video', path: '/video-generator' },
    { icon: Calendar, label: 'Schedule Post', path: '/calendar' },
  ];

  const recentProjects = [
    { title: 'AI Tools for Productivity', status: 'completed', date: '2 hours ago', platform: 'YouTube' },
    { title: '10x Your Workflow', status: 'processing', date: '5 hours ago', platform: 'TikTok' },
    { title: 'Future of AI', status: 'completed', date: '1 day ago', platform: 'Instagram' },
  ];

  return (
    <GradientBg>
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome back! 👋
          </h1>
          <p className="text-xl text-white/60">
            Here's your content factory overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={Video}
            label="Total Projects"
            value={stats.totalProjects}
            trend={12}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={Play}
            label="Videos Generated"
            value={stats.videosGenerated}
            trend={8}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={FileText}
            label="Scripts Created"
            value={stats.scriptsCreated}
            trend={23}
            color="from-orange-500 to-red-500"
          />
          <StatCard
            icon={Calendar}
            label="Scheduled Posts"
            value={stats.scheduledPosts}
            trend={5}
            color="from-green-500 to-emerald-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-400" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, i) => (
                  <QuickAction key={i} {...action} />
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Activity Feed */}
          <div>
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-400" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentProjects.map((project, i) => (
                  <ProjectItem key={i} {...project} />
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* CTA Section */}
        <GlassCard className="mt-8 p-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Ready to create your next viral video?
              </h2>
              <p className="text-white/60">
                Start with AI-powered idea generation
              </p>
            </div>
            <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New
            </button>
          </div>
        </GlassCard>
      </div>
    </GradientBg>
  );
}
