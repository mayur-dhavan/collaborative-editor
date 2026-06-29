export const Role = {
  OWNER: "OWNER",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const

export type Role = (typeof Role)[keyof typeof Role]
