import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')
        const studentId = searchParams.get('studentId')

        if (!spaceId) {
            return Response.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        let query = supabase.from('students').select('*').eq('space_id', spaceId)

        // If studentId is provided, filter by studentId
        if (studentId) {
            query = query.eq('id', studentId)
        }

        const { data, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error fetching students', error }, { status: 500 })
        }

        const mappedData = (data ?? []).map((student: any) => ({
            id: student.id,
            name: student.name,
            dob: student.dob,
            imagePath: student.image_path,
            embedding: student.embedding,
            gender: student.gender,
            groupId: student.group_id,
            mentorId: student.mentor_id,
            // spaceId: student.space_id,
        }))
        // Optionally remove space_id property:
        // mappedData.forEach((s: any) => { delete s.space_id })

        return Response.json(studentId ? mappedData[0] : mappedData)
    } catch (err) {
        console.error("Unexpected error in GET /api/students:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, dob, gender, imagePath, embedding, groupId, mentorId, spaceId } = body

        if (!name || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('students')
            .insert([{
                'name': name,
                'gender': gender,
                'dob': dob,
                'image_path': imagePath,
                'embedding': embedding,
                'group_id': groupId,
                'mentor_id': mentorId,
                'space_id': spaceId, // Include space_id
            }])

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error creating student', error }, { status: 500 })
        }

        return Response.json({ message: 'Student created successfully' }, { status: 201 })
    } catch (err) {
        console.error("Unexpected error in POST /api/students:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, dob, gender, imagePath, embedding, groupId, mentorId, spaceId } = body

        if (!id || !name || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('students')
            .update({
                'name': name,
                'dob': dob,
                'gender': gender,
                'image_path': imagePath,
                'embedding': embedding,
                'group_id': groupId,
                'mentor_id': mentorId,
                'space_id': spaceId,
            })
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error updating student', error }, { status: 500 })
        }

        return Response.json({ message: 'Student updated successfully' })
    } catch (err) {
        console.error("Unexpected error in PUT /api/students:", err)
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
            .from('students')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error deleting student', error }, { status: 500 })
        }

        return Response.json({ message: 'Student deleted successfully' })
    } catch (err) {
        console.error("Unexpected error in DELETE /api/students:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}