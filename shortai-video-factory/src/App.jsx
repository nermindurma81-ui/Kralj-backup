import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IdeaLab from './pages/IdeaLab'
import ScriptLab from './pages/ScriptLab'
import ViralHookLab from './pages/ViralHookLab'
import StoryboardGenerator from './pages/StoryboardGenerator'
import VideoGenerator from './pages/VideoGenerator'
import VoiceGenerator from './pages/VoiceGenerator'
import CaptionLab from './pages/CaptionLab'
import ThumbnailAI from './pages/ThumbnailAI'
import ViralScoreEngine from './pages/ViralScoreEngine'
import TrendDiscovery from './pages/TrendDiscovery'
import ContentCalendar from './pages/ContentCalendar'
import BulkGenerator from './pages/BulkGenerator'
import AutoFactory from './pages/AutoFactory'
import CompetitorAnalyzer from './pages/CompetitorAnalyzer'
import NicheFinder from './pages/NicheFinder'
import VideoAssembler from './pages/VideoAssembler'
import Pipeline from './pages/Pipeline'
import HashtagGenerator from './pages/HashtagGenerator'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="idea-lab" element={<IdeaLab />} />
        <Route path="script-lab" element={<ScriptLab />} />
        <Route path="viral-hooks" element={<ViralHookLab />} />
        <Route path="storyboard" element={<StoryboardGenerator />} />
        <Route path="video-generator" element={<VideoGenerator />} />
        <Route path="voice-generator" element={<VoiceGenerator />} />
        <Route path="caption-lab" element={<CaptionLab />} />
        <Route path="thumbnail-ai" element={<ThumbnailAI />} />
        <Route path="viral-score" element={<ViralScoreEngine />} />
        <Route path="trends" element={<TrendDiscovery />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="bulk-generator" element={<BulkGenerator />} />
        <Route path="auto-factory" element={<AutoFactory />} />
        <Route path="competitor-analyzer" element={<CompetitorAnalyzer />} />
        <Route path="niche-finder" element={<NicheFinder />} />
        <Route path="video-assembler" element={<VideoAssembler />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="hashtags" element={<HashtagGenerator />} />
      </Route>
    </Routes>
  )
}
