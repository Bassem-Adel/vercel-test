import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const spaceId = searchParams.get('spaceId')

        if (!spaceId) {
            return Response.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        let query = supabase.from('profile_space')
            .select('profiles(id, full_name, email, avatar_url)')
            .eq('space_id', spaceId)

        const { data, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error fetching users', error }, { status: 500 })
        }
        const mappedData = (data ?? []).map((user: any) => ({
            id: user.profiles.id,
            name: user.profiles.full_name,
            email: user.profiles.email,
            role: 'admin',
            imagePath: user.profiles.avatar_url,
            // spaceId: user.space_id,
        }))
        // Optionally remove space_id property:
        // mappedData.forEach((s: any) => { delete s.space_id })

        return Response.json(mappedData)
    } catch (err) {
        console.error("Unexpected error in GET /api/users:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { name, email, role, spaceId } = body

        if (!email || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        // const { error } = await supabase
        //     .from('users')
        //     .insert([{ name, email, role, space_id: spaceId }])
        var profile = await supabase.from('profiles').select('*').eq('email', email);
        console.log("Profile data:", profile)
        if (!profile.data?.length) {
            return Response.json({ message: 'No one registered with this email.' }, { status: 400 })
        }

        const { error } = await supabase
            .from('profile_space')
            .insert({ 'profile_id': profile.data[0].id, 'space_id': spaceId });

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error creating user', error }, { status: 500 })
        }

        var result = {
            id: profile.data[0].id,
            name: profile.data[0].full_name,
            email: profile.data[0].email,
            role: 'admin',
            imagePath: profile.data[0].avatar_url,
            // spaceId: user.space_id,
        }
        // return Response.json({ message: 'User created successfully' }, { status: 201 })
        return Response.json(result, { status: 201 })
    } catch (err) {
        console.error("Unexpected error in POST /api/users:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, name, email, role, spaceId } = body

        if (!id || !name || !email || !role || !spaceId) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase
            .from('users')
            .update({ name, email, role, space_id: spaceId })
            .eq('id', id)

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error updating user', error }, { status: 500 })
        }

        return Response.json({ message: 'User updated successfully' })
    } catch (err) {
        console.error("Unexpected error in PUT /api/users:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const spaceId = searchParams.get('spaceId')

        if (!spaceId) {
            return Response.json({ message: 'Missing spaceId' }, { status: 400 })
        }

        if (!id) {
            return Response.json({ message: 'Missing id' }, { status: 400 })
        }

        const { error } = await supabase
            .from('profile_space')
            .delete()
            .eq('profile_id', id)
            .eq('space_id', spaceId);

        if (error) {
            console.error("Supabase error:", error)
            return Response.json({ message: 'Error deleting user', error }, { status: 500 })
        }

        return Response.json({ message: 'User deleted successfully' })
    } catch (err) {
        console.error("Unexpected error in DELETE /api/users:", err)
        return Response.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
    }
}