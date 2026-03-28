/**
 * ShortAI Landing Page
 * Modern, conversion-focused landing page
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Sparkles, Video, Zap, TrendingUp, Play, 
  CheckCircle2, ArrowRight, Star, Users, 
  Clock, Shield, Globe, MessageSquare
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Video,
      title: 'AI Video Generation',
      description: 'Generate viral short videos in minutes with AI-powered automation',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'From idea to published video in under 5 minutes',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: TrendingUp,
      title: 'Viral Optimization',
      description: 'AI-powered viral score ensures maximum engagement',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Multi-Platform',
      description: 'Publish to YouTube, TikTok, Instagram simultaneously',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Clock,
      title: 'Schedule Posts',
      description: 'Plan and schedule your content calendar in advance',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Your data is encrypted and never shared with third parties',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const stats = [
    { value: '10,000+', label: 'Videos Generated' },
    { value: '5,000+', label: 'Happy Creators' },
    { value: '50M+', label: 'Total Views' },
    { value: '99.9%', label: 'Uptime' }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Content Creator',
      avatar: '👩‍🎤',
      text: 'ShortAI helped me grow from 0 to 100K followers in 3 months. The AI-generated content is incredible!',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Marketing Manager',
      avatar: '👨‍💼',
      text: 'We produce 10x more content with half the team. ROI has been amazing.',
      rating: 5
    },
    {
      name: 'Emma Davis',
      role: 'Social Media Influencer',
      avatar: '👩‍🦰',
      text: 'The viral score feature is a game-changer. My engagement rate doubled!',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">ShortAI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="text-white/60 hover:text-white transition-colors">Testimonials</a>
              <a href="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/login')}
                className="text-white/80 hover:text-white font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/idea-lab')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-white/80 text-sm font-medium">AI-Powered Video Creation</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Create Viral Videos
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              In Minutes, Not Hours
            </span>
          </h1>

          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-10">
            Transform your ideas into engaging short-form videos with AI. 
            Generate scripts, voiceovers, visuals, and captions automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/idea-lab')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
            >
              Start Creating Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Go Viral
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Powerful AI tools to create, edit, and publish engaging short-form content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              From Idea to Video in 3 Steps
            </h2>
            <p className="text-xl text-white/60">
              Our AI handles the heavy lifting while you focus on creativity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Enter Your Idea', desc: 'Tell our AI what your video is about' },
              { step: '02', title: 'AI Creates Everything', desc: 'Script, voiceover, visuals, captions' },
              { step: '03', title: 'Publish & Grow', desc: 'One-click publish to all platforms' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-white/60">
              Join thousands of creators growing their audience with ShortAI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="p-8 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{testimonial.avatar}</span>
                  <div>
                    <p className="text-white font-bold">{testimonial.name}</p>
                    <p className="text-white/40 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/20">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Create Your First Viral Video?
            </h2>
            <p className="text-xl text-white/60 mb-8">
              Join thousands of creators using ShortAI to grow their audience
            </p>
            <button 
              onClick={() => navigate('/idea-lab')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-white/40 text-sm mt-4">
              No credit card required • Free plan available
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/idea-lab" className="text-white/60 hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="text-white/60 hover:text-white">Pricing</Link></li>
                <li><Link to="/templates" className="text-white/60 hover:text-white">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white">About</a></li>
                <li><a href="#" className="text-white/60 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-white/60 hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-white/60 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-white/60 hover:text-white">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-white/60 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-white/60 hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">ShortAI</span>
            </div>
            <p className="text-white/40 text-sm">
              © 2026 ShortAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
