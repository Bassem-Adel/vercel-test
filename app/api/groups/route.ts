import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')
        const handler = searchParams.get('handler')

        if (!spaceId) {
            return Response.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        if (handler === 'points') {
            const { data, error } = await supabase
                .rpc('get_groups_with_points', { 'p_space_id': spaceId })

            if (error) {
                console.error("Supabase error:", error)
                return Response.json({ message: 'Error fetching group points', error }, { status: 500 })
            }

            const mappedData = (data ?? []).map((point: any) => ({
                id: point.group_id,
                name: point.group_name,
                totalPoints: point.total_points,
            }))

            return Response.json(mappedData)
        }

        const { data, error } = await supabase
            .from('student_group')
            .select('*')
            .eq('space_id', spaceId)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error fetching groups', error }, { status: 500 })
        }

        // Map space_id to spaceId for consistency
        const mappedData = (data ?? []).map((group: any) => ({
            id: group.id,
            name: group.group_name,
            parentId: group.parent_group,
            spaceId: group.space_id,
        }))
        // mappedData.forEach((g: any) => { delete g.space_id })

        return Response.json(mappedData)
    } catch (err) {
        console.error("Unexpected error in GET /api/groups:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, spaceId } = body

        if (!id || !name || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('groups')
            .insert([{ id, name, spaceId }])

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error creating group', error }, { status: 500 })
        }

        return Response.json({ message: 'Group created successfully' }, { status: 201 })
    } catch (err) {
        console.error("Unexpected error in POST /api/groups:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, spaceId } = body

        if (!id || !name || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('groups')
            .update({ name, spaceId })
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error updating group', error }, { status: 500 })
        }

        return Response.json({ message: 'Group updated successfully' })
    } catch (err) {
        console.error("Unexpected error in PUT /api/groups:", err)
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
            .from('groups')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error deleting group', error }, { status: 500 })
        }

        return Response.json({ message: 'Group deleted successfully' })
    } catch (err) {
        console.error("Unexpected error in DELETE /api/groups:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}