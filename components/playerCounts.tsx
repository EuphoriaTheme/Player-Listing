import React, { useState, useEffect, useRef } from 'react';
import getServer from '@/api/server/getServer';
import { ServerContext } from '@/state/server';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import StatBlock from '@/components/server/console/StatBlock';
import { getDefaultRconPlayersCommand } from './gameHandlers';
import { postRconJson } from './rconApi';
import { parseRconPort, shouldUseRconForGame } from './rconConnection';
import { getCachedServer } from './serverCache';
import { extractMaxPlayersFromPanelServer, extractMaxPlayersFromStartupPayload, resolveStableMaxPlayers } from './maxPlayersResolver';

// Define interfaces for egg-game mappings
interface EggGameMapping {
    egg_id: number;
    game_id: string;
    game_name: string;
}

// Support both string and object formats
type EggGameMappingData = string | EggGameMapping;

const PlayerCounts: React.FC = () => {
    const [maxPlayers, setMaxPlayers] = useState<number>(0);
    const [numPlayers, setNumPlayers] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [ip, setIp] = useState<string>('');
    const [port, setPort] = useState<number>(0);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid || null);
    const [customPort, setCustomPort] = useState<string | null>(null);
    const [customDomain, setCustomDomain] = useState<string>('');
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [serverDataLoading, setServerDataLoading] = useState<boolean>(true);
    const [eggGameMappings, setEggGameMappings] = useState<EggGameMappingData[]>([]);
    const [mappingsLoading, setMappingsLoading] = useState<boolean>(true);
    const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
    const [configurationReady, setConfigurationReady] = useState<boolean>(false);
    const [rconFeatureEnabled, setRconFeatureEnabled] = useState<boolean>(false);
    const [rconEnabled, setRconEnabled] = useState<boolean>(false);
    const [rconHost, setRconHost] = useState<string>('');
    const [rconPort, setRconPort] = useState<string>('');
    const [rconPassword, setRconPassword] = useState<string>('');
    const [rconType, setRconType] = useState<'source' | 'minecraft'>('source');
    const [rconCommand, setRconCommand] = useState<string>('status');
    const [panelMaxPlayers, setPanelMaxPlayers] = useState<number>(0);
    const fetchInProgressRef = useRef<boolean>(false);
    const consecutiveFailuresRef = useRef<number>(0);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const DEFAULT_API_URL = 'https://api.euphoriadevelopment.uk/gameapi';
    const [backendApiUrl, setBackendApiUrl] = useState<string>(DEFAULT_API_URL);
    const serverUuid = uuid;

    const shouldUseRconForCounts = (gameId: string | null): boolean => {
        return shouldUseRconForGame({
            gameId,
            rconFeatureEnabled,
            rconEnabled,
            host: rconHost,
            password: rconPassword,
            port: rconPort,
        });
    };

    const fetchCountsViaRcon = async (gameId: string): Promise<boolean> => {
        if (!shouldUseRconForCounts(gameId)) return false;

        const host = rconHost.trim();
        const password = rconPassword.trim();
        const parsedPort = parseRconPort(rconPort);
        const configuredCommand = rconCommand.trim();
        const command = configuredCommand !== '' && configuredCommand.toLowerCase() !== 'status'
            ? configuredCommand
            : getDefaultRconPlayersCommand(gameId);

        const payload = await postRconJson({
            endpoint: '/extensions/playerlisting/api/rcon/players',
            csrfToken,
            payload: {
                host,
                port: parsedPort,
                password,
                type: rconType,
                game: gameId,
                command,
                count_command: rconCommand.trim() || 'status',
                maxplayers_fallback: panelMaxPlayers > 0 ? panelMaxPlayers : null,
            },
            defaultErrorMessage: 'Failed to fetch RCON counts',
        });

        const gameData = payload.data || {};
        const max = Number(gameData.maxplayers);
        const current = Number(gameData.numplayers);
        const normalizedCurrent = Number.isFinite(current) && current >= 0 ? current : 0;
        setMaxPlayers((previousMax: number) => resolveStableMaxPlayers(max, panelMaxPlayers, previousMax, normalizedCurrent));
        setNumPlayers(normalizedCurrent);

        return true;
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
            setError('Failed to load game configuration');
        } finally {
            setMappingsLoading(false);
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

    const fetchRconConfig = async () => {
        try {
            const response = await fetch('/extensions/playerlisting/api/playerlisting/rcon-config', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRconFeatureEnabled(Boolean(data.enabled));
            } else {
                setRconFeatureEnabled(false);
            }
        } catch {
            setRconFeatureEnabled(false);
        }
    };

    const fetchMaxPlayersFromStartup = async (serverId: string): Promise<number | null> => {
        try {
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const response = await fetch(`${baseUrl}/api/client/servers/${serverId}/startup`, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) return null;
            const payload = await response.json();
            return extractMaxPlayersFromStartupPayload(payload);
        } catch {
            return null;
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

                setRconEnabled(Boolean(settings.rcon_enabled));
                if (typeof settings.rcon_host === 'string') {
                    setRconHost(settings.rcon_host);
                }
                if (typeof settings.rcon_port === 'string' || typeof settings.rcon_port === 'number') {
                    setRconPort(String(settings.rcon_port));
                }
                if (typeof settings.rcon_password === 'string') {
                    setRconPassword(settings.rcon_password);
                }
                if (settings.rcon_type === 'minecraft' || settings.rcon_type === 'source') {
                    setRconType(settings.rcon_type);
                }
                if (typeof settings.rcon_command === 'string' && settings.rcon_command.trim() !== '') {
                    setRconCommand(settings.rcon_command.trim());
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

    // Get game for current server based on egg ID
    const getGameForServer = (eggId: number): string | null => {
        console.log('Looking for egg ID:', eggId, 'in mappings:', eggGameMappings);
        
        // Handle string-based mappings in format "gameName_eggId_displayName_gameId"
        const mapping = eggGameMappings.find(mappingString => {
            if (typeof mappingString === 'string') {
                const parts = mappingString.split('_');
                if (parts.length >= 2) {
                    const mappingEggId = parseInt(parts[1], 10);
                    return mappingEggId === eggId;
                }
            } else if (mappingString && typeof mappingString === 'object') {
                // Handle object-based mappings
                return mappingString.egg_id === eggId;
            }
            return false;
        });
        
        console.log('Found mapping:', mapping);
        
        if (mapping) {
            if (typeof mapping === 'string') {
                // Parse string format: "gameName_eggId_displayName_gameId"
                const parts = mapping.split('_');
                if (parts.length >= 4) {
                    const gameId = parts[3];
                    console.log('Extracted game ID:', gameId);
                    return gameId;
                }
            } else if (mapping && typeof mapping === 'object') {
                // Handle object format
                return mapping.game_id;
            }
        }
        
        return null;
    };

    useEffect(() => {
        fetchEggGameMappings();
        fetchApiUrl();
        fetchRconConfig();
        loadUserSettings();
    }, []);

    useEffect(() => {
        const fetchServerData = async () => {
            if (!uuid) {
                setError('Server UUID is not available.');
                setServerDataLoading(false);
                return;
            }

            // Don't run if settings are still loading
            if (settingsLoading) {
                return;
            }

            try {
                const server = await getCachedServer(uuid, async () => {
                    const [resolvedServer] = await getServer(uuid);
                    return resolvedServer;
                });
                console.log('Server object:', server); // Debug log
                
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

                const extractedMaxPlayers = extractMaxPlayersFromPanelServer(server);
                if (extractedMaxPlayers !== null) {
                    setPanelMaxPlayers(extractedMaxPlayers);
                    console.log('Resolved max players from panel server variables:', extractedMaxPlayers);
                } else if (uuid) {
                    const startupMaxPlayers = await fetchMaxPlayersFromStartup(uuid);
                    if (startupMaxPlayers !== null) {
                        setPanelMaxPlayers(startupMaxPlayers);
                        console.log('Resolved max players from startup variables:', startupMaxPlayers);
                    }
                }
                
                // Get game from user settings first, then fall back to egg-game mapping
                if (!mappingsLoading && eggGameMappings.length > 0) {
                    // If user has selected a game in settings, use that
                    if (selectedGame) {
                        console.log('Using selected game from user settings:', selectedGame);
                        // Keep the user's selected game
                    } else {
                        // Fall back to egg-game mapping
                        const serverEggId = (server as any).BlueprintFramework?.eggId;
                        console.log('Server egg ID:', serverEggId); // Debug log
                        
                        if (serverEggId) {
                            const gameId = getGameForServer(serverEggId);
                            console.log('Mapped game ID:', gameId); // Debug log
                            setSelectedGame(gameId);
                        } else {
                            console.log('No server egg ID found');
                            setSelectedGame(null);
                        }
                    }
                }
                
                // Mark configuration as ready
                setConfigurationReady(true);
            } catch (err) {
                console.error('Failed to fetch server details:', err);
                setError('Failed to fetch server details.');
            } finally {
                setServerDataLoading(false);
            }
        };

        fetchServerData();
    }, [uuid, customDomain, customPort, mappingsLoading, eggGameMappings, selectedGame, settingsLoading]);

    useEffect(() => {
        const fetchPlayersFromAPI = async () => {
            if (serverDataLoading || mappingsLoading || settingsLoading || !configurationReady || !selectedGame) {
                return false;
            }

            if (fetchInProgressRef.current) {
                return false;
            }

            fetchInProgressRef.current = true;

            // Validate IP and port before making API call
            if (!ip || !port || ip.trim() === '' || port <= 0 || port > 65535) {
                console.warn('Invalid IP or port configuration:', { ip, port });
                setError('Invalid server configuration.');
                fetchInProgressRef.current = false;
                return false;
            }

            setLoading(true);
            setError(null);

            try {
                const usedRcon = await fetchCountsViaRcon(selectedGame);
                if (usedRcon) {
                    return true;
                }

                // Ensure IP doesn't have protocol prefix
                const cleanIp = ip.replace(/^https?:\/\//, '').trim();
                const targetURL = `/${selectedGame}/ip=${encodeURIComponent(cleanIp)}&port=${port}`;
                const apiURL = `${backendApiUrl}${targetURL}`;
                console.log('Making API call to:', apiURL); // Debug log
                
                // Add timeout to the fetch request
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

                let response: Response;
                try {
                    response = await fetch(apiURL, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                } finally {
                    clearTimeout(timeoutId);
                }

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.data) {
                    // Validate the response data
                    const maxPlayers = typeof data.data.maxplayers === 'number' ? data.data.maxplayers : 0;
                    const numPlayers = typeof data.data.numplayers === 'number' ? data.data.numplayers : 0;
                    let resolvedMaxPlayers = 0;
                    
                    setMaxPlayers((previousMax: number) => {
                        resolvedMaxPlayers = resolveStableMaxPlayers(maxPlayers, panelMaxPlayers, previousMax, numPlayers);
                        return resolvedMaxPlayers;
                    });
                    setNumPlayers(numPlayers);
                    console.log('Successfully fetched player data:', { numPlayers, maxPlayers: resolvedMaxPlayers });
                    return true;
                } else {
                    setError('Server is offline or not responding.');
                }

            } catch (err) {
                console.error('An error occurred while fetching player data:', err);
                
                // Provide more specific error messages
                if (err instanceof Error) {
                    if (err.name === 'AbortError') {
                        setError('Request timed out. Please check your server configuration.');
                    } else if (err.message.includes('fetch')) {
                        setError('Network error. Please check your connection and server settings.');
                    } else {
                        setError(`Failed to fetch player data: ${err.message}`);
                    }
                } else {
                    setError('An unknown error occurred while fetching player data.');
                }
            } finally {
                setLoading(false);
                fetchInProgressRef.current = false;
            }

            return false;
        };

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const scheduleNextPoll = (success: boolean) => {
            if (cancelled) return;

            if (success) {
                consecutiveFailuresRef.current = 0;
            } else {
                consecutiveFailuresRef.current += 1;
            }

            const failureCount = consecutiveFailuresRef.current;
            const baseDelay = success
                ? 20_000
                : Math.min(30_000 * (2 ** Math.min(Math.max(failureCount - 1, 0), 4)), 300_000);
            const jitter = Math.floor(Math.random() * 5_000);
            timer = setTimeout(poll, baseDelay + jitter);
        };

        const poll = async () => {
            if (cancelled) return;
            const success = await fetchPlayersFromAPI();
            scheduleNextPoll(Boolean(success));
        };

        poll();

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [serverDataLoading, mappingsLoading, settingsLoading, configurationReady, ip, port, selectedGame, backendApiUrl, panelMaxPlayers]);

    // Use StatBlock component for consistent styling
    return (
        <StatBlock icon={faUsers} title={'Players Online'}>
            {(() => {
                if (mappingsLoading || serverDataLoading || settingsLoading) return <span className="text-gray-400">Loading...</span>;
                if (!selectedGame) return <span className="text-gray-400">Not Setup</span>;
                if (loading) return <span className="text-gray-400">Loading...</span>;
                if (error) return <span className="text-red-400">Not Available</span>;
                return (
                    <span className="font-semibold text-gray-50">{numPlayers} / {maxPlayers}</span>
                );
            })()}
        </StatBlock>
    );
};

export default PlayerCounts;