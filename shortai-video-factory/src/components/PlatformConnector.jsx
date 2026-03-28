import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { X, ExternalLink, Check, Loader2, Unlink } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePlatformStore } from '../store/platformStore'
import { getPlatformConnections, connectPlatform, disconnectPlatform } from '../lib/api'

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: '▶', description: 'Upload videos, manage channels' },
  { id: 'tiktok', name: 'TikTok', color: '#000000', icon: '♪', description: 'Publish short-form videos' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: '📷', description: 'Reels and Stories' },
  { id: 'twitter', name: 'Twitter/X', color: '#1DA1F2', icon: '𝕏', description: 'Video posts and clips' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'f', description: 'Reels and video posts' }
]

export default function PlatformConnector({ isOpen, onClose }) {
  const { connections, setConnections, addConnection, removeConnection } = usePlatformStore()
  const [connecting, setConnecting] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  // Check for YouTube callback success
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('youtube_connected') === 'true') {
      const channel = params.get('channel') || 'YouTube'
      addConnection({
        id: crypto.randomUUID(),
        platform: 'youtube',
        connected: true,
        accountName: channel
      })
      toast.success(`YouTube connected: ${channel}`)
      // Clean URL
      window.history.replaceState({}, '', '/')
    }
  }, [location.search])

  useEffect(() => {
    if (isOpen) {
      loadConnections()
    }
  }, [isOpen])

  const loadConnections = async () => {
    setLoading(true)
    try {
      const data = await getPlatformConnections()
      setConnections(data)
    } catch (err) {
      console.error('Failed to load connections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platformId) => {
    setConnecting(platformId)
    try {
      const result = await connectPlatform(platformId)
      if (result.authUrl) {
        window.open(result.authUrl, '_blank', 'width=600,height=700')
        toast.success(`Authorize ${PLATFORMS.find(p => p.id === platformId)?.name} in the popup window`)
      } else if (result.connection) {
        addConnection(result.connection)
        toast.success(`Connected to ${PLATFORMS.find(p => p.id === platformId)?.name}`)
      }
    } catch (err) {
      toast.error(`Connection failed: ${err.message}`)
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (connectionId, platformName) => {
    try {
      await disconnectPlatform(connectionId)
      removeConnection(connectionId)
      toast.success(`Disconnected from ${platformName}`)
    } catch (err) {
      toast.error(`Disconnect failed: ${err.message}`)
    }
  }

  const isConnected = (platformId) => {
    return connections.some(c => c.platform === platformId && c.connected)
  }

  const getConnection = (platformId) => {
    return connections.find(c => c.platform === platformId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Platform Connections</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {PLATFORMS.map((platform) => {
                const connected = isConnected(platform.id)
                const connection = getConnection(platform.id)

                return (
                  <div key={platform.id} className="card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{platform.name}</span>
                          {connected && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Connected
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-400">{platform.description}</span>
                        {connected && connection?.accountName && (
                          <span className="text-xs text-gray-500 block mt-1">@{connection.accountName}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      {connected ? (
                        <button
                          onClick={() => handleDisconnect(connection.id, platform.name)}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          <Unlink className="w-4 h-4" /> Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          disabled={connecting === platform.id}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          {connecting === platform.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
