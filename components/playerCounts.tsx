import React, { useState, useEffect } from 'react';
import getServer from '@/api/server/getServer';
import { ServerContext } from '@/state/server';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import StatBlock from '@/components/server/console/StatBlock';

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

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const DEFAULT_API_URL = 'https://api.euphoriadevelopment.uk/gameapi';
    const [backendApiUrl, setBackendApiUrl] = useState<string>(DEFAULT_API_URL);
    const serverUuid = uuid;

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
                const [server] = await getServer(uuid);
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
                return;
            }

            // Validate IP and port before making API call
            if (!ip || !port || ip.trim() === '' || port <= 0 || port > 65535) {
                console.warn('Invalid IP or port configuration:', { ip, port });
                setError('Invalid server configuration.');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Ensure IP doesn't have protocol prefix
                const cleanIp = ip.replace(/^https?:\/\//, '').trim();
                const targetURL = `/${selectedGame}/ip=${encodeURIComponent(cleanIp)}&port=${port}`;
                const apiURL = `${backendApiUrl}${targetURL}`;
                console.log('Making API call to:', apiURL); // Debug log
                
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

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.data) {
                    // Validate the response data
                    const maxPlayers = typeof data.data.maxplayers === 'number' ? data.data.maxplayers : 0;
                    const numPlayers = typeof data.data.numplayers === 'number' ? data.data.numplayers : 0;
                    
                    setMaxPlayers(maxPlayers);
                    setNumPlayers(numPlayers);
                    console.log('Successfully fetched player data:', { numPlayers, maxPlayers });
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
            }
        };

        fetchPlayersFromAPI();
        const interval = setInterval(fetchPlayersFromAPI, 20000);
        return () => clearInterval(interval);
    }, [serverDataLoading, mappingsLoading, settingsLoading, configurationReady, ip, port, selectedGame, backendApiUrl]);

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