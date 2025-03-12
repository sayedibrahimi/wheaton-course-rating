// src/context/AuthContext.tsx
// Purpose: This file is used to wrap the entire application with the SessionProvider from next-auth/react. This allows the application to access the session object and use it to determine if a user is authenticated or not.
'use client'
import { SessionProvider } from 'next-auth/react'

export default function AuthContext({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
}