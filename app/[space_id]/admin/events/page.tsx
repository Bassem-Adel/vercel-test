"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Event, EventType } from "@/lib/db/schema"
import { Info, Pencil, Trash2, Plus, Filter } from "lucide-react"

export default function EventsPage() {
  const router = useRouter()
  const params = useParams()
  const spaceId = params?.space_id as string

  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [eventFilterModalOpen, setEventFilterModalOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const eventTypesRes = await fetch(`/api/types?spaceId=${spaceId}`)
        const eventsRes = await fetch(`/api/events?spaceId=${spaceId}`)

        if (!eventTypesRes.ok || !eventsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const eventTypesData = await eventTypesRes.json()
        const eventsData = await eventsRes.json()

        setEventTypes(eventTypesData)
        setEvents(eventsData)
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
      const res = await fetch(`/api/events?id=${deleteId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete item")
      setEvents(events.filter(event => event.id !== deleteId))
      setDeleteDialogOpen(false)
      setDeleteId(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete item")
    }
  }

  const handleEventFilterChange = (eventTypeId: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventTypeId) ? prev.filter((id) => id !== eventTypeId) : [...prev, eventTypeId]
    )
  }

  const filteredEvents = events.filter(event => {
    if (selectedEventTypes.length === 0) return true
    return selectedEventTypes.includes(event.eventTypeId)
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Events</h2>
        <div className="flex gap-2">
          <Button
            className="flex items-center gap-1"
            onClick={() => router.push(`/${spaceId}/admin/events/create`)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Event</span>
          </Button>

          <Button
            className="flex items-center gap-1"
            onClick={() => setEventFilterModalOpen(true)} // Toggle filter visibility
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </div>
      <ul>
        {filteredEvents.map(event => (
          <li key={event.id} className="flex justify-between items-center border-b py-2">
            <div>
              <p className="font-bold">{event.name}</p>
              <p className="text-sm text-gray-500">{event.startDate} - {event.endDate}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                title="Info"
                onClick={() => router.push(`/${spaceId}/admin/events/${event.id}`)}
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                title="Edit"
                onClick={() => router.push(`/${spaceId}/admin/events/${event.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
                title="Delete"
                onClick={() => { setDeleteId(event.id); setDeleteDialogOpen(true) }}
              // disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Event Filter Modal */}
      <Dialog open={eventFilterModalOpen} onOpenChange={setEventFilterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Events by Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedEventTypes.length === 0}
                onCheckedChange={(checked) =>
                  setSelectedEventTypes(checked ? [] : eventTypes.map(et => et.id))
                }
              />
              <span>Select All</span>
            </div>
            {eventTypes.map((eventType) => (
              <div key={eventType.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedEventTypes.includes(eventType.id)}
                  onCheckedChange={() => handleEventFilterChange(eventType.id)}
                />
                <span>{eventType.name}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventFilterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEventFilterModalOpen(false)}>Apply Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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