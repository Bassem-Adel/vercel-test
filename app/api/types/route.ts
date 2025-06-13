import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')
        const eventTypeId = searchParams.get('eventTypeId')

        if (!spaceId) {
            return Response.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        let query = supabase.from('event_type').select('*').eq('space_id', spaceId)

        // If eventTypeId is provided, filter by eventTypeId
        if (eventTypeId) {
            query = query.eq('id', eventTypeId)
        }

        const { data, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error fetching event types', error }, { status: 500 })
        }

        const mappedData = (data ?? []).map((eventType: any) => ({
            id: eventType.id,
            name: eventType.name,
            icon: eventType.icon,
            attendancePoints: eventType.attendance_points,
            acceptsActivities: eventType.accepts_activities,
            extraPoints: eventType.extra_points,
            groupId: eventType.group_id,
            // spaceId: student.space_id,
        }))
        return Response.json(eventTypeId ? mappedData[0] : mappedData)
    } catch (err) {
        console.error("Unexpected error in GET /api/types:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { name, icon, attendancePoints, acceptsActivities, extraPoints, spaceId } = body

        if (!name || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('event_type')
            .insert([{ name, icon, attendance_points: attendancePoints, accepts_activities: acceptsActivities, extra_points: extraPoints, space_id: spaceId }])

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error creating event type', error }, { status: 500 })
        }

        return Response.json({ message: 'Event type created successfully' }, { status: 201 })
    } catch (err) {
        console.error("Unexpected error in POST /api/types:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, icon, attendancePoints, acceptsActivities, extraPoints, spaceId } = body

        if (!id || !name || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('event_type')
            .update({ name, icon, attendance_points: attendancePoints, accepts_activities: acceptsActivities, extra_points: extraPoints, space_id: spaceId })
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error updating event type', error }, { status: 500 })
        }

        return Response.json({ message: 'Event type updated successfully' })
    } catch (err) {
        console.error("Unexpected error in PUT /api/types:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return Response.json({ message: 'Missing id' }, { status: 400 })
        }

        const { error } = await supabase
            .from('event_type')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error deleting event type', error }, { status: 500 })
        }

        return Response.json({ message: 'Event type deleted successfully' })
    } catch (err) {
        console.error("Unexpected error in DELETE /api/types:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}