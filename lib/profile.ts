export const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    const trimmed = name.trim();
    if (!trimmed) return 'U';

    const parts = trimmed.split(' ').filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return trimmed.substring(0, 2).toUpperCase();
};
