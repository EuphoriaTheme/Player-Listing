export const normalizeGameId = (gameId: string | null | undefined): string =>
    (gameId || '').trim().toLowerCase();

export const isMinecraftGame = (gameId: string | null | undefined): boolean =>
    normalizeGameId(gameId) === 'minecraft';

export const getDefaultRconPlayersCommand = (gameId: string | null | undefined): string => {
    const normalized = normalizeGameId(gameId);

    if (normalized === 'rust') return 'players';
    if (['asa', 'ase', 'ark', 'arksa', 'arkse'].includes(normalized)) return 'ListPlayers';
    if (['sdtd', '7dtd', '7daystodie'].includes(normalized)) return 'listplayers';

    return 'status';
};
