import { useState, useEffect } from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { EventType, Event, EventStudent } from "@/lib/db/schema"


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