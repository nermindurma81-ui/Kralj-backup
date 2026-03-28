import { useState } from 'react'
import { Zap, ArrowRight, Check, Loader2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { executeWorkflow } from '../lib/api'

const WORKFLOW_STEPS = [
  { id: 'idea', label: 'Generate Idea', tool: 'idea-lab' },
  { id: 'script', label: 'Write Script', tool: 'script-lab' },
  { id: 'hooks', label: 'Create Hooks', tool: 'viral-hooks' },
  { id: 'storyboard', label: 'Build Storyboard', tool: 'storyboard' },
  { id: 'voice', label: 'Generate Voice', tool: 'voice-generator' },
  { id: 'captions', label: 'Add Captions', tool: 'caption-lab' },
  { id: 'thumbnail', label: 'Create Thumbnail', tool: 'thumbnail-ai' },
  { id: 'score', label: 'Viral Score', tool: 'viral-score' },
  { id: 'publish', label: 'Schedule/Publish', tool: 'calendar' }
]

export default function WorkflowConnector({ onResult, currentStep }) {
  const [selectedSteps, setSelectedSteps] = useState([])
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState([])
  const [expanded, setExpanded] = useState(false)

  const toggleStep = (stepId) => {
    setSelectedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(s => s !== stepId)
        : [...prev, stepId]
    )
  }

  const runWorkflow = async () => {
    if (selectedSteps.length === 0) {
      toast.error('Select at least one workflow step')
      return
    }

    setRunning(true)
    setCompleted([])

    try {
      const workflow = {
        steps: selectedSteps.map(id => WORKFLOW_STEPS.find(s => s.id === id)),
        context: { currentStep }
      }

      const result = await executeWorkflow(workflow)

      setCompleted(selectedSteps)
      if (onResult) onResult(result)
      toast.success('Workflow completed successfully')
    } catch (err) {
      toast.error(`Workflow failed: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card border-primary-500/30 bg-gradient-to-r from-primary-900/20 to-accent-900/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Workflow Connector</h3>
            <p className="text-xs text-gray-400">Chain tools together for automated content creation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          {/* Step selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${selectedSteps.includes(step.id)
                      ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:border-gray-500'
                    }
                    ${completed.includes(step.id) ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    {completed.includes(step.id) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-gray-600 text-[10px] flex items-center justify-center">
                        {index + 1}
                      </span>
                    )}
                    {step.label}
                  </span>
                </button>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-600 mx-1 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          {/* Run button */}
          <button
            onClick={runWorkflow}
            disabled={running || selectedSteps.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running workflow...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Workflow ({selectedSteps.length} steps)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
