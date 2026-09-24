import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useWizard } from '../wizard-context'
import { WizardStep } from '../wizard-types'

export function WizardFooter() {
  const navigate = useNavigate()
  const {
    step,
    setStep,
    isStep1Valid,
    setStep1Submitted,
    setOpenSection,
    saveProfileConfig,
    handlePushToNuvio,
    isPushing,
  } = useWizard()

  const STEPS: { num: WizardStep; label: string }[] = [
    { num: 1, label: 'Setup' },
    { num: 2, label: 'Home rows' },
    { num: 3, label: 'Collections' },
    { num: 4, label: 'Streams' },
    { num: 5, label: 'Finalize' },
  ]

  const handleStepClick = (targetStep: WizardStep) => {
    if (step === 1 && !isStep1Valid && targetStep > 1) {
      setStep1Submitted(true)
      setOpenSection('integrations')
      toast.error('Both TMDB Read Access Token and MDBList API key are required to continue')
      return
    }
    saveProfileConfig()
    setStep(targetStep)
  }

  const handleContinue = () => {
    if (step === 1 && !isStep1Valid) {
      setStep1Submitted(true)
      setOpenSection('integrations')
      toast.error('Both TMDB Read Access Token and MDBList API key are required to continue')
      return
    }
    saveProfileConfig()
    setStep((step + 1) as WizardStep)
  }

  return (
    <footer className="z-20 shrink-0 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-3">
          <Button
            variant="ghost"
            onClick={() => {
              if (step > 1) setStep((step - 1) as WizardStep)
              else navigate({ to: '/dashboard' })
            }}
            className="h-10 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>

          {/* Stepper in Bottom Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-sm">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => handleStepClick(s.num)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    step === s.num
                      ? 'bg-accent text-accent-foreground border border-border shadow-xs'
                      : step > s.num
                      ? 'text-foreground hover:bg-accent/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span
                    className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s.num
                        ? 'bg-primary text-primary-foreground'
                        : step > s.num
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > s.num ? '✓' : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < 4 && <div className="w-2 sm:w-4 h-px bg-border" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {step < 5 ? (
              <Button
                onClick={handleContinue}
                className="h-10 gap-1.5 px-4 text-xs font-semibold cursor-pointer"
              >
                Continue
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handlePushToNuvio}
                disabled={isPushing}
                className="h-10 gap-1.5 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                {isPushing ? 'Pushing...' : 'Push to Nuvio'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
