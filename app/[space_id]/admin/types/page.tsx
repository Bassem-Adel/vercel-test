"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventType } from "@/lib/db/schema"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { EventTypeIconOptions } from "@/lib/utils"

export default function TypesPage() {
  const router = useRouter()
  const params = useParams()
  const spaceId = params?.space_id as string

  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const eventTypesRes = await fetch(`/api/types?spaceId=${spaceId}`)

        if (!eventTypesRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const eventTypesData = await eventTypesRes.json()

        setEventTypes(eventTypesData)
      } catch (err: any) {
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [spaceId])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/types?id=${deleteId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete item")
      setEventTypes(eventTypes.filter(eventType => eventType.id !== deleteId))
      setDeleteDialogOpen(false)
      setDeleteId(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete item")
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Event Types</h2>
        <Button
          className="flex items-center gap-1"
          onClick={() => router.push(`/${spaceId}/admin/types/create`)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Event Type</span>
        </Button>
      </div>
      <ul>
        {eventTypes.map(eventType => {
          const Icon = EventTypeIconOptions[eventType.icon ?? "help"] // Fallback to "help" icon
          return (
            <li key={eventType.id} className="flex justify-between items-center border-b py-2">
              <div className="flex items-center gap-2">
                <Icon className="h-6 w-6 text-gray-500" /> {/* Render the icon */}
                <p className="font-bold">{eventType.name}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline"
                  onClick={() => router.push(`/${spaceId}/admin/types/${eventType.id}/edit`)}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button variant="destructive" onClick={() => { setDeleteId(eventType.id); setDeleteDialogOpen(true) }}>
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this item?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}