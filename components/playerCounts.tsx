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
                
                if (settings.custom_domain) {
                    setCustomDomain(settings.custom_domain);
                }
                if (settings.custom_port) {
                    setCustomPort(settings.custom_port);
                }
                if (settings.selected_game) {
                    setSelectedGame(settings.selected_game);
                }
                
                console.log('Loaded user settings:', settings);
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

                // Use custom domain if set, otherwise use server's IP
                const serverIp = customDomain || server.sftpDetails.ip;
                const serverPort = customPort ? parseInt(customPort, 10) : defaultAllocation.port;
                
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
            if (serverDataLoading || mappingsLoading || settingsLoading || !configurationReady || !ip || !port || !selectedGame) return;

            setLoading(true);
            setError(null);

            try {
                const targetURL = `/${selectedGame}/ip=${ip}&port=${port}`;
                const apiURL = `${backendApiUrl}${targetURL}`;
                console.log('Making API call to:', apiURL); // Debug log
                const response = await fetch(apiURL);

                if (!response.ok) {
                    throw new Error('Failed to fetch player data.');
                }

                const data = await response.json();

                if (data.success && data.data) {
                    setMaxPlayers(data.data.maxplayers);
                    setNumPlayers(data.data.numplayers);
                } else {
                    setError('Server is offline.');
                }

            } catch (err) {
                console.error('An error occurred while fetching player data:', err);
                setError('An error occurred while fetching player data.');
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