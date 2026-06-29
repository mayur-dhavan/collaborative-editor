import { z } from "zod"

export const MAX_PAYLOAD_SIZE = 1_048_576 // 1MB
export const MAX_DOCUMENT_TITLE_LENGTH = 255
export const MAX_DOCUMENT_SIZE = 50_000_000 // 50MB

export const emailSchema = z.string().email()
export const passwordSchema = z.string().min(6).max(128)
export const titleSchema = z.string().min(1).max(MAX_DOCUMENT_TITLE_LENGTH).trim()

export function sanitizeTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'&]/g, "")
    .trim()
    .slice(0, MAX_DOCUMENT_TITLE_LENGTH)
}

export function validatePayloadSize(size: number): boolean {
  return size <= MAX_PAYLOAD_SIZE
}
