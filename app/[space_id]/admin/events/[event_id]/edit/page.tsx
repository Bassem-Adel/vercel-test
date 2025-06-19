"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import type { Event, EventType } from "@/lib/db/schema"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const spaceId = params?.space_id as string
  const eventId = params?.event_id as string

  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Event>({
    id: eventId,
    name: "",
    eventTypeId: "",
    spaceId: spaceId,
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchEventTypes()
    fetchEvent()
  }, [spaceId, eventId])

  const fetchEventTypes = async () => {
    try {
      const response = await fetch(`/api/types?spaceId=${spaceId}`)
      if (!response.ok) throw new Error("Failed to fetch event types")
      const data = await response.json()
      setEventTypes(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchEvent = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/events?spaceId=${spaceId}&eventId=${eventId}`)
      if (!response.ok) throw new Error("Failed to fetch event")
      const data = await response.json()
      
      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return ""
        return new Date(dateString).toISOString().split('T')[0]
      }

      setFormData({
        id: data.id,
        name: data.name || "",
        eventTypeId: data.event_type_id || data.eventTypeId || "",
        spaceId: data.space_id || data.spaceId || spaceId,
        startDate: formatDateForInput(data.start_date || data.startDate),
        endDate: formatDateForInput(data.end_date || data.endDate),
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const eventData = {
        ...formData,
        spaceId,
      }

      const response = await fetch(`/api/events?eventId=${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update event")
      }

      router.push(`/${spaceId}/admin/events`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events?eventId=${eventId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete event")
      }

      router.push(`/${spaceId}/admin/events`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">Loading event...</div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <p className="text-gray-600">Update event details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Type *</Label>
                <Select
                  value={formData.eventTypeId}
                  onValueChange={(value) => handleInputChange("eventTypeId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={e => {
                    handleInputChange("startDate", e.target.value)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={e => {
                    handleInputChange("endDate", e.target.value)
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Event"}
              </Button>
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Event"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}