import React, { useState, useEffect, useMemo } from 'react';
import getServer, { Server } from '@/api/server/getServer';
import { ServerContext } from '@/state/server';
import ReactDOM from 'react-dom';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

// Define the full list of game options
const gameOptions = [
    { id: 'a2oa', name: 'ARMA 2: Operation Arrowhead' },
    { id: 'arma2', name: 'ARMA 2' },
    { id: 'arma3', name: 'ARMA 3' },
    { id: 'armareforger', name: 'ARMA: Reforger' },
    { id: 'armaresistance', name: 'ARMA: Resistance' },
    { id: 'asa', name: 'Ark: Survival Ascended' },
    { id: 'ase', name: 'Ark: Survival Evolved' },
    { id: 'atlas', name: 'Atlas' },
    { id: 'beammp', name: 'BeamMP (2021)' },
    { id: 'blackmesa', name: 'Black Mesa' },
    { id: 'counterstrike15', name: 'Counter-Strike 1.5' },
    { id: 'counterstrike16', name: 'Counter-Strike 1.6' },
    { id: 'counterstrike2', name: 'Counter-Strike 2' },
    { id: 'cscz', name: 'Counter-Strike: Condition Zero' },
    { id: 'csgo', name: 'Counter-Strike: Global Offensive' },
    { id: 'css', name: 'Counter-Strike: Source' },
    { id: 'dayz', name: 'DayZ' },
    { id: 'doi', name: 'Day of Infamy' },
    { id: 'eco', name: 'Eco' },
    { id: 'garrysmod', name: 'Garry\'s Mod' },
    { id: 'groundbreach', name: 'Ground Breach' },
    { id: 'gta5am', name: 'Grand Theft Auto V - alt:V Multiplayer' },
    { id: 'gta5f', name: 'Grand Theft Auto V - FiveM' },
    { id: 'gta5r', name: 'Grand Theft Auto V - RageMP' },
    { id: 'insurgency', name: 'Insurgency' },
    { id: 'insurgencysandstorm', name: 'Insurgency: Sandstorm' },
    { id: 'killingfloor', name: 'Killing Floor' },
    { id: 'killingfloor2', name: 'Killing Floor 2' },
    { id: 'l4d', name: 'Left 4 Dead' },
    { id: 'l4d2', name: 'Left 4 Dead 2' },
    { id: 'mordhau', name: 'Mordhau' },
    { id: 'minecraft', name: 'Minecraft' },
    { id: 'projectzomboid', name: 'Project Zomboid' },
    { id: 'rust', name: 'Rust' },
    { id: 'spaceengineers', name: 'Space Engineers' },
    { id: 'squad', name: 'Squad' },
    { id: 'starbound', name: 'Starbound' },
    { id: 'starmade', name: 'StarMade' },
    { id: 'theforest', name: 'The Forest' },
    { id: 'unturned', name: 'Unturned' },
    { id: 'valheim', name: 'Valheim' },
    { id: 'vrising', name: 'V Rising' },
];

// Define interfaces
interface Player {
    name: string;
    uuid: string;
    ping: number;
    discord?: string; // Optional properties for gta5f
    steam?: string;
    identifier?: string;
}
interface FiveMPlayer {
    endpoint: string;
    id: number;
    identifiers: string[];
    name: string;
    ping: number;
}
interface ApiResponse {
    online: boolean;
    maxplayers: number;
    players: { name: string; raw: { id: string } }[];
    connect: string;
    ping: number;
    numplayers: number;
}
interface FiveMResponse {
    players: FiveMPlayer[];
    sv_maxclients: number;
}

const fetchPlayers: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [maxPlayers, setMaxPlayers] = useState<number>(0);
    const [numPlayers, setNumPlayers] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [ip, setIp] = useState<string>('');
    const [port, setPort] = useState<number>(0);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid || null);
    const [customPort, setCustomPort] = useState<string | null>(null); // Initialize as null
    const [ping, setPing] = useState<number | null>(null);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [copiedUUIDs, setCopiedUUIDs] = useState<Record<string, boolean>>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [bannedPlayers, setBannedPlayers] = useState<BannedPlayerInfo[]>([]);
    const [showBannedModal, setShowBannedModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedBannedPlayer, setSelectedBannedPlayer] = useState<BannedPlayerInfo | null>(null);
    const [minecraftAvatars, setMinecraftAvatars] = useState<Record<string, string | null>>({});
    const [serverDataLoading, setServerDataLoading] = useState<boolean>(true);  // Loading state for fetchServerData
    const [kickBanReason, setKickBanReason] = useState<string>(''); // State for reason
    interface BannedPlayerInfo {
        uuid: string;
        name: string;
        created: string;
        source: string;
        expires: string;
        reason: string;
        avatarUrl?: string | null; // Optional avatar URL
    }

    const handleManageClick = (player: Player) => {
        setSelectedPlayer(player);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPlayer(null);
        setKickBanReason(''); // Clear reason on close
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
    
    const BACKEND_API_URL = (window as any).SiteConfiguration.api_url || 'https://api.euphoriatheme.uk/api';
  
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const serverUuid = uuid;

    useEffect(() => {
        const fetchData = async () => {
            await fetchServerData();
        };
    
        if (serverUuid) {
            const savedGame = localStorage.getItem(`${serverUuid}_selectedGame`);
            if (savedGame) setSelectedGame(savedGame);
            const savedPort = localStorage.getItem(`${serverUuid}_customPort`);
            if (savedPort) setCustomPort(savedPort);
            fetchData();
        } else {
            console.log('Server UUID is not available.');
        }
    }, [serverUuid]);
    
    useEffect(() => {
        const fetchPlayers = async () => {
            if (!serverDataLoading && ip && port && selectedGame) {
                await fetchPlayersFromAPI();
            }
        };
    
        fetchPlayers();
    }, [serverDataLoading, ip, port, selectedGame]);

    const fetchServerData = async () => {
        if (!serverUuid) {
            throw new Error('Server UUID is not available.');
        }

        setServerDataLoading(true);
        try {
            const [server] = await getServer(serverUuid);
            const defaultAllocation = server.allocations.find(allocation => allocation.isDefault);
            setIp(server.sftpDetails.ip);
            setPort(defaultAllocation?.port || server.allocations[0].port || 0);
        } catch (error) {
            console.error('Failed to fetch server details:', error);
            setError('Failed to fetch server details.');
        } finally {
            setServerDataLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchServerData();
        if (!serverDataLoading && ip && port && selectedGame) {
            fetchPlayersFromAPI();
        }
    };

    const fetchPlayersFromAPI = async () => {
        if (serverDataLoading || !ip || !port || !selectedGame) {
            console.log('Skipping fetchPlayersFromAPI due to incomplete data:', { serverDataLoading, ip, port, selectedGame });
            return; // Ensure fetchServerData completes and data is valid
        }
    
        setLoading(true);
        setError(null);
    
        try {
            const queryPort = customPort ? Number(customPort) : port;
    
            // Step 2: Construct the API URL
            const targetURL = `/${selectedGame}/ip=${ip}&port=${queryPort}`;
            const apiURL = `${BACKEND_API_URL}${targetURL}`;

    
            // Step 3: Make the API call with the forwarded data
            const response = await fetch(apiURL, {
                method: 'GET', // Use GET since we're sending data as query parameters
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log('API response:', data); // Log the API response for debugging
    
                if (selectedGame === 'minecraft') {
                    if (data.success && data.data) {
                        const gameData = data.data;
    
                        if (Array.isArray(gameData.players)) {
                            const updatedPlayers: Player[] = gameData.players.map((player: any) => ({
                                name: player.name,
                                uuid: '', // Will fetch separately if needed
                                ping: 0,
                            }));
    
                            setMaxPlayers(gameData.maxplayers);
                            setNumPlayers(gameData.numplayers);
                            setPing(gameData.ping);
    
                            // Fetch UUID and avatars for each player
                            for (let i = 0; i < gameData.players.length; i++) {
                                const playerName = gameData.players[i].name;
                                try {
                                    const uuidResponse = await fetch(`https://playerdb.co/api/player/minecraft/${playerName}`);
                                    if (uuidResponse.ok) {
                                        const uuidData = await uuidResponse.json();
                                        const playerUuid = uuidData?.data?.player?.id;
    
                                        if (playerUuid) {
                                            updatedPlayers[i].uuid = playerUuid;
    
                                            const avatarUrl = `https://crafatar.com/avatars/${playerUuid}?overlay=true`;
                                            setMinecraftAvatars((prevAvatars) => ({
                                                ...prevAvatars,
                                                [playerUuid]: avatarUrl,
                                            }));
                                        }
                                    }
                                } catch {
                                    continue;
                                }
                            }
    
                            setPlayers(updatedPlayers);
                        } else {
                            setError('No players found on the server.');
                        }
                    } else {
                        setError('Server is offline.');
                    }
                } else if (selectedGame === 'gta5f') {
                    if (data.success && data.data) {
                        const fivemData = data.data;
                        const players = fivemData.players.map((player: any) => {
                            return {
                                name: player.name,
                                uuid: player.uuid || 'unknown',
                                discord: player.discord,
                                steam: player.steam,
                                identifier: player.identifier,
                                ping: player.ping,
                            };
                        });                        
    
                        setPlayers(players);
                        setMaxPlayers(parseInt(fivemData.maxPlayers, 10));
                        setNumPlayers(parseInt(fivemData.numPlayers, 10));
                        setPing(data.ping || 0);
                    } else {
                        setError('Server is offline.');
                    }
                } else if (selectedGame === 'beammp') {
                    if (data.success && data.data) {
                        const beammpData = data.data;
    
                        // Assuming BeamMP returns a list of players and server info
                        setPlayers(beammpData.players.map((player: any) => ({
                            name: player.name,
                            uuid: player.uuid || 'unknown',
                            ping: player.ping || 0,
                        })));
                        setMaxPlayers(beammpData.maxplayers);
                        setNumPlayers(beammpData.players);
                        setPing(beammpData.ping);
                    } else {
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
                            uuid: player.raw.id,
                            ping: 0,
                        })));
                    } else {
                        setError('Server is offline.');
                    }
                }
            } else {
                throw new Error('Failed to fetch player data.');
            }
        } catch (err) {
            console.error('An error occurred while fetching player data:', err);
            setError('An error occurred while fetching player data.');
        } finally {
            setLoading(false);
        }
    };

    const saveCustomPort = () => {
        if (serverUuid) {
            localStorage.setItem(`${serverUuid}_customPort`, customPort || ''); // Use an empty string as fallback
            setPort(Number(customPort) || port); // Update the port state
        }
    };
    
    const resetCustomPort = () => {
        if (serverUuid) {
            localStorage.removeItem(`${serverUuid}_customPort`); // Remove from localStorage
        }
        setCustomPort(''); // Reset the custom port state
    };

    const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const gameId = e.target.value;
        setSelectedGame(gameId);
        if (serverUuid) {
            localStorage.setItem(`${serverUuid}_selectedGame`, gameId);
        }
    };

    const pingColor = useMemo(() => {
        if (ping === null) return 'transparent';
        if (ping < 50) return 'bg-green-500'; // Good ping
        if (ping < 100) return 'bg-orange-500'; // Moderate ping
        return 'bg-red-500'; // High ping
    }, [ping]);

    const handleCopy = (identifier: string, label: string) => {
        // Remove any prefix before ":" if it exists
        const cleanedIdentifier = identifier.includes(":") ? identifier.split(":")[1] : identifier;
    
        navigator.clipboard.writeText(cleanedIdentifier)
            .then(() => {
                setCopiedUUIDs(prev => ({ ...prev, [label]: true }));
                setTimeout(() => setCopiedUUIDs(prev => ({ ...prev, [label]: false })), 2000);
            })
            .catch((err) => console.error("Failed to copy identifier:", err));
    };   

    const handleUnbanPlayer = async (playerName: string) => {
        try {
            const serverId = uuid;
            const command = `pardon ${playerName}`;  // Minecraft unban command

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
            const command = `ban ${playerName} ${kickBanReason}`; // Include reason in command
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
            const serverId = uuid; // Use the server UUID from context or props
            const command = `op ${playerName}`; // Command to ban the player
            
            // Dynamically fetch the current domain
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
                console.log(`${playerName} has been Give OP.`);
            } else {
                console.error(`Failed to give OP to ${playerName}:`, response.statusText);
            }
        } catch (error) {
            console.error(`An error occurred while trying to OP ${playerName}:`, error);
        }
    };  

    const handleUnOpPlayer = async (playerName: string) => {
        try {
            const serverId = uuid; // Use the server UUID from context or props
            const command = `deop ${playerName}`; // Command to ban the player
            
            // Dynamically fetch the current domain
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
                console.log(`${playerName} has been Removed from OP.`);
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
                        const avatarUrl = `https://crafatar.com/avatars/${player.uuid}?overlay=true`;
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
            const command = `kick ${playerName} ${kickBanReason}`; // Include reason in command
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
    <ServerContentBlock title={'Logs'}>
        <div className="minecraft-players-container bg-gray-900 p-6 rounded-lg relative">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-header leading-tight text-md md:text-sm text-gray-200">
                Connected Players {numPlayers}/{maxPlayers}
            </h3>
            <div className="flex items-center space-x-2">
                <div className="flex items-center">
                    <div className={`${pingColor} w-4 h-4 rounded-full mr-2`}></div>
                    <span className="text-gray-200">{ping !== null ? `${ping} ms` : 'N/A'}</span>
                </div>
                <button
                    onClick={handleRefresh}
                    className="text-white hover:text-white focus:outline-none"
                    aria-label="Refresh server data"
                >
                    <i className="fa-solid fa-arrows-rotate"></i>
                </button>
            </div>
        </div>

            {/* Select Game Dropdown */}
            <div className="mt-4">
        <label htmlFor="game-select" className="block text-sm text-gray-200 mb-2">Select Game</label>
        <select
            id="game-select"
            value={selectedGame || ''}
            onChange={handleGameChange} // Ensure this is correctly linked
            className="w-full p-2 rounded bg-gray-900 text-white"
        >
            <option value="">Choose a game</option>
            {gameOptions.map(game => (
                <option key={game.id} value={game.id}>{game.name}</option>
            ))}
            </select>
        </div>

            {/* Custom Port Input */}
            <div className="custom-port-form mt-4 mb-4">
                <label htmlFor="custom-port" className="block text-sm text-gray-200 mb-2">Custom Query Port</label>
                <input
                    id="custom-port"
                    value={customPort || ''}
                    onChange={(e) => setCustomPort(e.target.value)}  
                    placeholder={String(port)}
                    className="w-full p-2 rounded bg-gray-900 text-white"
                />
                <div className="mt-2 flex justify-between">
                    <button onClick={saveCustomPort} className="bg-gray-900 text-white px-4 py-2 rounded">Save Port</button>
                    <button onClick={resetCustomPort} className="bg-gray-900 text-white px-4 py-2 rounded">Reset to Default</button>
                </div>
            </div>

            {loading && <p>Loading players...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {players.length > 0 && !loading && !error && (
            <ul className="players-list space-y-4">
            {players.map(player => (
            <li key={player.uuid} className="bg-gray-900 p-4 rounded-lg">
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
                        <span className="text-gray-300 text-sm">{player.ping} ms</span>
                    </div>
                    <div className="flex space-x-2">
                        {selectedGame === 'gta5f' ? (
                            <>
                                {player.uuid && (
                                    <button
                                        onClick={() => handleCopy(player.uuid, `${player.name}-fivem`)}
                                        className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                                    >
                                        {copiedUUIDs[`${player.name}-fivem`] ? "Copied!" : "Copy FiveM UUID"}
                                    </button>
                                )}
                                {player.discord && (
                                    <button
                                        onClick={() => handleCopy(player.discord!, `${player.name}-discord`)}
                                        className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                                    >
                                        {copiedUUIDs[`${player.name}-discord`] ? "Copied!" : "Copy Discord ID"}
                                    </button>
                                )}
                                {player.steam && (
                                    <button
                                        onClick={() => handleCopy(player.steam!, `${player.name}-steam`)}
                                        className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                                    >
                                        {copiedUUIDs[`${player.name}-steam`] ? "Copied!" : "Copy Steam ID"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => handleCopy(player.uuid, player.name)}
                                className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                            >
                                {copiedUUIDs[player.name] ? "Copied!" : "UUID"}
                            </button>
                        )}
                        {selectedGame === 'minecraft' ? (
                                <button
                                onClick={() => handleManageClick(player)}
                                className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
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
            {selectedGame === 'minecraft' ? (
                <button
                onClick={() => handleBansClick()}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded mt-4"
                >
                    View Banned Players
                </button>
            ) : null}

            {/* Modal for Player Actions */}
            {modalOpen && selectedPlayer && ReactDOM.createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-900 rounded-lg p-6 relative shadow-lg" style={{ width: '50rem', maxWidth: '90%' }}>
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                        <h2 className="text-lg text-white font-semibold mb-4">Manage {selectedPlayer.name}</h2>
                        
                        {/* Player's 3D Model */}
                        {selectedPlayer.uuid && (
                            <div className="flex justify-center mb-4">
                                <img
                                    src={`https://crafatar.com/renders/body/${selectedPlayer.uuid}?overlay=true`}
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
            {showBannedModal && ReactDOM.createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-900 rounded-lg p-6 relative shadow-lg" style={{ width: '50rem', maxWidth: '90%' }}>
                        <button onClick={closeBannedModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">×</button>
                        <h2 className="text-lg font-semibold mb-4 text-white">Banned Players</h2>
                        <ul>
                            {bannedPlayers.map((player) => (
                                <li key={player.uuid} className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        {player.avatarUrl && (
                                            <img src={player.avatarUrl} alt={player.name} className="w-8 h-8 rounded-full mr-2" />
                                        )}
                                        <span className="text-white">{player.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleUnbanPlayer(player.name)}
                                        className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                    >
                                        Unban
                                    </button>
                                    <button
                                            onClick={() => openInfoModal(player)}
                                            className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        >
                                            Reason
                                        </button>
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
                        <button onClick={closeInfoModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">×</button>
                        <h2 className="text-lg text-white font-semibold mb-4">Banned Player Information</h2>
                        <div className="space-y-2 text-white">
                            <p><strong>UUID:</strong> {selectedBannedPlayer.uuid}</p>
                            <p><strong>Name:</strong> {selectedBannedPlayer.name}</p>
                            <p><strong>Created:</strong> {selectedBannedPlayer.created}</p>
                            <p><strong>Source:</strong> {selectedBannedPlayer.source}</p>
                            <p><strong>Expires:</strong> {selectedBannedPlayer.expires}</p>
                            <p><strong>Reason:</strong> {selectedBannedPlayer.reason}</p>
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