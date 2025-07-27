"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Search, Camera } from "lucide-react"
import type { Event, EventStudent, Student, Group, EventType } from "@/lib/db/schema"
import { isDescendant } from "@/lib/utils"
import { StudentList } from "@/components/event/student-list"
import { ActivityList } from "@/components/event/activity-list"
import { ActivityItem, GroupItem } from "@/components/event/activity-list"


export default function EventAttendancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const spaceId = params?.space_id as string
  const initialEventId = params?.event_id as string

  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all")
  const [currentEventType, setCurrentEventType] = useState<EventType | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [attendance, setAttendance] = useState<Record<string, { isPresent: boolean, extraPoints: Record<string, number> }>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("students")

  // Face recognition states
  const [guessedStudents, setGuessedStudents] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      loadGroups(),
      loadEvents(),
      loadStudents()]).then(() => {
        setSelectedEventId(selectedEventId)
      })
  }, [spaceId])

  useEffect(() => {
    if (events.length > 0 && selectedEventId) {
      selectEvent(selectedEventId)
    }
  }, [events, selectedEventId])

  const loadGroups = async () => {
    try {
      const response = await fetch(`/api/groups?spaceId=${spaceId}`)
      if (!response.ok) throw new Error("Failed to fetch groups")
      const data = await response.json()
      setGroups(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch(`/api/events?spaceId=${spaceId}`)
      if (!response.ok) throw new Error("Failed to fetch events")
      const data = await response.json()
      setEvents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const response = await fetch(`/api/students?spaceId=${spaceId}`)
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      setStudents(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const selectEvent = async (eventId: string) => {
    if (!eventId) return
    try {
      // Fetch attendance data for the event
      const attendanceResponse = await fetch(`/api/eventAttendance?spaceId=${spaceId}&handler=event&eventId=${eventId}`)
      if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance")
      const attendanceData = await attendanceResponse.json()

      // Update attendance status
      const newAttendance: Record<string, { isPresent: boolean, extraPoints: Record<string, number> }> = {}
      attendanceData.forEach((record: EventStudent) => {

        newAttendance[record.studentId] = {
          isPresent: record.isPresent,
          extraPoints: {}
        }
        if (record.description) {
          try {
            newAttendance[record.studentId].extraPoints = JSON.parse(record.description)
          } catch (e) {
            // Handle JSON parse error
          }
        }

      })
      setAttendance(newAttendance)

      // Fetch event type details
      const selectedEvent = events.find(event => event.id === eventId)
      console.log("Fetching event type for eventTypeId:", selectedEvent?.eventTypeId)
      console.log("current eventTypeId:", currentEventType?.id)
      if (selectedEvent?.eventTypeId) {
        if (currentEventType?.id !== selectedEvent.eventTypeId) {
          const eventTypeResponse = await fetch(`/api/types?spaceId=${spaceId}&eventTypeId=${selectedEvent.eventTypeId}`)
          if (eventTypeResponse.ok) {
            const eventTypeData = await eventTypeResponse.json()
            setCurrentEventType(eventTypeData)
          }
        }
      }

      // Fetch activities for the event
      await fetchActivitiesAndGroups(eventId)

      setSelectedEventId(eventId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchActivitiesAndGroups = async (eventId: string) => {
    try {
      const response = await fetch(`/api/activities?spaceId=${spaceId}&eventId=${eventId}`)
      if (!response.ok) throw new Error("Failed to fetch activities")
      const data = await response.json()

      const activitiesWithGroups = data.map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        groupPoints: groups.map(group => ({
          id: group.id,
          name: group.name,
          points: activity.points?.find((p: any) => p.groupId === group.id)?.points?.toString() || "0"
        }))
      }))

      setActivities(activitiesWithGroups)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateAttendance = async (studentId: string, isPresent: boolean, extraPoint: Record<string, number>) => {
    console.log("Updating attendance for student:", studentId, "isPresent:", isPresent, "extraPoint:", extraPoint)
    console.log("selectedEventId:", selectedEventId, "currentEventType:", currentEventType)
    if (!selectedEventId) return

    let extraPointsTotal = isPresent ? (currentEventType?.attendancePoints || 0) : 0

    // Calculate extra points
    if (currentEventType?.extraPoints && extraPoint && extraPoint[studentId]) {
      Object.entries(extraPoint[studentId]).forEach(([key, value]) => {
        const extraPoint = currentEventType.extraPoints?.find((e: any) => e.name === key)
        extraPointsTotal += value * (extraPoint?.points || 0)
      })
    }

    try {
      const response = await fetch("/api/eventAttendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          eventId: selectedEventId,
          isPresent,
          points: extraPointsTotal,
          description: attendance[studentId]?.extraPoints ? JSON.stringify(attendance[studentId].extraPoints) : null
        })
      })

      if (!response.ok) throw new Error("Failed to update attendance")

      setAttendance(prev => ({ ...prev, [studentId]: { isPresent, extraPoints: extraPoint } }))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveActivityPoints = async (activityId: string, groupId: string, points: string) => {
    try {
      const response = await fetch("/api/activitiesPoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          groupId,
          points: parseInt(points) || 0
        })
      })

      if (!response.ok) throw new Error("Failed to save points")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addActivity = async (name: string, description?: string) => {
    if (!selectedEventId) return

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          eventId: selectedEventId,
          spaceId
        })
      })

      if (!response.ok) throw new Error("Failed to add activity")

      await fetchActivitiesAndGroups(selectedEventId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getGroupName = (id: string | null) => {
    if (!id) return null
    return groups.find(group => group.id === id)?.name ?? null
  }

  const filterStudents = () => {
    let filteredStudents = students.filter(student => {
      const matchesGroup = !selectedGroupId || (selectedGroupId === "all" || (student.groupId === selectedGroupId) || isDescendant(groups, selectedGroupId, student.groupId))
      const matchesSearch = !searchQuery || student.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesGroup && matchesSearch
    })

    return filteredStudents.sort((a, b) => a.name.localeCompare(b.name))
  }

  const filterGroups = (groupPoints: GroupItem[]) => {
    return groupPoints.filter(group =>
      !selectedGroupId || (selectedGroupId === "all" || (group.id === selectedGroupId) || isDescendant(groups, selectedGroupId, group.id))
    )
  }

  const nextGuess = () => {
    if (!guessedStudents.length) {
      setCurrentGuess(null)
      return
    }

    if (currentGuess === null) {
      setCurrentGuess(0)
    } else {
      setCurrentGuess((currentGuess + 1) % guessedStudents.length)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Event Attendance</h1>

        {/* Event and Group Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGroupId || ""} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <div className="space-y-4">
            <Input
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Card>
              <CardContent className="p-0">
                {/* <StudentList students={students} filter={searchQuery} selectedGroupId={selectedGroupId} attendance={attendance} updateAttendance={updateAttendance} /> */}
                {filterStudents().map(student =>
                (
                  <StudentList key={student.id} student={student}
                    getGroupName={getGroupName}
                    currentEventType={currentEventType!}
                    event={events.find(e => e.id === selectedEventId)!}
                    attendance={attendance[student.id] ?? {
                      isPresent: false,
                      extraPoints: {}
                    }}
                    onAttendanceChange={(isPresent, extraPoints) => updateAttendance(student.id, isPresent, extraPoints)} />
                )
                )}
              </CardContent>
            </Card>
          </div>
          {/* <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 mx-auto text-gray-400" />
                  <p className="text-gray-500">Face recognition camera would go here</p>
                  <Button onClick={nextGuess} disabled={!guessedStudents.length}>
                    Next Guess
                  </Button>
                </div>
              </CardContent>
            </Card>

            {currentGuess !== null && guessedStudents[currentGuess] && (
              <Card>
                <CardContent className="p-0">
                  <StudentList student={students.find(s => s.id === guessedStudents[currentGuess])!}
                    getGroupName={getGroupName}
                    currentEventType={currentEventType!}
                    event={events.find(e => e.id === selectedEventId)!}
                    attendance={attendance[guessedStudents[currentGuess]] ?? {
                      isPresent: false,
                      extraPoints: {}
                    }}
                    onAttendanceChange={(isPresent, extraPoints) => updateAttendance(guessedStudents[currentGuess], isPresent, extraPoints)} />
                </CardContent>
              </Card>
            )}
          </div> */}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <ActivityList
            activities={activities}
            setActivities={setActivities}
            addActivity={addActivity}
            onSave={saveActivityPoints}
            filterGroups={filterGroups}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}