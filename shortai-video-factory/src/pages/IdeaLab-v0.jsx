/**
 * v0-Style Idea Lab Component
 * Modern, AI-powered idea generation UI
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Target, 
  Users, 
  Palette, 
  Hash,
  Lightbulb,
  TrendingUp,
  Copy,
  Check,
  RefreshCw,
  Star,
  Flame
} from 'lucide-react';

// Gradient background
const GradientBg = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
    {children}
  </div>
);

// Glass card
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl ${className}`}>
    {children}
  </div>
);

// Idea card with viral score
const IdeaCard = ({ idea, onSelect, isSelected }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(idea.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-purple-400 bg-purple-500/20' 
          : 'border-white/10 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
      }`}
      onClick={() => onSelect(idea)}
    >
      {/* Viral Score Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
          <Flame className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">{idea.score}/10</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">#{idea.number}</span>
          </div>
          <h3 className="text-xl font-bold text-white">{idea.title}</h3>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <p className="text-white/80 text-sm italic">{idea.hook}</p>
        </div>

        <p className="text-white/60 text-sm leading-relaxed">
          {idea.description}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {idea.tags.map((tag, i) => (
          <span key={i} className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs">
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all text-white text-sm font-medium">
          <Star className="w-4 h-4" />
          Select
        </button>
      </div>
    </div>
  );
};

// Main Idea Lab Component
export default function IdeaLab() {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [style, setStyle] = useState('Educational');
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState([]);

  const styles = [
    'Educational',
    'Entertaining',
    'Storytelling',
    'Controversial',
    'Tutorial',
    'Listicle'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock ideas (replace with actual API call)
    const mockIdeas = [
      {
        number: 1,
        title: 'AI Hacks for Entrepreneurs',
        hook: 'A rapid-fire montage of AI tools',
        description: 'This video showcases 5 AI tools that can boost productivity for entrepreneurs, from automated email management to AI-powered content creation.',
        score: 8,
        tags: ['AI', 'Productivity', 'Business']
      },
      {
        number: 2,
        title: '10x Productivity with AI',
        hook: 'Before-and-after split-screen comparison',
        description: 'Demonstrates how AI tools can help entrepreneurs increase their productivity by up to 10 times.',
        score: 9,
        tags: ['AI', 'Productivity', 'Comparison']
      },
      {
        number: 3,
        title: 'AI Tool of the Week',
        hook: 'Suspenseful reveal of the AI tool',
        description: 'Weekly series introducing a new AI tool with features, benefits, and use cases.',
        score: 7,
        tags: ['AI', 'Review', 'Series']
      },
    ];

    setIdeas(mockIdeas);
    setIsGenerating(false);
  };

  const handleSelectIdea = (idea) => {
    if (selectedIdeas.find(i => i.number === idea.number)) {
      setSelectedIdeas(selectedIdeas.filter(i => i.number !== idea.number));
    } else {
      setSelectedIdeas([...selectedIdeas, idea]);
    }
  };

  return (
    <GradientBg>
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">Idea Lab</h1>
          </div>
          <p className="text-xl text-white/60">
            Generate viral video ideas with AI
          </p>
        </div>

        {/* Generator Form */}
        <GlassCard className="p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Topic */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Niche / Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Personal finance"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Target Audience
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Gen Z"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Style */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Content Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {styles.map(s => (
                  <option key={s} value={s} className="bg-slate-800">{s}</option>
                ))}
              </select>
            </div>

            {/* Count */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                Number of Ideas
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min="1"
                max="10"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Ideas
              </>
            )}
          </button>
        </GlassCard>

        {/* Results */}
        {ideas.length > 0 && (
          <>
            {/* Selection Bar */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-white/60">
                {selectedIdeas.length} of {ideas.length} selected
              </p>
              <button className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>

            {/* Ideas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.number}
                  idea={idea}
                  onSelect={handleSelectIdea}
                  isSelected={!!selectedIdeas.find(i => i.number === idea.number)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </GradientBg>
  );
}
