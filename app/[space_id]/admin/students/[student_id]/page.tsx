"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { EventType, Event, EventStudent, Student, User, Group } from "@/lib/db/schema"
import { AttendanceTab, OtherInfoTab } from "@/components/student-tabs";

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
  const [groups, setGroups] = useState<Group[]>([])
  const [showAddMissingDialog, setShowAddMissingDialog] = useState(false);
  const [newMissing, setNewMissing] = useState({ persons: "", notes: "", type: "" });


  useEffect(() => {
    async function fetchStudentDetails() {
      try {
        setLoading(true)
        // const  = await 

        const [studentRes, balanceRes, transactionsRes, eventTypesRes, eventsRes, attendanceRes, groupsRes, missingsRes] = await Promise.all([
          fetch(`/api/students?spaceId=${spaceId}&studentId=${studentId}`),
          fetch(`/api/studentAccount?spaceId=${spaceId}&studentId=${studentId}&handler=balance`),
          fetch(`/api/studentAccount?spaceId=${spaceId}&studentId=${studentId}&handler=transactions`),
          fetch(`/api/types?spaceId=${spaceId}`),
          fetch(`/api/events?spaceId=${spaceId}`),
          fetch(`/api/eventAttendance?spaceId=${spaceId}&studentId=${studentId}&handler=student`),
          fetch(`/api/groups?spaceId=${spaceId}`),
          fetch(`/api/studentMissings?spaceId=${spaceId}&studentId=${studentId}`),
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
        const groupsData = await groupsRes.json()
        const missingsData = await missingsRes.json();

        setStudent(studentData)
        setBalance(balanceData.balance)
        setTransactions(transactionsData)
        setGroups(groupsData)
        setMissings(missingsData);

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

  const getGroupName = (id: string | null) => {
    if (!id) return null
    return groups.find(group => group.id === id)?.name ?? null
  }
  
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
        <TabsList className="w-full">
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
            <p>Group: {getGroupName(student?.groupId ?? null) || 'N/A'}</p>
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
