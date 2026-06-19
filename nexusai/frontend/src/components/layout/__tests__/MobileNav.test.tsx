import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MobileNav } from "@/components/layout/MobileNav"

describe("MobileNav", () => {
  it("exposes analytics agents and modules through the More menu", () => {
    render(<MobileNav />)

    fireEvent.click(screen.getByLabelText("Open more navigation"))

    expect(screen.getByText("Analytics")).toBeTruthy()
    expect(screen.getByText("Agents")).toBeTruthy()
    expect(screen.getByText("Modules")).toBeTruthy()
  })
})
