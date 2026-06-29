"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import { WebsocketProvider } from "y-websocket"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserState {
  name: string
  color: string
}

interface ActiveUsersProps {
  provider: WebsocketProvider | null
}

export function ActiveUsers({ provider }: ActiveUsersProps) {
  const [users, setUsers] = useState<Map<number, UserState>>(new Map())

  useEffect(() => {
    if (!provider) return

    const awareness = provider.awareness

    const updateUsers = () => {
      const states = new Map<number, UserState>()
      awareness.getStates().forEach((state, clientId) => {
        if (state.user && clientId !== awareness.clientID) {
          states.set(clientId, state.user as UserState)
        }
      })
      setUsers(states)
    }

    awareness.on("change", updateUsers)
    updateUsers()

    return () => {
      awareness.off("change", updateUsers)
    }
  }, [provider])

  if (users.size === 0) return null

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {Array.from(users.entries()).map(([clientId, user]) => (
          <Tooltip key={clientId}>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarFallback
                  className="text-[10px] text-white font-medium"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {users.size > 0 && (
          <span className="text-xs text-muted-foreground ml-3">
            {users.size} other{users.size > 1 ? "s" : ""} editing
          </span>
        )}
      </div>
    </TooltipProvider>
  )
}
