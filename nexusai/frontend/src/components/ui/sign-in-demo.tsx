"use client"

import React from "react"

import { SignInPage, type Testimonial } from "@/components/ui/sign-in"

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@legalops",
    text: "We use NexusAI to review policy packs faster and every answer comes back with the exact citations we need.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@researchlead",
    text: "The multi-agent flow helps our team compare dense research documents without losing the source context.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@revops",
    text: "Analytics and workspace search give us a clear picture of which documents actually drive the best answers.",
  },
]

export default function SignInPageDemo() {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    console.log("Sign In submitted:", data)
    alert("NexusAI sign-in submitted. Check the browser console for form data.")
  }

  return (
    <div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <SignInPage
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={() => alert("Google workspace sign-in clicked")}
        onResetPassword={() => alert("NexusAI password reset clicked")}
        onCreateAccount={() => alert("NexusAI account creation clicked")}
      />
    </div>
  )
}
