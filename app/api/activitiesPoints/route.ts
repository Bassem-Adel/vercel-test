import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { groupId, activityId, points, comment, spaceId } = body

    if (!groupId || !activityId || points === undefined) {
      return NextResponse.json({ 
        message: 'Group ID, Activity ID, and points are required' 
      }, { status: 400 })
    }

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify activity belongs to user's space
    if (spaceId) {
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select('space_id')
        .eq('id', activityId)
        .eq('space_id', spaceId)
        .single()

      if (activityError || !activityData) {
        return NextResponse.json({ 
          message: 'Activity not found or access denied' 
        }, { status: 404 })
      }
    }

    // Use the RPC function to set activity points
    const { data, error } = await supabase.rpc('set_activity_group_points', {
      p_group_id: groupId,
      p_activity_id: activityId,
      p_points: parseInt(points),
      p_comment: comment || null,
      p_profile_id: user.id
    })

    if (error) {
      console.error("Supabase RPC error:", error)
      return NextResponse.json({ message: 'Error setting activity points', error }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Points updated successfully',
      data 
    })
  } catch (err) {
    console.error("Unexpected error in POST /api/activities/points:", err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')
    const groupId = searchParams.get('groupId')
    const spaceId = searchParams.get('spaceId')

    if (!spaceId) {
      return NextResponse.json({ message: 'Space ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('activity_group')
      .select(`
        *,
        activities!inner (
          name,
          space_id
        ),
        groups!inner (
          name
        )
      `)
      .eq('activities.space_id', spaceId)

    if (activityId) {
      query = query.eq('activity_id', activityId)
    }

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ message: 'Error fetching activity points', error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Unexpected error in GET /api/activities/points:", err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}