import * as React from "react"
import { nuvioApi, type NuvioProfile } from "@/lib/nuvio-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Loader2, Check, RefreshCw, UserCheck } from "lucide-react"

export interface UseNuvioProfilesResult {
  profiles: NuvioProfile[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useNuvioProfiles(): UseNuvioProfilesResult {
  const [profiles, setProfiles] = React.useState<NuvioProfile[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchProfiles = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await nuvioApi.getProfiles()
      if (res.profiles && res.profiles.length > 0) {
        setProfiles(res.profiles)
      } else {
        // Fallback default slots if remote returns empty
        setProfiles([
          {
            id: "slot-1",
            user_id: "",
            profile_index: 1,
            name: "Primary Profile",
            avatar_url: null,
          },
        ])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profiles")
      setProfiles([
        {
          id: "slot-1",
          user_id: "",
          profile_index: 1,
          name: "Primary Profile",
          avatar_url: null,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return { profiles, isLoading, error, refresh: fetchProfiles }
}

export interface NuvioProfileSelectorProps {
  value?: number
  onChange: (slot: number, profile?: NuvioProfile) => void
  className?: string
  disabled?: boolean
  profiles?: NuvioProfile[]
  isLoading?: boolean
}

/**
 * Reusable Nuvio Profile Slot Selector.
 * Renders an interactive list of profile slots (1-6) on the user's connected account.
 */
export function NuvioProfileSelector({
  value = 1,
  onChange,
  className = "",
  disabled = false,
  profiles: externalProfiles,
  isLoading: externalLoading,
}: NuvioProfileSelectorProps) {
  const hookResult = useNuvioProfiles()
  const profiles = externalProfiles || hookResult.profiles
  const isLoading = externalLoading ?? hookResult.isLoading

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="size-4 animate-spin text-primary" />
        <span>Loading Nuvio profiles...</span>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 gap-2 ${className}`}>
      {profiles.map((p) => {
        const isSelected = value === p.profile_index
        const isPrimary = p.profile_index === 1

        return (
          <div
            key={p.profile_index}
            onClick={() => !disabled && onChange(p.profile_index, p)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            } ${
              isSelected
                ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
                : "border-border/60 bg-card hover:bg-muted/40 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-full ring-1 ring-border/50 overflow-hidden shrink-0 bg-neutral-900 flex items-center justify-center text-xs font-bold text-muted-foreground">
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={p.name}
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <span>{(p.name || `P${p.profile_index}`).slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {p.name || `Profile ${p.profile_index}`}
                  </span>
                  {isPrimary && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-emerald-500/15 text-emerald-500">
                      Primary
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Slot {p.profile_index} of 6
                </span>
              </div>
            </div>

            <div className="shrink-0 pl-2">
              <div
                className={`size-5 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                }`}
              >
                {isSelected && <Check className="size-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface NuvioProfileSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  preview?: React.ReactNode
  initialSlot?: number
  onConfirm: (slot: number, profile?: NuvioProfile) => Promise<void> | void
}

/**
 * Reusable Dialog for selecting a profile slot before an action
 * (e.g. Deploying a profile, Pushing catalog, Applying avatar, etc.)
 */
export function NuvioProfileSelectDialog({
  open,
  onOpenChange,
  title = "Select Profile Slot",
  description = "Choose which profile slot on your connected Nuvio account to apply this to.",
  confirmLabel,
  preview,
  initialSlot = 1,
  onConfirm,
}: NuvioProfileSelectDialogProps) {
  const { profiles, isLoading, refresh } = useNuvioProfiles()
  const [selectedSlot, setSelectedSlot] = React.useState<number>(initialSlot)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset selected slot when opened
  React.useEffect(() => {
    if (open) {
      setSelectedSlot(initialSlot)
      refresh()
    }
  }, [open, initialSlot, refresh])

  const selectedProfile = profiles.find((p) => p.profile_index === selectedSlot)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(selectedSlot, selectedProfile)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultActionLabel = confirmLabel || `Apply to ${selectedProfile?.name || `Slot ${selectedSlot}`}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {preview}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Profile
              </label>
              <button
                type="button"
                onClick={() => refresh()}
                disabled={isLoading}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto pr-1">
              <NuvioProfileSelector
                value={selectedSlot}
                onChange={(slot) => setSelectedSlot(slot)}
                profiles={profiles}
                isLoading={isLoading}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2.5 sm:gap-3 pt-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || isLoading}
            className="bg-primary text-primary-foreground font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Applying...
              </>
            ) : (
              defaultActionLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
