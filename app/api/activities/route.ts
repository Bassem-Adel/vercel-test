import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const eventId = searchParams.get('eventId')
    const activityId = searchParams.get('activityId')

    if (!spaceId) {
      return NextResponse.json({ message: 'Space ID is required' }, { status: 400 })
    }

    // Get single activity
    if (activityId) {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          name,
          description,
          event_id,
          space_id,
          created_at,
          activity_group (
            group_id,
            points
          )
        `)
        .eq('id', activityId)
        .eq('space_id', spaceId)
        .single()

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ message: 'Error fetching activity', error }, { status: 500 })
      }

      return NextResponse.json(data)
    }

        //     .select(`
        //   id,
        //   name,
        //   description,
        //   event_id,
        //   space_id,
        //   created_at,
        //   activity_group (
        //     group_id,
        //     points,
        //     description,
        //     created_at
        //   )
        // `)
    // Get activities with points for specific event
    if (eventId) {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          name,
          description,
          event_id,
          space_id,
          created_at,
          activity_group (
            group_id,
            points
          )
        `)
        .eq('event_id', eventId)
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ message: 'Error fetching activities', error }, { status: 500 })
      }

      // Transform data to match the original structure
      const transformedData = data.map(activity => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        eventId: activity.event_id,
        spaceId: activity.space_id,
        createdAt: activity.created_at,
        points: activity.activity_group.map((ag: any) => ({
          activityId: activity.id,
          groupId: ag.group_id,
          points: ag.points,
          comment: ag.comment,
          createdAt: ag.created_at
        }))
      }))

      return NextResponse.json(transformedData)
    }

    // Get all activities for space
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        name,
        description,
        event_id,
        space_id,
        created_at,
        events (
          name,
          start_date
        )
      `)
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ message: 'Error fetching activities', error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Unexpected error in GET /api/activities:", err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, description, eventId, spaceId } = body

    if (!name || !eventId || !spaceId) {
      return NextResponse.json({ 
        message: 'Name, Event ID, and Space ID are required' 
      }, { status: 400 })
    }

    // Verify user has access to this space
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify event belongs to the space
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('space_id')
      .eq('id', eventId)
      .eq('space_id', spaceId)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json({ 
        message: 'Event not found or does not belong to this space' 
      }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        event_id: eventId,
        space_id: spaceId
      })
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ message: 'Error creating activity', error }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (err) {
    console.error("Unexpected error in POST /api/activities:", err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')
    const body = await request.json()
    const { name, description, spaceId } = body

    if (!activityId || !spaceId) {
      return NextResponse.json({ 
        message: 'Activity ID and Space ID are required' 
      }, { status: 400 })
    }

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('activities')
      .update({
        name: name?.trim(),
        description: description?.trim() || null
      })
      .eq('id', activityId)
      .eq('space_id', spaceId)
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ message: 'Error updating activity', error }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (err) {
    console.error("Unexpected error in PUT /api/activities:", err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')
    const spaceId = searchParams.get('spaceId')

    if (!activityId || !spaceId) {
      return NextResponse.json({ 
        message: 'Activity ID and Space ID are required' 
      }, { status: 400 })
    }

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('space_id', spaceId)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ message: 'Error deleting activity', error }, { status: 500 })
    }

    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (err) {
    console.error("Unexpected error in DELETE /api/activities:", err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}