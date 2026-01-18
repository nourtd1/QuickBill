import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { TeamRole } from '../lib/teamService';

export function useTeamRole() {
    const { user } = useAuth();
    const [role, setRole] = useState<TeamRole>('owner');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchRole = async () => {
            try {
                // 1. Check if already linked (member_id match)
                const { data: linkedMember } = await supabase
                    .from('team_members')
                    .select('role')
                    .eq('member_id', user.id)
                    .in('status', ['active', 'invited']) // Allow invited if id is set
                    .single();

                if (linkedMember) {
                    setRole(linkedMember.role as TeamRole);
                    setLoading(false);
                    return;
                }

                // 2. Check if invited by email (Link Pending)
                if (user.email) {
                    const { data: invite } = await supabase
                        .from('team_members')
                        .select('id, role')
                        .eq('member_email', user.email)
                        .is('member_id', null) // Only if not already claimed
                        .single();

                    if (invite) {
                        // Found an invite! Auto-accept and link account.
                        console.log("Found invite for email, linking account...", invite.role);
                        setRole(invite.role as TeamRole); // Optimistic update

                        const { error: updateError } = await supabase
                            .from('team_members')
                            .update({
                                member_id: user.id,
                                status: 'active',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', invite.id);

                        if (updateError) {
                            console.error("Failed to link team member:", updateError);
                            // Ensure RLS allows this update!
                        }
                    } else {
                        // No invite found, default to Owner (Independent User)
                        setRole('owner');
                    }
                }
            } catch (error) {
                console.error("Error confirming team role:", error);
                setRole('owner');
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [user]);

    return { role, loading, isOwner: role === 'owner', isAdmin: role === 'admin' || role === 'owner' };
}
