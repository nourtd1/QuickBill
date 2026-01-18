import { supabase } from './supabase';

export type TeamRole = 'owner' | 'admin' | 'seller' | 'accountant';
export type TeamMemberStatus = 'invited' | 'active' | 'disabled';

export interface TeamMember {
    id: string;
    owner_id: string;
    member_id: string | null;
    member_email: string; // Changed from email to match DB
    role: TeamRole;
    status: TeamMemberStatus;
    created_at: string;
}

export interface ActivityLog {
    id: string;
    action: string;
    entity_type: string;
    details: any;
    created_at: string;
    actor_email?: string; // Enriched via join or function
}

/**
 * Invite a new member to the team via email
 */
export async function inviteMember(email: string, role: TeamRole) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    // Check if duplicate
    const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('owner_id', user.id)
        .eq('member_email', email) // Check member_email
        .single();

    if (existing) throw new Error("Ce membre est déjà invité.");

    // Create Invite
    const { data, error } = await supabase
        .from('team_members')
        .insert({
            owner_id: user.id,
            member_email: email, // Insert into member_email
            role,
            status: 'invited'
        })
        .select()
        .single();

    if (error) throw error;

    // Send Email via Edge Function
    try {
        await sendInviteEmail(email, role, user.email || 'Admin');
    } catch (err) {
        console.error("Failed to send email invite:", err);
        // Don't block flow, UI handles success
    }

    // Log Activity
    await logActivity({
        action: 'INVITE_MEMBER',
        entity_type: 'team',
        details: { email, role }
    });

    return data;
}

/**
 * Trigger the Edge Function to send email
 */
async function sendInviteEmail(email: string, role: string, inviterEmail: string) {
    const { data, error } = await supabase.functions.invoke('send-invite', {
        body: { email, role, inviterEmail }
    });

    if (error) throw error;
    return data;
}

/**
 * Remove a member from the team
 */
export async function removeMember(memberId: string) {
    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

    if (error) throw error;

    await logActivity({
        action: 'REMOVE_MEMBER',
        entity_type: 'team',
        details: { memberId }
    });
}

/**
 * Fetch all team members for the current workspace owner
 */
export async function getTeamMembers() {
    const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TeamMember[];
}

/**
 * Log a critical activity
 */
export async function logActivity(params: {
    action: string,
    entity_type?: string,
    entity_id?: string,
    details?: any
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Determine Workspace ID (Self or Owner)
    // We try to find if we are a member first
    // Note: Ideally use a persistent session state for 'currentWorkspace'
    // For simplicity, we assume we log to the workspace we are currently operating in.
    // However, getting that ID strictly via SQL is better (via Trigger).
    // But for client-side explicit logging:

    // Simplification: We log with team_id = user.id. 
    // BUT if user is member, this fails RLS policies if team_id must be owner.
    // Solution: The RLS policy we created allows insert where team_id = (select owner_id...).
    // So we need to fetch our owner_id first? No, the SQL trigger handles standard columns.
    // But logs are manual.
    // Let's resolve owner_id client side or assume RLS allows insert "if team_id is valid".
    // Actually, to keep it fast, let's try to insert with team_id = user.id first (Owner case).
    // If we receive error (RLS), we might be a member.
    // Better: Fetch my 'owner_id' once on login.

    // Quick Fix: Look up team_members locally
    let teamId = user.id;
    const { data: membership } = await supabase.from('team_members').select('owner_id').eq('member_id', user.id).eq('status', 'active').single();
    if (membership) {
        teamId = membership.owner_id;
    }

    await supabase.from('activity_logs').insert({
        team_id: teamId,
        actor_id: user.id,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        details: params.details
    });
}

/**
 * Helper to check permissions client-side
 * (Security is enforced by RLS, this is just for UI hiding)
 */
export function canDo(role: TeamRole, action: 'create_invoice' | 'view_reports' | 'manage_team'): boolean {
    if (role === 'owner') return true;
    if (role === 'admin') return true;

    if (role === 'seller') {
        return action === 'create_invoice';
    }

    if (role === 'accountant') {
        return action === 'view_reports'; // Can view but not create
    }

    return false;
}
