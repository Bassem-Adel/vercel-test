import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')

        if (!spaceId) {
            return NextResponse.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        const studentId = searchParams.get('studentId')

        const { data, error } = await supabase.from('student_missing').select('*')
            .eq('student_id', studentId)
            .eq('space_id', spaceId)
        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ message: 'Error fetching studentI missings', error }, { status: 500 })
        }

        const mappedData = (data ?? []).map((missing: any) => ({
            id: missing.id,
            studentId: missing.student_id,
            persons: missing.persons,
            notes: missing.notes,
            date: missing.date,
            type: missing.type,
            spaceId: missing.space_id,
        }))

        return NextResponse.json(mappedData)

    } catch (err) {
        console.error("Unexpected error in GET /api/studentMissings:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const body = await request.json()
        const { studentId, persons, notes, date, type, spaceId } = body

        if (!studentId || !spaceId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
        }
        const { error } = await supabase.from('student_missing').insert({
            'student_id': studentId,
            'persons': persons,
            'notes': notes,
            'date': date,
            'type': type,
            'space_id': spaceId,
        })

        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ message: 'Error creating missing', error }, { status: 500 })
        }

        return NextResponse.json({ message: 'Missing created successfully' }, { status: 201 })

    } catch (err) {
        console.error("Unexpected error in POST /api/studentMissings:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}