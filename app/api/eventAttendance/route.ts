import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')
        const handler = searchParams.get('handler')

        if (!spaceId) {
            return NextResponse.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        if (handler === 'student') {
            const studentId = searchParams.get('studentId')
            const { data, error } = await supabase.from('event_student')
                .select('event_id, points, is_present, description')
                .eq('student_id', studentId);

            if (error) {
                console.error("Supabase error:", error)
                return NextResponse.json({ message: 'Error fetching group points', error }, { status: 500 })
            }

            const mappedData = (data ?? []).map((attendnce: any) => ({
                points: attendnce.points,
                description: attendnce.description,
                isPresent: attendnce.is_present,
                eventId: attendnce.event_id,
                studentId: studentId
            }))

            return NextResponse.json(mappedData)
        }
        else if (handler === 'event') {
            const eventId = searchParams.get('eventId')
            const { data, error } = await supabase.from('event_student')
                .select('student_id, points, is_present, description')
                .eq('event_id', eventId)

            if (error) {
                console.error("Supabase error:", error)
                return NextResponse.json({ message: 'Error fetching eventAttendance', error }, { status: 500 })
            }

            const mappedData = (data ?? []).map((attendnce: any) => ({
                points: attendnce.points,
                description: attendnce.description,
                isPresent: attendnce.is_present,
                eventId: eventId,
                studentId: attendnce.student_id
            }))

            return NextResponse.json(mappedData)
        }
        else if (handler === 'eventType') {
            const spaceId = searchParams.get('spaceId')
            const eventTypeId = searchParams.get('eventTypeId')
            const { data, error } = await supabase.from('events')
                .select('event_type_id, event_student(*)')
                .eq('space_id', spaceId)
                .eq('event_type_id', eventTypeId);

            if (error) {
                console.error("Supabase error:", error)
                return NextResponse.json({ message: 'Error fetching eventAttendance', error }, { status: 500 })
            }

            const mappedData = (data ?? []).flatMap((event: any) =>
                (event.event_student || []).map((attendance: any) => ({
                    points: attendance.points,
                    description: attendance.description,
                    isPresent: attendance.is_present,
                    eventId: attendance.event_id,
                    studentId: attendance.student_id
                }))
            )

            return NextResponse.json(mappedData)
        }
        return NextResponse.json({ message: 'Missing Handler' }, { status: 400 })
    } catch (err) {
        console.error("Unexpected error in GET /api/eventAttendance:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { studentId, points, eventId, isPresent, description } = body

        if (!studentId || !eventId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
        }
        var currentUser = await supabase.auth.getUser()
        const { error } = await supabase
            .rpc('set_event_student_points', {
                'p_student_id': studentId,
                'p_event_id': eventId,
                'p_is_present': isPresent,
                'p_points': points,
                'p_description': description,
                'profile_id': currentUser?.data.user?.id, // Assuming you want to use the authenticated user's ID
            })

        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ message: 'Error creating transaction', error }, { status: 500 })
        }

        return NextResponse.json({ message: 'Transaction created successfully' }, { status: 201 })

    } catch (err) {
        console.error("Unexpected error in POST /api/eventAttendance:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}