import * as React from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Loader2,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { toast } from 'sonner'
import { testApiKey, KeyTestResult } from '@/lib/test-key'

export type KeyVerificationStatus = 'idle' | 'checking' | 'valid' | 'invalid'

export interface IntegrationKeyFieldProps {
  id?: string
  serviceId?: string
  label: string
  labelClassName?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password'
  allowToggleVisibility?: boolean
  getKeyUrl?: string
  getKeyText?: string
  infoKey?: string
  onInfoClick?: (key: string) => void

  // Controlled verification state (optional)
  status?: KeyVerificationStatus
  initialStatus?: KeyVerificationStatus
  error?: string | null
  onVerify?: () => Promise<boolean | KeyTestResult | void> | boolean | void
  onStatusChange?: (status: KeyVerificationStatus) => void
  onVerifiedChange?: (isValid: boolean) => void

  // Options
  proxyUrl?: string
  autoVerifyOnEnter?: boolean
  successMessage?: string
  note?: string
  warning?: string
  isSubmitted?: boolean
  className?: string
  inputClassName?: string
  children?: React.ReactNode
}

export function IntegrationKeyField({
  id,
  serviceId,
  label,
  labelClassName = '',
  required = false,
  value,
  onChange,
  placeholder,
  type = 'password',
  allowToggleVisibility = true,
  getKeyUrl,
  getKeyText = 'Get a key',
  infoKey,
  onInfoClick,
  status: controlledStatus,
  initialStatus = 'idle',
  error: controlledError,
  onVerify,
  onStatusChange,
  onVerifiedChange,
  proxyUrl,
  autoVerifyOnEnter = true,
  successMessage,
  note,
  warning,
  isSubmitted = false,
  className = '',
  inputClassName = '',
  children,
}: IntegrationKeyFieldProps) {
  const [internalStatus, setInternalStatus] = React.useState<KeyVerificationStatus>(initialStatus)
  const [internalError, setInternalError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(type !== 'password')

  const isControlled = controlledStatus !== undefined
  const currentStatus = isControlled ? controlledStatus : internalStatus
  const currentError = isControlled ? controlledError : internalError

  const inputId = id || `key-${serviceId || label.toLowerCase().replace(/\s+/g, '-')}`

  const handleVerifyAction = async () => {
    const cleanValue = value.trim()
    if (!cleanValue) {
      const msg = `Enter a key for ${label} first`
      if (!isControlled) {
        setInternalStatus('invalid')
        setInternalError(msg)
      }
      toast.error(msg)
      return
    }

    if (onVerify) {
      try {
        await onVerify()
      } catch (err: any) {
        toast.error(err.message || `Failed to verify ${label}`)
      }
      return
    }

    if (!serviceId) {
      toast.error('No service ID configured for verification')
      return
    }

    setInternalStatus('checking')
    setInternalError(null)
    onStatusChange?.('checking')

    try {
      const res = await testApiKey(serviceId, cleanValue, { proxyUrl })
      if (res.status === 'valid') {
        setInternalStatus('valid')
        setInternalError(null)
        onStatusChange?.('valid')
        onVerifiedChange?.(true)
        toast.success(`${label} verified successfully!`)
      } else {
        const msg = res.message || `${label} verification failed`
        setInternalStatus('invalid')
        setInternalError(msg)
        onStatusChange?.('invalid')
        onVerifiedChange?.(false)
        toast.error(msg)
      }
    } catch (err: any) {
      const msg = err.message || `Failed to verify ${label}`
      setInternalStatus('invalid')
      setInternalError(msg)
      onStatusChange?.('invalid')
      onVerifiedChange?.(false)
      toast.error(msg)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value
    onChange(nextVal)
    if (!isControlled) {
      setInternalStatus('idle')
      setInternalError(null)
      onStatusChange?.('idle')
      onVerifiedChange?.(false)
    }
  }

  const isInvalid = currentStatus === 'invalid'
  const isChecking = currentStatus === 'checking'
  const isValid = currentStatus === 'valid'
  const hasValue = Boolean(value.trim())

  // Specific TMDB warning helper
  const showTmdbWarning =
    serviceId === 'tmdb' &&
    hasValue &&
    !value.trim().startsWith('eyJ') &&
    !isValid &&
    !isChecking

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Label htmlFor={inputId} className={`font-medium text-foreground select-none ${labelClassName || 'text-xs sm:text-sm'}`}>
            {label} {required && <span className="text-destructive font-bold">*</span>}
          </Label>

          {infoKey && onInfoClick && (
            <button
              type="button"
              onClick={() => onInfoClick(infoKey)}
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-0.5 rounded"
              title={`About ${label}`}
              aria-label={`About ${label}`}
            >
              <Info className="size-3.5" />
            </button>
          )}

          {/* Status Badge */}
          {isValid ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/30">
              <CheckCircle2 className="size-3 shrink-0" /> Verified
            </span>
          ) : isChecking ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
              <Loader2 className="size-3 animate-spin shrink-0" /> Checking...
            </span>
          ) : isInvalid ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium border border-destructive/20">
              <AlertCircle className="size-3 shrink-0" /> Invalid Key
            </span>
          ) : hasValue ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/30">
              Unverified
            </span>
          ) : required ? (
            <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider bg-destructive/10 border border-destructive/20 rounded px-1.5 py-0.5">
              Required
            </span>
          ) : null}
        </div>

        {getKeyUrl && (
          <a
            href={getKeyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            {getKeyText} <ExternalLink className="size-3 shrink-0" />
          </a>
        )}
      </div>

      {/* Input + Verify Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id={inputId}
            type={allowToggleVisibility ? (showPassword ? 'text' : 'password') : type}
            value={value}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hasValue && !isChecking && autoVerifyOnEnter) {
                e.preventDefault()
                void handleVerifyAction()
              }
            }}
            placeholder={placeholder}
            className={`font-mono text-xs pr-9 h-10 ${
              isInvalid || (isSubmitted && required && !isValid)
                ? 'border-destructive focus-visible:ring-destructive'
                : isValid
                ? 'border-emerald-500/40 focus-visible:ring-emerald-500/30'
                : ''
            } ${inputClassName}`}
          />
          {allowToggleVisibility && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide value' : 'Show value'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 transition-colors"
              title={showPassword ? 'Hide value' : 'Show value'}
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          )}
        </div>

        <Button
          type="button"
          variant={isValid ? 'secondary' : 'outline'}
          size="sm"
          disabled={!hasValue || isChecking}
          onClick={() => void handleVerifyAction()}
          className="h-10 px-4 text-xs font-medium cursor-pointer shrink-0"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin shrink-0" />
              Checking
            </>
          ) : isValid ? (
            <>
              <Check className="mr-1.5 size-3.5 text-emerald-500 shrink-0" />
              Verified
            </>
          ) : (
            'Verify'
          )}
        </Button>
      </div>

      {/* Feedback Messages */}
      {isValid ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Check className="size-3.5 shrink-0" /> {successMessage || 'Key accepted.'}
        </p>
      ) : currentError ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive font-medium">
          <AlertCircle className="size-3.5 shrink-0" /> {currentError}
        </p>
      ) : isSubmitted && required && !isValid ? (
        <p className="text-xs text-destructive flex items-center gap-1 font-medium">
          <AlertCircle className="size-3 shrink-0" /> {label} is required and must be verified to continue.
        </p>
      ) : null}

      {/* Warnings & Notes */}
      {warning && (
        <p className="text-xs text-amber-500 flex items-center gap-1 font-medium">
          <AlertCircle className="size-3 shrink-0" /> {warning}
        </p>
      )}

      {showTmdbWarning && (
        <p className="text-xs text-amber-500 flex items-center gap-1 font-medium">
          <AlertCircle className="size-3 shrink-0" /> Note: TMDB API Read Access Token should start with &quot;eyJ...&quot;. Make sure to copy the long token, not the short API key.
        </p>
      )}

      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}

      {/* Extra slot (e.g. Scrobble switch, Proxy URL) */}
      {children}
    </div>
  )
}
