import { Session } from "next-auth"

export function getUserId(session: Session | null): string | null {
    if (!session?.user?.name) return null
    const parts = session.user.name.split('|')
    return parts.length > 1 ? parts[1] : null
}

export function getDisplayName(session: Session | null): string | null {
    if (!session?.user?.name) return null
    return session.user.name.split('|')[0]
}