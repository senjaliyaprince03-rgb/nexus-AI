"use client"

import { useEffect, useState } from "react"

import { StarButton } from "@/components/ui/star-button"

export default function StarButtonDemo() {
  const [lightColor, setLightColor] = useState("#FAFAFA")

  useEffect(() => {
    setLightColor("#FAFAFA")
  }, [])

  return (
    <div>
      <StarButton lightColor={lightColor} className="rounded-3xl">
        Open Workspace
      </StarButton>
    </div>
  )
}
