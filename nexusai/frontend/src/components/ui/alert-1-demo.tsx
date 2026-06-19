import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiNotificationFill,
  RiSpam3Fill,
  RiSpamFill,
} from "@remixicon/react"

import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert-1"

export default function AlertDemo() {
  return (
    <div className="mx-auto flex h-screen w-full max-w-[600px] flex-col items-center justify-center gap-5 p-10">
      <Alert appearance="outline" close>
        <AlertIcon>
          <RiAlertFill />
        </AlertIcon>
        <AlertTitle>This is a default alert</AlertTitle>
      </Alert>

      <Alert variant="primary" appearance="outline" close>
        <AlertIcon>
          <RiNotificationFill />
        </AlertIcon>
        <AlertTitle>This is a primary alert</AlertTitle>
      </Alert>

      <Alert variant="success" appearance="outline" close>
        <AlertIcon>
          <RiCheckboxCircleFill />
        </AlertIcon>
        <AlertTitle>This is a success alert</AlertTitle>
      </Alert>

      <Alert variant="destructive" appearance="outline" close>
        <AlertIcon>
          <RiErrorWarningFill />
        </AlertIcon>
        <AlertTitle>This is a destructive alert</AlertTitle>
      </Alert>

      <Alert variant="info" appearance="outline" close>
        <AlertIcon>
          <RiSpamFill />
        </AlertIcon>
        <AlertTitle>This is an info alert</AlertTitle>
      </Alert>

      <Alert variant="warning" appearance="outline" close>
        <AlertIcon>
          <RiSpam3Fill />
        </AlertIcon>
        <AlertTitle>This is a warning alert</AlertTitle>
      </Alert>
    </div>
  )
}

