import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')
        const handler = searchParams.get('handler') ?? 'transactions' // Default to 'transactions' if not specified

        if (!spaceId) {
            return NextResponse.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        if (handler === 'balance') {
            const studentId = searchParams.get('studentId')
            const { data, error } = await supabase.rpc('get_student_total_points', {
                'p_student_id': studentId,
            })

            if (error) {
                console.error("Supabase error:", error)
                return NextResponse.json({ message: 'Error fetching group points', error }, { status: 500 })
            }
            
            const mappedData = (data ?? []).map((point: any) => ({
                student_id: point.student_id,
                balance: point.total_points,
            }))

            return NextResponse.json(studentId ? mappedData[0] : mappedData)
        }
        else if (handler === 'transactions') {
            const studentId = searchParams.get('studentId')
            const { data, error } = await supabase
                .from('student_transaction')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at')

            if (error) {
                console.error("Supabase error:", error)
                return NextResponse.json({ message: 'Error fetching studentAccount', error }, { status: 500 })
            }

            const mappedData = (data ?? []).map((transaction: any) => ({
                comment: transaction.comment,
                points: transaction.points,
                student_id: transaction.student_id,
                event_id: transaction.event_id,
                profile_id: transaction.profile_id,
                created_at: transaction.created_at,
            }))

            return NextResponse.json(mappedData)
        }
    } catch (err) {
        console.error("Unexpected error in GET /api/studentAccount:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const handler = searchParams.get('handler') ?? 'transactions' // Default to 'transactions' if not specified
        
        if (handler === 'transactions') {
            const body = await request.json()
            const { studentId, points, comment } = body

            if (!studentId || !points) {
                return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
            }
            var currentUser = await supabase.auth.getUser()
            const { error } = await supabase.from('student_transaction').insert({
                'points': points,
                'comment': comment?.isEmpty ?? true ? null : comment,
                'student_id': studentId,
                'profile_id': currentUser?.data.user?.id, // Assuming you want to use the authenticated user's ID
            })

            if (error) {
                console.error("Supabase error:", error)
                return NextResponse.json({ message: 'Error creating transaction', error }, { status: 500 })
            }

            return NextResponse.json({ message: 'Transaction created successfully' }, { status: 201 })
        }

        return NextResponse.json({ message: 'Missing Handler' }, { status: 400 })
    } catch (err) {
        console.error("Unexpected error in POST /api/studentAccount:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, spaceId } = body

        if (!id || !name || !spaceId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('student_transaction')
            .update({ name, spaceId })
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ message: 'Error updating transaction', error }, { status: 500 })
        }

        return NextResponse.json({ message: 'Transaction updated successfully' })
    } catch (err) {
        console.error("Unexpected error in PUT /api/studentAccount:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ message: 'Missing id' }, { status: 400 })
        }

        const { error } = await supabase
            .from('student_transaction')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ message: 'Error deleting transaction', error }, { status: 500 })
        }

        return NextResponse.json({ message: 'Transaction deleted successfully' })
    } catch (err) {
        console.error("Unexpected error in DELETE /api/studentAccount:", err)
        return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}