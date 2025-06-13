import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Group } from "./db/schema"
import { Home, Star, Heart, Settings, HelpCircle, MessageCircle, Train, BookOpen, User, Users } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const EventTypeIconOptions: Record<string, React.ElementType> = {
  home: Home,
  star: Star,
  favorite: Heart,
  settings: Settings,
  help: HelpCircle,
  chat: MessageCircle,
  train: Train,
  import: BookOpen,
  person: User,
  people: Users,
}

export function isDescendant(groups: Group[], groupId: string, parentId: string | null): boolean {
  while (parentId !== null) {
    if (parentId === groupId) {
      return true
    }

    const parentGroup = groups.find(group => group.id === parentId)
    if (!parentGroup) {
      break // Stop if no parent group is found
    }

    parentId = parentGroup.parentId // Move up the tree
  }

  return false
}