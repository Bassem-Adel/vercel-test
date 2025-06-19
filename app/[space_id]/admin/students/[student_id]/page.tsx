"use client";
import { useMemo } from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { EventType, Event, EventStudent, Student, User } from "@/lib/db/schema"

export default function StudentDetailsPage() {
  const params = useParams();
  const studentId = params?.student_id as string;
  const spaceId = params?.space_id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("info");
  const [missings, setMissings] = useState<any[]>([]);
  const [showAddMissingDialog, setShowAddMissingDialog] = useState(false);
  const [newMissing, setNewMissing] = useState({ persons: "", notes: "", type: "" });


  useEffect(() => {
    async function fetchStudentDetails() {
      try {
        setLoading(true)
        // const missingsRes = await fetch(`/api/students/${studentId}/missings`);

        const [studentRes, balanceRes, transactionsRes, eventTypesRes, eventsRes, attendanceRes] = await Promise.all([
          fetch(`/api/students?spaceId=${spaceId}&studentId=${studentId}`),
          fetch(`/api/studentAccount?spaceId=${spaceId}&studentId=${studentId}&handler=balance`),
          fetch(`/api/studentAccount?spaceId=${spaceId}&studentId=${studentId}&handler=transactions`),
          fetch(`/api/types?spaceId=${spaceId}`),
          fetch(`/api/events?spaceId=${spaceId}`),
          fetch(`/api/eventAttendance?spaceId=${spaceId}&studentId=${studentId}&handler=student`),
        ]);
        if (!eventTypesRes.ok || !eventsRes.ok || !attendanceRes.ok) {
          throw new Error("Failed to fetch attendance data");
        }

        const eventTypes: EventType[] = await eventTypesRes.json();
        const events: Event[] = await eventsRes.json();
        const attendance: EventStudent[] = await attendanceRes.json();

        setEventTypes(eventTypes)
        setEvents(events)
        setAttendance(attendance)
        // if (!missingsRes.ok) {
        if (!studentRes.ok || !balanceRes.ok || !transactionsRes.ok || false) {
          throw new Error("Failed to fetch student details")
        }

        const studentData = await studentRes.json()
        const balanceData = await balanceRes.json()
        const transactionsData = await transactionsRes.json()
        // const missingsData = await missingsRes.json();

        setStudent(studentData)
        setBalance(balanceData.balance)
        setTransactions(transactionsData)
        // setMissings(missingsData);

      } catch (err: any) {
        setError(err.message || "Failed to load student details")
      } finally {
        setLoading(false)
      }
    }

    fetchStudentDetails()
  }, [studentId])

  const handleAddMissing = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/missings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMissing),
      });

      if (!response.ok) {
        throw new Error("Failed to add missing record");
      }

      const addedMissing = await response.json();
      setMissings((prev) => [...prev, addedMissing]);
      setShowAddMissingDialog(false);
      setNewMissing({ persons: "", notes: "", type: "" });
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const updateAttendance = async (eventId: string, isPresent: boolean) => {
    try {
      const response = await fetch(`/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, eventId, isPresent }),
      });

      if (!response.ok) {
        throw new Error("Failed to update attendance");
      }

      const updatedAttendance = await response.json();
      setAttendance((prev) =>
        prev.map((att) =>
          att.eventId === eventId ? { ...att, isPresent } : att
        )
      );
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const getAnalytics = () => {
    // Calculate typesCount and attendedCount
    const typesCount: Record<string, number> = {};
    const attendedCount: Record<string, number> = {};
    try {

      for (const event of events) {
        if (event.eventTypeId) {
          typesCount[event.eventTypeId] = (typesCount[event.eventTypeId] || 0) + 1;

          const attended = attendance.find((a) => a.eventId === event.id);
          if (attended) {
            attendedCount[event.eventTypeId] = (attendedCount[event.eventTypeId] || 0) + (attended.isPresent ? 1 : 0);
          }
        }
      }

      return { typesCount, attendedCount };
    } catch (err: any) {
      console.error(err.message);
      return { typesCount, attendedCount };
    }
  };

  const getAttendance = async () => {
    return { events, attendance, eventTypes };
  };

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  transactions.sort((b, a) => {
    if (!a.created_at) return -1;
    if (!b.created_at) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {student?.imagePath ? (
          <Avatar className="h-20 w-20">
            <img
              src={student.imagePath || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
              alt={student.name}
              className="h-20 w-20 rounded-full object-cover mb-4 border"
            />
          </Avatar>
        ) : (
          <Avatar className="h-20 w-20">
            <span className="text-xl font-bold">{student?.name?.charAt(0)}</span>
          </Avatar>
        )}
        <div>
          <h1 className="text-2xl font-bold">{student?.name || "N/A"}</h1>
          <p className="text-lg">Balance: {balance}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="missings">Missings</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <div>
            <h2 className="text-xl font-bold mb-4">Additional Info</h2>
            <p>Gender: {student?.gender || "N/A"}</p>
            <p>Date of Birth: {student?.dob || "N/A"}</p>
            <p>Group: {student?.groupId || "N/A"}</p>
          </div>
          <OtherInfoTab eventTypes={eventTypes} getAnalytics={getAnalytics} />
        </TabsContent>

        {/* Missings Tab */}
        <TabsContent value="missings">
          <div>
            <h2 className="text-xl font-bold mb-4">Missings</h2>
            <Button onClick={() => setShowAddMissingDialog(true)}>Add Missing</Button>
            <ul>
              {missings.map((missing, index) => (
                <li key={index}>
                  <p>Type: {missing.type}</p>
                  <p>Persons: {missing.persons}</p>
                  <p>Notes: {missing.notes}</p>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div>
            {/* <h2 className="text-xl font-bold mb-4">Attendance</h2> */}
            <AttendanceTab studentId={studentId}
              getAttendance={getAttendance}
              updateAttendance={updateAttendance} />
          </div>
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points">
          <div>
            <h2 className="text-xl font-bold mb-4">Points</h2>
            <ul className="space-y-4">
              {transactions.map((transaction, index) => {
                const name = transaction.profile_id
                  ? users?.find((user) => user.id === transaction.profile_id)?.name
                  : null;
                const transactionPoints = transaction.points || 0;
                const transactionDate = transaction.created_at
                  ? new Date(transaction.created_at)
                  : null;
                const event = events?.find((e) => e.id === transaction.event_id);
                let title = "No comment included";

                if (event) {
                  const currentAttendance = attendance?.find((a) => a.eventId === event.id);
                  if (currentAttendance) {
                    title = `${event.name} (${currentAttendance.points})`;
                  }
                } else {
                  title = transaction.comment || "No comment included";
                }

                return (
                  <li
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg shadow-sm"
                  >
                    <div>
                      <h3 className="text-lg font-bold">{title}</h3>
                      <p className="text-sm text-gray-500">
                        {transactionDate
                          ? `${transactionDate.toLocaleDateString()} ${transactionDate
                            .getHours()
                            .toString()
                            .padStart(2, "0")}:${transactionDate
                              .getMinutes()
                              .toString()
                              .padStart(2, "0")}${name ? ` - ${name}` : ""}`
                          : "No date available"}
                      </p>
                    </div>
                    <span
                      className={`text-lg font-bold ${transactionPoints > 0 ? "text-green-500" : "text-red-500"
                        }`}
                    >
                      {transactionPoints}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </TabsContent>

        {/* Ideas Tab */}
        <TabsContent value="ideas">
          <div>
            <h2 className="text-xl font-bold mb-4">Ideas</h2>
            <p>New ideas are welcomed!</p>
          </div>
        </TabsContent>
      </Tabs>


      {/* Add Missing Dialog */}
      <Dialog open={showAddMissingDialog} onOpenChange={setShowAddMissingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Missing</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Persons"
              value={newMissing.persons}
              onChange={(e) => setNewMissing((prev) => ({ ...prev, persons: e.target.value }))}
            />
            <Input
              placeholder="Notes"
              value={newMissing.notes}
              onChange={(e) => setNewMissing((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <Input
              placeholder="Type"
              value={newMissing.type}
              onChange={(e) => setNewMissing((prev) => ({ ...prev, type: e.target.value }))}
            />
            <Button onClick={handleAddMissing}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

type OtherInfoTabProps = {
  eventTypes: EventType[];
  getAnalytics: () => {
    typesCount: Record<string, number> | null;
    attendedCount: Record<string, number> | null;
  };
};

export function OtherInfoTab({ eventTypes, getAnalytics }: OtherInfoTabProps) {
  const eventTypeMap = useMemo(() => {
    const map: Record<string, EventType> = {};
    eventTypes.forEach((eventType) => {
      map[eventType.id] = eventType;
    });
    return map;
  }, [eventTypes]);
  const { typesCount, attendedCount } = getAnalytics();
  if (!typesCount) {
    return <div>No data available</div>;
  }

  return (
    <ul className="space-y-4">
      {Object.entries(typesCount).map(([typeId, totalCount]) => {
        const eventType = eventTypeMap[typeId];
        const attended = attendedCount?.[typeId] || 0;
        const percentage = ((attended / totalCount) * 100).toFixed(2);

        return (
          <li key={typeId} className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <span className="text-2xl">
                {eventType?.icon ? (
                  <i className={`icon-${eventType.icon}`} />
                ) : (
                  <i className="icon-default" />
                )}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold">{eventType?.name || typeId}</h3>
              <p className="text-sm text-gray-500">
                ({attended} / {totalCount}) {percentage}%
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type AttendanceTabProps = {
  studentId: string;
  getAttendance: (studentId: string) => Promise<{
    events: Event[];
    attendance: EventStudent[];
    eventTypes: EventType[];
  }>;
  updateAttendance: (eventId: string, isPresent: boolean) => Promise<void>;
};

export function AttendanceTab({
  studentId,
  getAttendance,
  updateAttendance,
}: AttendanceTabProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<EventStudent[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [enableEditing, setEnableEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        setLoading(true);
        const { events, attendance, eventTypes } = await getAttendance(studentId);
        setEvents(events);
        setAttendance(attendance);
        setEventTypes(eventTypes);
      } catch (err: any) {
        setError(err.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [studentId]);

  const filteredEvents = events.filter((event) => {
    if (selectedEventTypes.length === 0) return true;
    return selectedEventTypes.includes(event.eventTypeId || "");
  });

  filteredEvents.sort((b, a) => {
    if (!a.startDate) return -1;
    if (!b.startDate) return 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const handleUpdateAttendance = async (eventId: string, isPresent: boolean) => {
    try {
      await updateAttendance(eventId, isPresent);
      setAttendance((prev) =>
        prev.map((att) =>
          att.eventId === eventId ? { ...att, isPresent } : att
        )
      );
    } catch (err: any) {
      console.error("Failed to update attendance:", err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Events</h2>
        <div className="flex gap-2">
          <Button onClick={() => setEnableEditing((prev) => !prev)}>
            {enableEditing ? "Disable Editing" : "Enable Editing"}
          </Button>
          <Button onClick={() => console.log("Show filter modal")}>
            Filter
          </Button>
        </div>
      </div>

      {/* Event List */}
      <ul className="space-y-4">
        {filteredEvents.map((event) => {
          const eventType = eventTypes.find((type) => type.id === event.eventTypeId);
          const isPresent =
            attendance.find((att) => att.eventId === event.id)?.isPresent || false;
          console.log("Event:", event, "isPresent:", isPresent);
          return (
            <li key={event.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">
                  {eventType?.icon ? (
                    <i className={`icon-${eventType.icon}`} />
                  ) : (
                    <i className="icon-default" />
                  )}
                </span>
                <span className="text-lg font-bold">{event.name}</span>
              </div>
              {enableEditing ? (
                <Switch
                  disabled={true} // Disable switch for now, can be enabled later
                  checked={isPresent}
                  onCheckedChange={(value) => handleUpdateAttendance(event.id, value)}
                />
              ) : isPresent ? (
                <span className="text-green-500">Present</span>
              ) : (
                <span className="text-red-500">Absent</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}