import { isMinecraftGame } from './gameHandlers';

type RconConnectionInput = {
    host: string;
    password: string;
    port: string | number;
};

type ShouldUseRconInput = {
    gameId: string | null;
    rconFeatureEnabled: boolean;
    rconEnabled: boolean;
} & RconConnectionInput;

export const parseRconPort = (port: string | number): number => {
    if (typeof port === 'number') return Number.isFinite(port) ? Math.trunc(port) : Number.NaN;
    return parseInt(String(port).trim(), 10);
};

export const hasValidRconConnectionDetails = ({ host, password, port }: RconConnectionInput): boolean => {
    const parsedPort = parseRconPort(port);

    return Boolean(host.trim())
        && Boolean(password.trim())
        && !Number.isNaN(parsedPort)
        && parsedPort > 0
        && parsedPort <= 65535;
};

export const shouldUseRconForGame = ({ gameId, rconFeatureEnabled, rconEnabled, host, password, port }: ShouldUseRconInput): boolean => {
    const normalizedGameId = (gameId || '').trim().toLowerCase();
    if (isMinecraftGame(gameId) || ['bedrock', 'minecraftbedrock', 'mcbe', 'mbe'].includes(normalizedGameId)) return false;
    if (!rconFeatureEnabled || !rconEnabled) return false;

    return hasValidRconConnectionDetails({ host, password, port });
};
