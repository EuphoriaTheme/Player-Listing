import React, { useEffect, useMemo, useRef, useState } from 'react';
import getServer from '@/api/server/getServer';
import { ServerContext } from '@/state/server';
import ReactDOM from 'react-dom';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

// Define interfaces
interface Player {
    name: string;
    uuid: string;
    ping: number | null;
    discord?: string;
    steam?: string;
    identifier?: string;
}

interface MinecraftTps {
    tps1m: number;
    tps5m: number;
    tps15m: number;
}

interface BannedPlayerInfo {
    uuid: string;
    name: string;
    created: string;
    source: string;
    expires: string;
    reason: string;
    avatarUrl?: string | null;
}

interface EggGameMapping {
    egg_id: number;
    game_id: string;
    game_name: string;
}

// Support both string and object formats
type EggGameMappingData = string | EggGameMapping;

interface GameOption {
    id: string;
    name: string;
}

const fetchPlayers: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerSearch, setPlayerSearch] = useState<string>('');
    const [maxPlayers, setMaxPlayers] = useState<number>(0);
    const [numPlayers, setNumPlayers] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [ip, setIp] = useState<string>('');
    const [port, setPort] = useState<number>(0);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid || null);
    const [customPort, setCustomPort] = useState<string | null>(null);
    const [ping, setPing] = useState<number | null>(null);
    const [tps, setTps] = useState<MinecraftTps | null>(null);
    const [tpsLoading, setTpsLoading] = useState<boolean>(false);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [copiedUUIDs, setCopiedUUIDs] = useState<Record<string, boolean>>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [bannedPlayers, setBannedPlayers] = useState<BannedPlayerInfo[]>([]);
    const [showBannedModal, setShowBannedModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedBannedPlayer, setSelectedBannedPlayer] = useState<BannedPlayerInfo | null>(null);
    const [minecraftAvatars, setMinecraftAvatars] = useState<Record<string, string | null>>({});
    const [serverDataLoading, setServerDataLoading] = useState<boolean>(true);
    const [kickBanReason, setKickBanReason] = useState<string>('');
    const [eggGameMappings, setEggGameMappings] = useState<EggGameMappingData[]>([]);
    const [mappingsLoading, setMappingsLoading] = useState<boolean>(true);
    const [availableGames, setAvailableGames] = useState<GameOption[]>([]);
    const [activeTab, setActiveTab] = useState<'server' | 'settings'>('server');
    const [customDomain, setCustomDomain] = useState<string>('');
    const [settingsLoading, setSettingsLoading] = useState<boolean>(true);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const DEFAULT_API_URL = 'https://api.euphoriadevelopment.uk/gameapi';
    const DEFAULT_CRAFTAR_URL = 'https://crafatar.com';
    const [backendApiUrl, setBackendApiUrl] = useState<string>(DEFAULT_API_URL);
    const [avatarApiUrl, setAvatarApiUrl] = useState<string>(DEFAULT_CRAFTAR_URL);
    const serverUuid = uuid;

    // Cache to avoid refetching Minecraft UUIDs on every refresh.
    const minecraftUuidCache = useRef<Record<string, string>>({});
    const minecraftUuidRequestId = useRef<number>(0);
    const minecraftTpsRequestId = useRef<number>(0);

    const filteredPlayers = useMemo(() => {
        const query = playerSearch.trim().toLowerCase();
        if (!query) return players;
        return players.filter((p) => p.name.toLowerCase().includes(query));
    }, [players, playerSearch]);

    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    const isMinecraftUuid = (value: unknown): value is string => {
        if (typeof value !== 'string') return false;
        const normalized = value.replace(/-/g, '');
        return /^[0-9a-fA-F]{32}$/.test(normalized);
    };

    const stripMinecraftFormatting = (input: string): string => {
        // Strip classic Minecraft formatting codes (e.g. \u00A7a)
        return input.replace(/\u00a7[0-9a-fk-or]/gi, '');
    };

    const parseMinecraftTps = (logText: string): MinecraftTps | null => {
        const cleaned = stripMinecraftFormatting(logText);
        const lines = cleaned.split(/\r?\n/);

        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];

            // Paper: "TPS from last 1m, 5m, 15m: 20.0, 20.0, 20.0"
            if (/TPS from last/i.test(line)) {
                const match = line.match(/TPS from last\s*1m,\s*5m,\s*15m:\s*([*]?\d+(?:\.\d+)?)\s*,\s*([*]?\d+(?:\.\d+)?)\s*,\s*([*]?\d+(?:\.\d+)?)/i);
                if (match) {
                    const tps1m = parseFloat(match[1].replace('*', ''));
                    const tps5m = parseFloat(match[2].replace('*', ''));
                    const tps15m = parseFloat(match[3].replace('*', ''));
                    if ([tps1m, tps5m, tps15m].every((v) => Number.isFinite(v))) {
                        return { tps1m, tps5m, tps15m };
                    }
                }
            }

            // Generic: "TPS: 20.0"
            if (/TPS:/i.test(line)) {
                const match = line.match(/TPS:\s*([*]?\d+(?:\.\d+)?)/i);
                if (match) {
                    const tps = parseFloat(match[1].replace('*', ''));
                    if (Number.isFinite(tps)) {
                        return { tps1m: tps, tps5m: tps, tps15m: tps };
                    }
                }
            }
        }

        return null;
    };

    const fetchMinecraftTps = async () => {
        if (!serverUuid) return;
        const requestId = ++minecraftTpsRequestId.current;

        setTpsLoading(true);
        try {
            const baseUrl = `${window.location.protocol}//${window.location.host}`;

            // Best-effort: trigger fresh TPS output for Paper servers.
            try {
                await fetch(`${baseUrl}/api/client/servers/${serverUuid}/command`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken ?? '',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ command: 'tps' }),
                });
            } catch {
                // Ignore - command endpoint may not exist or server may be offline.
            }

            // Give the server a moment to write to latest.log.
            await sleep(750);

            const logResponse = await fetch(`${baseUrl}/api/client/servers/${serverUuid}/files/contents?file=logs/latest.log`, {
                headers: {
                    // Try to only read the tail if the backend supports Range requests.
                    'Range': 'bytes=-32768',
                    'Accept': 'text/plain',
                },
            });

            if (!logResponse.ok) return;
            const logText = await logResponse.text();
            const parsed = parseMinecraftTps(logText);

            if (minecraftTpsRequestId.current !== requestId) return;
            setTps(parsed);
        } catch (err) {
            console.error('Failed to fetch Minecraft TPS:', err);
        } finally {
            if (minecraftTpsRequestId.current === requestId) {
                setTpsLoading(false);
            }
        }
    };

    const fetchMinecraftUuids = async (names: string[]): Promise<Record<string, string>> => {
        const results: Record<string, string> = {};
        const queue = [...names];
        const concurrency = Math.min(5, queue.length);

        const worker = async () => {
            while (queue.length) {
                const name = queue.shift();
                if (!name) continue;
                const cacheKey = name.toLowerCase();

                if (minecraftUuidCache.current[cacheKey]) {
                    results[cacheKey] = minecraftUuidCache.current[cacheKey];
                    continue;
                }

                try {
                    const uuidResponse = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(name)}`);
                    if (!uuidResponse.ok) continue;
                    const uuidData = await uuidResponse.json();
                    const playerUuid = uuidData?.data?.player?.id;

                    if (isMinecraftUuid(playerUuid)) {
                        minecraftUuidCache.current[cacheKey] = playerUuid;
                        results[cacheKey] = playerUuid;
                    }
                } catch {
                    continue;
                }
            }
        };

        await Promise.all(Array.from({ length: concurrency }, worker));
        return results;
    };

    const upsertMinecraftAvatars = (uuids: string[]) => {
        const next: Record<string, string> = {};
        for (const id of uuids) {
            if (!isMinecraftUuid(id)) continue;
            next[id] = `${avatarApiUrl}/avatars/${id}?overlay=true`;
        }

        if (Object.keys(next).length > 0) {
            setMinecraftAvatars((prev) => ({ ...prev, ...next }));
        }
    };

    const setMinecraftPlayers = (rawPlayers: any[]) => {
        const basePlayers: Player[] = rawPlayers.map((player: any) => {
            const name = String(player?.name ?? '');
            const rawId = player?.raw?.id;
            const cached = name ? minecraftUuidCache.current[name.toLowerCase()] : undefined;
            const uuid = (isMinecraftUuid(rawId) ? rawId : cached) ?? '';

            return {
                name,
                uuid,
                ping: null,
            };
        });

        setPlayers(basePlayers);
        upsertMinecraftAvatars(basePlayers.map((p) => p.uuid).filter(Boolean));

        const missingNames = basePlayers
            .filter((p) => !isMinecraftUuid(p.uuid) && p.name)
            .map((p) => p.name)
            .filter((name) => !minecraftUuidCache.current[name.toLowerCase()]);

        if (missingNames.length === 0) return;

        const requestId = ++minecraftUuidRequestId.current;
        void (async () => {
            await fetchMinecraftUuids(missingNames);
            if (minecraftUuidRequestId.current !== requestId) return;

            const hydratedPlayers = basePlayers.map((p) => {
                const cached = p.name ? minecraftUuidCache.current[p.name.toLowerCase()] : undefined;
                if (!cached) return p;
                if (p.uuid === cached) return p;
                return { ...p, uuid: cached };
            });

            setPlayers(hydratedPlayers);
            upsertMinecraftAvatars(hydratedPlayers.map((p) => p.uuid).filter(Boolean));
        })();
    };

    // Fetch egg-game mappings from admin settings
    const fetchEggGameMappings = async () => {
        try {
            const response = await fetch('/extensions/playerlisting/admin/egg-game-mappings', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch egg-game mappings');
            }
            
            const data = await response.json();
            setEggGameMappings(data.mappings || []);
        } catch (err) {
            console.error('Failed to fetch egg-game mappings:', err);
        } finally {
            setMappingsLoading(false);
        }
    };

    // Fetch custom Crafatar API URL from admin settings
    const fetchCrafatarApiUrl = async () => {
        try {
            const response = await fetch('/extensions/playerlisting/api/playerlisting/avatar-api-url', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                const customApiUrl = data.api_url;
                if (customApiUrl && customApiUrl.trim() !== '') {
                    setAvatarApiUrl(customApiUrl.trim());
                    console.log('Using custom API URL:', customApiUrl.trim());
                } else {
                    setAvatarApiUrl(DEFAULT_CRAFTAR_URL);
                    console.log('Using default API URL:', DEFAULT_CRAFTAR_URL);
                }
            } else {
                console.warn('Failed to fetch custom API URL, using default');
                setAvatarApiUrl(DEFAULT_CRAFTAR_URL);
            }
        } catch (err) {
            console.error('Failed to fetch API URL:', err);
            setAvatarApiUrl(DEFAULT_CRAFTAR_URL);
        }
    };

    // Fetch custom API URL from admin settings
    const fetchApiUrl = async () => {
        try {
            const response = await fetch('/extensions/playerlisting/api/playerlisting/api-url', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                const customApiUrl = data.api_url;
                if (customApiUrl && customApiUrl.trim() !== '') {
                    setBackendApiUrl(customApiUrl.trim());
                    console.log('Using custom API URL:', customApiUrl.trim());
                } else {
                    setBackendApiUrl(DEFAULT_API_URL);
                    console.log('Using default API URL:', DEFAULT_API_URL);
                }
            } else {
                console.warn('Failed to fetch custom API URL, using default');
                setBackendApiUrl(DEFAULT_API_URL);
            }
        } catch (err) {
            console.error('Failed to fetch API URL:', err);
            setBackendApiUrl(DEFAULT_API_URL);
        }
    };

    // Load user settings for this server
    const loadUserSettings = async () => {
        if (!serverUuid) return;
        
        try {
            const response = await fetch(`/extensions/playerlisting/api/user-settings?user_uuid=current_user&server_uuid=${serverUuid}`, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const settings = data.settings || {};
                
                // Validate and set custom domain
                if (settings.custom_domain && typeof settings.custom_domain === 'string') {
                    const trimmedDomain = settings.custom_domain.trim();
                    if (trimmedDomain.length > 0 && trimmedDomain !== 'undefined' && trimmedDomain !== 'null') {
                        setCustomDomain(trimmedDomain);
                        console.log('Loaded custom domain:', trimmedDomain);
                    }
                }
                
                // Validate and set custom port
                if (settings.custom_port) {
                    let portValue: string | null = null;
                    if (typeof settings.custom_port === 'string') {
                        portValue = settings.custom_port.trim();
                    } else if (typeof settings.custom_port === 'number') {
                        portValue = settings.custom_port.toString();
                    }
                    
                    if (portValue && portValue !== '' && portValue !== 'undefined' && portValue !== 'null') {
                        const parsedPort = parseInt(portValue, 10);
                        if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
                            setCustomPort(portValue);
                            console.log('Loaded custom port:', parsedPort);
                        } else {
                            console.warn('Invalid custom port in settings:', settings.custom_port);
                        }
                    }
                }
                
                // Set selected game
                if (settings.selected_game && typeof settings.selected_game === 'string') {
                    const gameId = settings.selected_game.trim();
                    if (gameId.length > 0 && gameId !== 'undefined' && gameId !== 'null') {
                        setSelectedGame(gameId);
                        console.log('Loaded selected game:', gameId);
                    }
                }
                
                console.log('Loaded user settings:', settings);
            } else {
                console.warn('Failed to load user settings:', response.status, response.statusText);
            }
        } catch (err) {
            console.error('Failed to load user settings:', err);
        } finally {
            setSettingsLoading(false);
        }
    };

    // Save user settings for this server
    const saveUserSettings = async (overrides?: { customDomain?: string; customPort?: string | null; selectedGame?: string | null }) => {
        if (!serverUuid) return;

        const customDomainToSave = (overrides?.customDomain ?? customDomain).trim();
        const rawPortToSave = overrides?.customPort ?? customPort;
        const customPortToSave = typeof rawPortToSave === 'string' && rawPortToSave.trim() !== '' ? rawPortToSave.trim() : null;
        const rawSelectedGameToSave = overrides?.selectedGame ?? selectedGame;
        const selectedGameToSave = typeof rawSelectedGameToSave === 'string' && rawSelectedGameToSave.trim() !== '' ? rawSelectedGameToSave.trim() : null;
        
        try {
            const response = await fetch('/extensions/playerlisting/api/user-settings', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_uuid: 'current_user', // This should be replaced with actual user UUID
                    server_uuid: serverUuid,
                    custom_domain: customDomainToSave,
                    custom_port: customPortToSave,
                    selected_game: selectedGameToSave
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('User settings saved successfully');
                    // Update IP if custom domain is set
                    if (customDomainToSave) {
                        setIp(customDomainToSave);
                    }
                    // Update port if custom port is set
                    if (customPortToSave) {
                        const parsedPort = parseInt(customPortToSave, 10);
                        if (!isNaN(parsedPort)) {
                            setPort(parsedPort);
                        }
                    }
                } else {
                    console.error('Failed to save user settings:', data.error);
                }
            }
        } catch (err) {
            console.error('Failed to save user settings:', err);
        }
    };

    // Filter available games based on server's egg ID
    const fetchAvailableGames = async () => {
        if (!serverUuid || mappingsLoading) return;
        
        try {
            const [server] = await getServer(serverUuid);
            console.log('Server object:', server); // Debug log
            
            // Get egg ID from BlueprintFramework
            const serverEggId = (server as any).BlueprintFramework?.eggId;
            console.log('Server egg ID:', serverEggId); // Debug log
            
            if (serverEggId) {
                const availableGames: GameOption[] = [];
                
                // Process both string and object formats
                eggGameMappings.forEach(mapping => {
                    if (typeof mapping === 'string') {
                        // Parse string format: "gameName_eggId_displayName_gameId"
                        const parts = mapping.split('_');
                        if (parts.length >= 4) {
                            const mappingEggId = parseInt(parts[1], 10);
                            if (mappingEggId === serverEggId) {
                                availableGames.push({
                                    id: parts[3], // gameId
                                    name: parts[2] // displayName
                                });
                            }
                        }
                    } else if (mapping && typeof mapping === 'object') {
                        // Handle object format
                        if (mapping.egg_id === serverEggId) {
                            availableGames.push({
                                id: mapping.game_id,
                                name: mapping.game_name
                            });
                        }
                    }
                });
                
                console.log('Available games for egg ID', serverEggId, ':', availableGames); // Debug log
                setAvailableGames(availableGames);
                
                // If the selected game is missing (or unset), fall back to the first available option.
                if (availableGames.length > 0) {
                    const availableIds = new Set(availableGames.map(g => g.id));
                    if (!selectedGame || !availableIds.has(selectedGame)) {
                        setSelectedGame(availableGames[0].id);
                    }
                } else if (selectedGame) {
                    setSelectedGame(null);
                }
            } else {
                console.log('No server egg ID found');
                setAvailableGames([]);
                if (selectedGame) {
                    setSelectedGame(null);
                }
            }
        } catch (err) {
            console.error('Failed to fetch available games:', err);
        }
    };

    // Load mappings, API URL, and user settings on component mount
    useEffect(() => {
        fetchEggGameMappings();
        fetchApiUrl();
        fetchCrafatarApiUrl();
        loadUserSettings();
    }, []);

    // Update available games when mappings change
    useEffect(() => {
        fetchAvailableGames();
    }, [eggGameMappings, mappingsLoading, serverUuid]);

    // Reset TPS state when switching away from Minecraft to avoid showing stale values.
    useEffect(() => {
        if (selectedGame !== 'minecraft') {
            setTps(null);
            setTpsLoading(false);
        }
    }, [selectedGame]);

    useEffect(() => {
        const fetchServerData = async () => {
            if (!serverUuid) {
                setError('Server UUID is not available.');
                setServerDataLoading(false);
                return;
            }

            setServerDataLoading(true);
            try {
                const [server] = await getServer(serverUuid);
                const defaultAllocation = server.allocations.find((allocation) => allocation.isDefault);

                if (!defaultAllocation) {
                    throw new Error('No default allocation found for the server.');
                }

                // Use custom domain if set and valid, otherwise use server's IP
                let serverIp = server.sftpDetails.ip;
                if (customDomain && customDomain.trim() !== '') {
                    const trimmedDomain = customDomain.trim();
                    // Basic validation for domain/IP format
                    if (trimmedDomain.length > 0 && !trimmedDomain.includes(' ') && trimmedDomain !== 'undefined' && trimmedDomain !== 'null') {
                        serverIp = trimmedDomain;
                        console.log('Using custom domain:', trimmedDomain);
                    } else {
                        console.warn('Invalid custom domain format, using default IP:', server.sftpDetails.ip);
                    }
                }
                
                // Use custom port if set and valid, otherwise use server's port
                let serverPort = defaultAllocation.port;
                if (customPort && customPort.trim() !== '') {
                    const parsedPort = parseInt(customPort.trim(), 10);
                    if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
                        serverPort = parsedPort;
                        console.log('Using custom port:', parsedPort);
                    } else {
                        console.warn('Invalid custom port format, using default port:', defaultAllocation.port);
                    }
                }
                
                setIp(serverIp);
                setPort(serverPort);
            } catch (error) {
                console.error('Failed to fetch server details:', error);
                setError('Failed to fetch server details.');
            } finally {
                setServerDataLoading(false);
            }
        };

        if (serverUuid) {
            fetchServerData();
        }
    }, [serverUuid, customDomain, customPort]);

    useEffect(() => {
        const fetchPlayersFromAPI = async () => {
            if (serverDataLoading || settingsLoading || !selectedGame) return;

            // Validate IP and port before making API call
            if (!ip || !port || ip.trim() === '' || port <= 0 || port > 65535) {
                console.warn('Invalid IP or port configuration:', { ip, port });
                setError('Invalid server configuration.');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Ensure IP doesn't have protocol prefix and encode it properly
                const cleanIp = ip.replace(/^https?:\/\//, '').trim();
                const targetURL = `/${selectedGame}/ip=${encodeURIComponent(cleanIp)}&port=${port}`;
                const apiURL = `${backendApiUrl}${targetURL}`;
                
                // Add timeout to the fetch request
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

                const response = await fetch(apiURL, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();

                    if (selectedGame === 'minecraft') {
                        if (data.success && data.data) {
                            const gameData = data.data;

                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);
                            void fetchMinecraftTps();

                            if (Array.isArray(gameData.players)) {
                                setMinecraftPlayers(gameData.players);
                            } else {
                                setPlayers([]);
                                setError('No players found on the server.');
                            }
                        } else {
                            setTps(null);
                            setMaxPlayers(0);
                            setNumPlayers(0);
                            setPing(null);
                            setPlayers([]);
                            setError('Server is offline.');
                        }
                    } else if (selectedGame === 'gta5f') {
                        // For FiveM servers
                        if (data.success && data.data) {
                            const gameData = data.data;
                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);

                            setPlayers(gameData.players.map((player: any) => ({
                                name: player.name,
                                uuid: player.raw?.id || player.name || 'unknown',
                                ping: null,
                                discord: player.raw?.discord || undefined,
                                steam: player.raw?.steam || undefined,
                                identifier: player.raw?.identifier || undefined,
                            })));
                        } else {
                            setMaxPlayers(0);
                            setNumPlayers(0);
                            setPing(null);
                            setPlayers([]);
                            setError('Server is offline.');
                        }
                    } else if (selectedGame === 'beammp') {
                        // For BeamMP servers
                        if (data.success && data.data) {
                            const gameData = data.data;
                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);

                            // BeamMP returns players as an array of strings (player names)
                            setPlayers(gameData.players.map((playerName: string) => ({
                                name: playerName,
                                uuid: playerName,
                                ping: null,
                            })));
                        } else {
                            setMaxPlayers(0);
                            setNumPlayers(0);
                            setPing(null);
                            setPlayers([]);
                            setError('Server is offline.');
                        }
                    } else {
                        // For other games
                        if (data.success && data.data) {
                            const gameData = data.data;
                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);

                            setPlayers(gameData.players.map((player: any) => ({
                                name: player.name,
                                uuid: player.raw?.id || player.name || 'unknown',
                                ping: null,
                            })));
                        } else {
                            setMaxPlayers(0);
                            setNumPlayers(0);
                            setPing(null);
                            setPlayers([]);
                            setError('Server is offline.');
                        }
                    }
                } else {
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }
            } catch (err) {
                console.error('An error occurred while fetching player data:', err);
                
                // Provide more specific error messages
                if (err instanceof Error) {
                    if (err.name === 'AbortError') {
                        setError('Request timed out. Please check your server configuration.');
                    } else if (err.message.includes('fetch') || err.message.includes('NetworkError')) {
                        setError('Network error. Please check your connection and server settings.');
                    } else {
                        setError(`Failed to fetch player data: ${err.message}`);
                    }
                } else {
                    setError('An unknown error occurred while fetching player data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlayersFromAPI();
    }, [serverDataLoading, settingsLoading, ip, port, selectedGame, backendApiUrl]);

    const handleRefresh = async () => {
        if (serverDataLoading || settingsLoading || !selectedGame) return;

        // Validate IP and port before making API call
        if (!ip || !port || ip.trim() === '' || port <= 0 || port > 65535) {
            console.warn('Invalid IP or port configuration:', { ip, port });
            setError('Invalid server configuration.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Refresh backend configurations first
            await fetchApiUrl();
            await fetchCrafatarApiUrl();
            await fetchEggGameMappings();

            // Then fetch fresh player data
            const cleanIp = ip.replace(/^https?:\/\//, '').trim();
            const targetURL = `/${selectedGame}/ip=${encodeURIComponent(cleanIp)}&port=${port}`;
            const apiURL = `${backendApiUrl}${targetURL}`;
            
            // Add timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(apiURL, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();

                if (selectedGame === 'minecraft') {
                    if (data.success && data.data) {
                        const gameData = data.data;

                        setMaxPlayers(gameData.maxplayers);
                        setNumPlayers(gameData.numplayers);
                        setPing(gameData.ping);
                        void fetchMinecraftTps();

                        if (Array.isArray(gameData.players)) {
                            setMinecraftPlayers(gameData.players);
                        } else {
                            setPlayers([]);
                            setError('No players found on the server.');
                        }
                    } else {
                        setTps(null);
                        setMaxPlayers(0);
                        setNumPlayers(0);
                        setPing(null);
                        setPlayers([]);
                        setError('Server is offline.');
                    }
                    } else if (selectedGame === 'gta5f') {
                        // For FiveM servers
                        if (data.success && data.data) {
                            const gameData = data.data;
                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);

                            setPlayers(gameData.players.map((player: any) => ({
                                name: player.name,
                                uuid: player.raw?.id || player.name || 'unknown',
                                ping: null,
                                discord: player.raw?.discord || undefined,
                                steam: player.raw?.steam || undefined,
                                identifier: player.raw?.identifier || undefined,
                            })));
                        } else {
                            setMaxPlayers(0);
                            setNumPlayers(0);
                            setPing(null);
                            setPlayers([]);
                            setError('Server is offline.');
                        }
                    } else if (selectedGame === 'beammp') {
                        // For BeamMP servers
                        if (data.success && data.data) {
                            const gameData = data.data;
                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);

                            // BeamMP returns players as an array of strings (player names)
                            setPlayers(gameData.players.map((playerName: string) => ({
                                name: playerName,
                                uuid: playerName,
                                ping: null,
                            })));
                        } else {
                            setMaxPlayers(0);
                            setNumPlayers(0);
                            setPing(null);
                            setPlayers([]);
                            setError('Server is offline.');
                        }
                    } else {
                        // For other games
                        if (data.success && data.data) {
                            const gameData = data.data;
                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);

                            setPlayers(gameData.players.map((player: any) => ({
                                name: player.name,
                                uuid: player.raw?.id || player.name || 'unknown',
                                ping: null,
                            })));
                        } else {
                            setMaxPlayers(0);
                            setNumPlayers(0);
                            setPing(null);
                            setPlayers([]);
                            setError('Server is offline.');
                        }
                    }
            } else {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }
        } catch (err) {
            console.error('An error occurred while refreshing player data:', err);
            
            // Provide more specific error messages
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    setError('Request timed out. Please check your server configuration.');
                } else if (err.message.includes('fetch') || err.message.includes('NetworkError')) {
                    setError('Network error. Please check your connection and server settings.');
                } else {
                    setError(`Failed to refresh player data: ${err.message}`);
                }
            } else {
                setError('An unknown error occurred while refreshing player data.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const gameId = e.target.value;
        setSelectedGame(gameId || null);
    };

    const pingColor = useMemo(() => {
        if (ping === null) return 'transparent';
        if (ping < 50) return 'bg-green-500';
        if (ping < 100) return 'bg-orange-500';
        return 'bg-red-500';
    }, [ping]);

    const handleCopy = (identifier: string, label: string) => {
        const cleanedIdentifier = identifier.includes(":") ? identifier.split(":")[1] : identifier;
        
        navigator.clipboard.writeText(cleanedIdentifier)
            .then(() => {
                setCopiedUUIDs(prev => ({ ...prev, [label]: true }));
                setTimeout(() => setCopiedUUIDs(prev => ({ ...prev, [label]: false })), 2000);
            })
            .catch((err) => console.error("Failed to copy identifier:", err));
    };

    const handleManageClick = (player: Player) => {
        setSelectedPlayer(player);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPlayer(null);
        setKickBanReason('');
    };

    const handleBansClick = () => {
        fetchBannedPlayers();
    };

    const closeBannedModal = () => {
        setShowBannedModal(false);
    };

    const openInfoModal = (player: BannedPlayerInfo) => {
        setSelectedBannedPlayer(player);
        setShowInfoModal(true);
    };

    const closeInfoModal = () => setShowInfoModal(false);

    const handleUnbanPlayer = async (playerName: string) => {
        try {
            const serverId = uuid;
            const command = `pardon ${playerName}`;
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const response = await fetch(`${baseUrl}/api/client/servers/${serverId}/command`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken ?? '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            if (response.ok) {
                console.log(`${playerName} has been unbanned.`);
                setBannedPlayers(prevPlayers => prevPlayers.filter(player => player.name !== playerName));
            } else {
                console.error(`Failed to unban ${playerName}:`, response.statusText);
            }
        } catch (error) {
            console.error(`An error occurred while trying to unban ${playerName}:`, error);
        }
    };

    const handleBanPlayer = async (playerName: string) => {
        try {
            const serverId = uuid;
            const command = `ban ${playerName} ${kickBanReason}`;
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const response = await fetch(`${baseUrl}/api/client/servers/${serverId}/command`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken ?? '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            if (response.ok) {
                console.log(`${playerName} has been banned with reason: ${kickBanReason}`);
            } else {
                console.error(`Failed to ban ${playerName}:`, response.statusText);
            }
        } catch (error) {
            console.error(`An error occurred while trying to ban ${playerName}:`, error);
        }
    };

    const handleOpPlayer = async (playerName: string) => {
        try {
            const serverId = uuid;
            const command = `op ${playerName}`;
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const response = await fetch(`${baseUrl}/api/client/servers/${serverId}/command`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken ?? '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            if (response.ok) {
                console.log(`${playerName} has been given OP.`);
            } else {
                console.error(`Failed to give OP to ${playerName}:`, response.statusText);
            }
        } catch (error) {
            console.error(`An error occurred while trying to OP ${playerName}:`, error);
        }
    };

    const handleUnOpPlayer = async (playerName: string) => {
        try {
            const serverId = uuid;
            const command = `deop ${playerName}`;
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const response = await fetch(`${baseUrl}/api/client/servers/${serverId}/command`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken ?? '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            if (response.ok) {
                console.log(`${playerName} has been removed from OP.`);
            } else {
                console.error(`Failed to remove OP from ${playerName}:`, response.statusText);
            }
        } catch (error) {
            console.error(`An error occurred while trying to DEOP ${playerName}:`, error);
        }
    };

    const fetchBannedPlayers = async () => {
        try {
            const response = await fetch(`/api/client/servers/${serverUuid}/files/contents?file=banned-players.json`);
            if (response.ok) {
                const data = await response.json();
                const bannedData = Array.isArray(data) ? data : [];

                const playersWithAvatars = await Promise.all(
                    bannedData.map(async (player: { uuid: string; name: string; created: string; source: string; expires: string; reason: string }) => {
                        const avatarUrl = `${avatarApiUrl}/avatars/${player.uuid}?overlay=true`;
                        return {
                            name: player.name,
                            uuid: player.uuid,
                            created: player.created,
                            source: player.source,
                            expires: player.expires,
                            reason: player.reason,
                            avatarUrl,
                        };
                    })
                );

                setBannedPlayers(playersWithAvatars);
                setShowBannedModal(true);
            } else {
                console.error("Failed to fetch banned players.");
            }
        } catch (error) {
            console.error("Error fetching banned players:", error);
        }
    };

    const handleKickPlayer = async (playerName: string) => {
        try {
            const serverId = uuid;
            const command = `kick ${playerName} ${kickBanReason}`;
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const response = await fetch(`${baseUrl}/api/client/servers/${serverId}/command`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken ?? '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            if (response.ok) {
                console.log(`${playerName} has been kicked with reason: ${kickBanReason}`);
            } else {
                console.error(`Failed to kick ${playerName}:`, response.statusText);
            }
        } catch (error) {
            console.error(`An error occurred while trying to kick ${playerName}:`, error);
        }
    };

    return (
        <ServerContentBlock title={'Player Management'}>
            <div className="minecraft-players-container bg-gray-900 p-6 rounded-lg relative">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700 pb-4 mb-4">
                    <button
                        onClick={() => setActiveTab('server')}
                        className={`px-4 py-2 font-medium text-sm ${
                            activeTab === 'server' 
                                ? 'border-b-2 border-blue-500 text-blue-400' 
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Server
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 ml-2 font-medium text-sm ${
                            activeTab === 'settings' 
                                ? 'border-b-2 border-blue-500 text-blue-400' 
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Settings
                    </button>
                </div>

                {/* Server Tab */}
                {activeTab === 'server' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-header leading-tight text-md md:text-sm text-gray-200">
                                Connected Players {numPlayers}/{maxPlayers}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                    <div className={`${pingColor} w-4 h-4 rounded-full mr-2`}></div>
                                    <span className="text-gray-200">{ping !== null ? `${ping} ms` : 'N/A'}</span>
                                </div>
                                {selectedGame === 'minecraft' && (
                                    <div className="flex items-center" title={tps ? `TPS 1m/5m/15m: ${tps.tps1m.toFixed(2)} / ${tps.tps5m.toFixed(2)} / ${tps.tps15m.toFixed(2)}` : undefined}>
                                        <span className="text-gray-200">
                                            {tpsLoading ? 'TPS: ...' : tps ? `TPS: ${tps.tps1m.toFixed(2)}` : 'TPS: N/A'}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={handleRefresh}
                                    className="text-white hover:text-white focus:outline-none"
                                    aria-label="Refresh server data"
                                >
                                    <i className="fa-solid fa-arrows-rotate"></i>
                                </button>
                            </div>
                        </div>

                        {loading && <p className="text-gray-400">Loading players...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!selectedGame && !loading && !error && (
                            <p className="text-gray-400">Please configure a game in the Settings tab.</p>
                        )}
                        {players.length > 0 && !loading && !error && (
                            <div className="mb-4 space-y-2">
                                <input
                                    type="text"
                                    value={playerSearch}
                                    onChange={(e) => setPlayerSearch(e.target.value)}
                                    placeholder="Search players..."
                                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                                {playerSearch.trim() !== '' && (
                                    <p className="text-xs text-gray-400">
                                        Showing {filteredPlayers.length} of {players.length}
                                    </p>
                                )}
                            </div>
                        )}
                        {players.length > 0 && filteredPlayers.length === 0 && !loading && !error && (
                            <p className="text-gray-400">No players match your search.</p>
                        )}
                        {filteredPlayers.length > 0 && !loading && !error && (
                            <ul className="players-list space-y-4">
                                {filteredPlayers.map(player => (
                                    <li key={`${player.name}-${player.uuid}`} className="bg-gray-800 p-4 rounded-lg">
                                        <div className="flex items-center justify-between space-x-2">
                                            <div className="flex items-center space-x-4">
                                                {selectedGame === 'minecraft' && minecraftAvatars[player.uuid] ? (
                                                    <img
                                                        src={minecraftAvatars[player.uuid] || ''}
                                                        alt={`${player.name}'s avatar`}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                ) : null}
                                                <span className="text-white">{player.name}</span>
                                                <span className="text-gray-300 text-sm">{player.ping !== null ? `${player.ping} ms` : 'N/A'}</span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleCopy(player.uuid, player.name)}
                                                    disabled={selectedGame === 'minecraft' && !isMinecraftUuid(player.uuid)}
                                                    className={`text-sm bg-blue-500 text-white px-2 py-1 rounded ${
                                                        selectedGame === 'minecraft' && !isMinecraftUuid(player.uuid)
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : 'hover:bg-blue-600'
                                                    }`}
                                                >
                                                    {selectedGame === 'minecraft' && !isMinecraftUuid(player.uuid)
                                                        ? 'UUID N/A'
                                                        : copiedUUIDs[player.name] ? "Copied!" : "UUID"}
                                                </button>
                                                {selectedGame === 'gta5f' && player.discord && (
                                                    <button
                                                        onClick={() => handleCopy(player.discord!, `${player.name}_discord`)}
                                                        className="text-sm bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                                                    >
                                                        {copiedUUIDs[`${player.name}_discord`] ? "Copied!" : "Discord"}
                                                    </button>
                                                )}
                                                {selectedGame === 'gta5f' && player.steam && (
                                                    <button
                                                        onClick={() => handleCopy(player.steam!, `${player.name}_steam`)}
                                                        className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                                    >
                                                        {copiedUUIDs[`${player.name}_steam`] ? "Copied!" : "Steam"}
                                                    </button>
                                                )}
                                                {selectedGame === 'gta5f' && player.identifier && (
                                                    <button
                                                        onClick={() => handleCopy(player.identifier!, `${player.name}_identifier`)}
                                                        className="text-sm bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                                                    >
                                                        {copiedUUIDs[`${player.name}_identifier`] ? "Copied!" : "ID"}
                                                    </button>
                                                )}
                                                {selectedGame === 'minecraft' ? (
                                                    <button
                                                        onClick={() => handleManageClick(player)}
                                                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                    >
                                                        Manage
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {selectedGame === 'minecraft' && (
                            <button
                                onClick={() => handleBansClick()}
                                className="text-sm bg-blue-500 text-white px-3 py-1 rounded mt-4 hover:bg-blue-600"
                            >
                                View Banned Players
                            </button>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Server Configuration</h3>
                        
                        {settingsLoading ? (
                            <p className="text-gray-400">Loading settings...</p>
                        ) : (
                            <div className="space-y-4">
                                {/* IP/Domain Field */}
                                <div>
                                    <label htmlFor="custom-domain" className="block text-sm text-gray-200 mb-2">
                                        Custom IP/Domain
                                    </label>
                                    <input
                                        id="custom-domain"
                                        type="text"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        placeholder="Leave empty to use server's default IP"
                                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Current IP: {ip || 'Not set'}
                                    </p>
                                </div>

                                {/* Port Field */}
                                <div>
                                    <label htmlFor="custom-port" className="block text-sm text-gray-200 mb-2">
                                        Custom Query Port
                                    </label>
                                    <input
                                        id="custom-port"
                                        type="number"
                                        value={customPort || ''}
                                        onChange={(e) => setCustomPort(e.target.value)}
                                        placeholder="Leave empty to use server's default port"
                                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Current Port: {port || 'Not set'}
                                    </p>
                                </div>

                                {/* Game Selection */}
                                <div>
                                    <label htmlFor="game-select" className="block text-sm text-gray-200 mb-2">
                                        Select Game
                                    </label>
                                    <select
                                        id="game-select"
                                        value={selectedGame || ''}
                                        onChange={handleGameChange}
                                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                        disabled={mappingsLoading}
                                    >
                                        <option value="">
                                            {mappingsLoading ? 'Loading games...' : 'Choose a game'}
                                        </option>
                                        {availableGames.map(game => (
                                            <option key={game.id} value={game.id}>{game.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Save Button */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => saveUserSettings()}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none"
                                    >
                                        Save Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            const nextDomain = '';
                                            const nextPort = null;
                                            const nextGame = null;
                                            setCustomDomain(nextDomain);
                                            setCustomPort(nextPort);
                                            setSelectedGame(nextGame);
                                            saveUserSettings({ customDomain: nextDomain, customPort: nextPort, selectedGame: nextGame });
                                        }}
                                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:outline-none"
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Modals remain the same */}
                {/* Modal for Player Actions */}
                {modalOpen && selectedPlayer && ReactDOM.createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-gray-900 rounded-lg p-6 relative shadow-lg" style={{ width: '50rem', maxWidth: '90%' }}>
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                                x
                            </button>
                            <h2 className="text-lg text-white font-semibold mb-4">Manage {selectedPlayer.name}</h2>
                            
                            {/* Player's 3D Model */}
                            {selectedPlayer.uuid && (
                                <div className="flex justify-center mb-4">
                                    <img
                                        src={`${avatarApiUrl}/renders/body/${selectedPlayer.uuid}?overlay=true`}
                                        alt={`${selectedPlayer.name}'s 3D model`}
                                        className="w-32"
                                    />
                                </div>
                            )}

                            {/* Reason Input */}
                            <label className="text-white">Reason for Kick/Ban:</label>
                            <input
                                type="text"
                                value={kickBanReason}
                                onChange={(e) => setKickBanReason(e.target.value)}
                                placeholder="Enter reason"
                                className="w-full p-2 mt-2 mb-4 rounded bg-gray-700 text-white"
                            />

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleBanPlayer(selectedPlayer.name)}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Ban
                                </button>
                                <button
                                    onClick={() => handleKickPlayer(selectedPlayer.name)}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Kick
                                </button>
                                <button
                                    onClick={() => handleOpPlayer(selectedPlayer.name)}
                                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Give OP
                                </button>
                                <button
                                    onClick={() => handleUnOpPlayer(selectedPlayer.name)}
                                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                >
                                    Remove OP
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Banned Players Modal */}
                {showBannedModal && ReactDOM.createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-gray-900 rounded-lg p-6 relative shadow-lg" style={{ width: '50rem', maxWidth: '90%' }}>
                            <button onClick={closeBannedModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">x</button>
                            <h2 className="text-lg font-semibold mb-4 text-white">Banned Players</h2>
                            <ul>
                                {bannedPlayers.map((player) => (
                                    <li key={player.uuid} className="flex items-center justify-between p-2 bg-gray-800 rounded mb-2">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={player.avatarUrl || ''}
                                                alt={`${player.name}'s avatar`}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <span className="text-white">{player.name}</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openInfoModal(player)}
                                                className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                                            >
                                                Info
                                            </button>
                                            <button
                                                onClick={() => handleUnbanPlayer(player.name)}
                                                className="text-sm bg-green-500 text-white px-2 py-1 rounded"
                                            >
                                                Unban
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Information Modal */}
                {showInfoModal && selectedBannedPlayer && ReactDOM.createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-gray-900 rounded-lg p-6 relative shadow-lg" style={{ width: '50rem', maxWidth: '90%' }}>
                            <button onClick={closeInfoModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">x</button>
                            <h2 className="text-lg font-semibold mb-4 text-white">Ban Information</h2>
                            <div className="text-white">
                                <p><strong>Name:</strong> {selectedBannedPlayer.name}</p>
                                <p><strong>UUID:</strong> {selectedBannedPlayer.uuid}</p>
                                <p><strong>Reason:</strong> {selectedBannedPlayer.reason}</p>
                                <p><strong>Created:</strong> {selectedBannedPlayer.created}</p>
                                <p><strong>Expires:</strong> {selectedBannedPlayer.expires}</p>
                                <p><strong>Source:</strong> {selectedBannedPlayer.source}</p>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </ServerContentBlock>
    );
};

export default fetchPlayers;
