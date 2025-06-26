import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')
        const eventId = searchParams.get('eventId')

        if (!spaceId) {
            return Response.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        let query = supabase.from('events').select('*').eq('space_id', spaceId)

        // If eventId is provided, filter by eventId
        if (eventId) {
            query = query.eq('id', eventId)
        }

        const { data, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error fetching events', error }, { status: 500 })
        }

        const mappedData = (data ?? []).map((event: any) => ({
            id: event.id,
            name: event.event_name,
            startDate: event.start_date,
            endDate: event.end_date,
            eventTypeId: event.event_type_id,
            // spaceId: event.space_id,
        }))
        // Optionally remove space_id property:
        // mappedData.forEach((s: any) => { delete s.space_id })

        return Response.json(eventId ? mappedData[0] : mappedData)
    } catch (err) {
        console.error("Unexpected error in GET /api/events:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { name, startDate, endDate, eventTypeId, spaceId } = body

        if (!name || !eventTypeId || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('events')
            .insert([{ 
                event_name: name, 
                start_date: startDate, 
                end_date: endDate, 
                event_type_id: eventTypeId, 
                space_id: spaceId 
            }])

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error creating event', error }, { status: 500 })
        }

        return Response.json({ message: 'Event created successfully' }, { status: 201 })
    } catch (err) {
        console.error("Unexpected error in POST /api/events:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, startDate, endDate, eventTypeId, spaceId } = body

        if (!id || !name || !eventTypeId || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('events')
            .update({ 
                event_name: name, 
                start_date: startDate, 
                end_date: endDate, 
                event_type_id: eventTypeId, 
                space_id: spaceId 
            })
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error updating event', error }, { status: 500 })
        }

        return Response.json({ message: 'Event updated successfully' })
    } catch (err) {
        console.error("Unexpected error in PUT /api/events:", err)
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
            .from('events')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error deleting event', error }, { status: 500 })
        }

        return Response.json({ message: 'Event deleted successfully' })
    } catch (err) {
        console.error("Unexpected error in DELETE /api/events:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}