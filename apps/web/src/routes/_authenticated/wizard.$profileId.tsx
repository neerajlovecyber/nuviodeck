import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar'
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context'
import { WizardHeader } from '@/components/wizard/layout/wizard-header'
import { WizardFooter } from '@/components/wizard/layout/wizard-footer'
import { WizardSidebar } from '@/components/wizard/layout/wizard-sidebar'
import { Step1Setup } from '@/components/wizard/steps/step-1-setup'
import { Step2HomeRows } from '@/components/wizard/steps/step-2-home-rows'
import { Step3Collections } from '@/components/wizard/steps/step-3-collections'
import { Step4Streams } from '@/components/wizard/steps/step-4-streams'
import { Step5Finalize } from '@/components/wizard/steps/step-5-finalize'
import { WizardDialogs } from '@/components/wizard/dialogs/wizard-dialogs'

export const Route = createFileRoute('/_authenticated/wizard/$profileId')({
  component: ProfileWizardRoute,
})

function ProfileWizardRoute() {
  const { profileId } = Route.useParams()

  return (
    <WizardProvider profileId={profileId}>
      <ProfileWizardPageContent />
    </WizardProvider>
  )
}

function ProfileWizardPageContent() {
  const { step } = useWizard()

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem',
          '--header-height': '3.5rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen md:h-[calc(100vh-1rem)] max-h-screen md:max-h-[calc(100vh-1rem)] overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <WizardHeader />

        {/* Main Grid: Content (Center) + Persistent Sidebar (Right) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row w-full overflow-hidden">
          {/* Center Work Area */}
          <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex-1 flex flex-col items-center w-full">
                <div
                  className={`w-full ${
                    step === 1
                      ? 'max-w-2xl px-4 py-6 sm:px-6 sm:py-8'
                      : step === 2
                      ? 'max-w-6xl xl:max-w-7xl px-4 py-6 sm:px-6 sm:py-8'
                      : 'max-w-4xl lg:max-w-5xl px-6 py-8 md:px-10 lg:px-12'
                  }`}
                >
                  {step === 1 && <Step1Setup />}
                  {step === 2 && <Step2HomeRows />}
                  {step === 3 && <Step3Collections />}
                  {step === 4 && <Step4Streams />}
                  {step === 5 && <Step5Finalize />}
                  <div className="pb-6" />
                </div>
              </div>
            </div>

            {/* Sticky Glass Bottom Navigation Footer */}
            <WizardFooter />
          </div>

          {/* Right Persistent Sidebar */}
          <WizardSidebar />
        </div>

        {/* All Modals & Dialogs */}
        <WizardDialogs />
      </SidebarInset>
    </SidebarProvider>
  )
}
