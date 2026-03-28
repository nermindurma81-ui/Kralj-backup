import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Trash2, Loader2, Send, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { scheduleContent, publishNow, getScheduledContent, deleteScheduledContent } from '../lib/api'
import { usePlatformStore } from '../store/platformStore'

export default function ContentCalendar() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [scheduledItems, setScheduledItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [publishing, setPublishing] = useState(null)
  const [scheduling, setScheduling] = useState(false)
  const [form, setForm] = useState({
    title: '',
    platform: 'youtube',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledTime: '09:00',
    content: '',
    status: 'scheduled'
  })
  const { connections } = usePlatformStore()

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const data = await getScheduledContent()
      setScheduledItems(data || [])
    } catch (err) {
      console.error('Failed to load schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!form.title.trim()) {
      toast.error('Enter a title')
      return
    }

    try {
      const scheduledAt = `${form.scheduledDate}T${form.scheduledTime}:00`
      const result = await scheduleContent({ ...form, scheduledAt })
      setScheduledItems(prev => [...prev, result])
      setShowForm(false)
      setForm({ title: '', platform: 'youtube', scheduledDate: format(new Date(), 'yyyy-MM-dd'), scheduledTime: '09:00', content: '', status: 'scheduled' })
      toast.success('Content scheduled!')
    } catch (err) {
      toast.error(`Scheduling failed: ${err.message}`)
    }
  }

  const handlePublishNow = async (item) => {
    setPublishing(item.id)
    try {
      await publishNow(item.id, item.platform)
      setScheduledItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'published' } : i))
      toast.success('Published!')
    } catch (err) {
      toast.error(`Publish failed: ${err.message}`)
    } finally {
      setPublishing(null)
    }
  }

  const deleteItem = async (id) => {
    try {
      await deleteScheduledContent(id)
      setScheduledItems(prev => prev.filter(i => i.id !== id))
      toast.success('Removed from schedule')
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))

  const getItemsForDay = (day) => {
    return scheduledItems.filter(item => {
      const itemDate = item.scheduledAt ? parseISO(item.scheduledAt) : null
      return itemDate && isSameDay(itemDate, day)
    })
  }

  const platformColors = {
    youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
    tiktok: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    twitter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    facebook: 'bg-blue-600/20 text-blue-300 border-blue-600/30'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-400" /> Content Calendar
          </h1>
          <p className="page-subtitle">Schedule and manage your content publishing</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Schedule Content
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="btn-secondary flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
        </h2>
        <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="btn-secondary flex items-center gap-1">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const items = getItemsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()} className={`card min-h-[200px] ${isToday ? 'border-primary-500/50' : ''}`}>
                <div className={`text-center mb-3 pb-2 border-b border-gray-700 ${isToday ? 'text-primary-400' : ''}`}>
                  <p className="text-xs text-gray-500 uppercase">{format(day, 'EEE')}</p>
                  <p className="text-lg font-bold">{format(day, 'd')}</p>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className={`p-2 rounded-lg border text-xs ${platformColors[item.platform] || 'bg-gray-700 text-gray-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{item.title}</span>
                        <div className="flex gap-0.5">
                          {item.status !== 'published' && (
                            <button
                              onClick={() => handlePublishNow(item)}
                              disabled={publishing === item.id}
                              className="p-0.5 hover:opacity-70"
                            >
                              {publishing === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            </button>
                          )}
                          <button onClick={() => deleteItem(item.id)} className="p-0.5 hover:opacity-70">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] opacity-70">
                        <Clock className="w-2.5 h-2.5" />
                        {item.scheduledAt ? format(parseISO(item.scheduledAt), 'HH:mm') : ''}
                        {item.status === 'published' && <span className="ml-1">✓</span>}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-4">No content</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Schedule form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Schedule Content</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Video title" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Platform</label>
                <select value={form.platform} onChange={(e) => setForm(f => ({ ...f, platform: e.target.value }))} className="input-field">
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <input type="date" value={form.scheduledDate} onChange={(e) => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time</label>
                  <input type="time" value={form.scheduledTime} onChange={(e) => setForm(f => ({ ...f, scheduledTime: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} className="input-field min-h-[80px] resize-none" placeholder="Optional notes..." />
              </div>
              <button onClick={handleSchedule} className="btn-primary w-full">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
