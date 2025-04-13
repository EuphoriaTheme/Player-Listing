import React, { useState, useEffect } from 'react';
import getServer from '@/api/server/getServer';
import { ServerContext } from '@/state/server';

const PlayerCounts: React.FC = () => {
    const [maxPlayers, setMaxPlayers] = useState<number>(0);
    const [numPlayers, setNumPlayers] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [ip, setIp] = useState<string>('');
    const [port, setPort] = useState<number>(0);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid || null);
    const [customPort, setCustomPort] = useState<string | null>(uuid ? localStorage.getItem(`${uuid}_customPort`) : null); // Load from localStorage
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [serverDataLoading, setServerDataLoading] = useState<boolean>(true);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const BACKEND_API_URL = (window as any).SiteConfiguration.api_url || 'https://euphoriatheme.uk/api';

    useEffect(() => {
        const fetchServerData = async () => {
            if (!uuid) {
                setError('Server UUID is not available.');
                setServerDataLoading(false);
                return;
            }

            try {
                const [server] = await getServer(uuid);
                const defaultAllocation = server.allocations.find((allocation) => allocation.isDefault);

                if (!defaultAllocation) {
                    throw new Error('No default allocation found for the server.');
                }

                setIp(server.sftpDetails.ip);
                setPort(customPort ? parseInt(customPort, 10) : defaultAllocation.port);
                setSelectedGame(localStorage.getItem(`${uuid}_selectedGame`));
            } catch (err) {
                console.error('Failed to fetch server details:', err);
                setError('Failed to fetch server details.');
            } finally {
                setServerDataLoading(false);
            }
        };

        fetchServerData();
    }, [uuid, customPort]);

    useEffect(() => {
        const fetchPlayersFromAPI = async () => {
            if (serverDataLoading || !ip || !port || !selectedGame) return;

            setLoading(true);
            setError(null);

            // Step 1: Fetch user profile data
            const profileResponse = await fetch('/extensions/playerlisting/user/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
            });

            if (!profileResponse.ok) {
                throw new Error('Failed to fetch user profile data.');
            }
    
            const profileData = await profileResponse.json();
            const { productId, hwid, licenseKey } = profileData;

            try {
                const targetURL = `/${selectedGame}/ip=${ip}&port=${port}`;
                const apiURL = `${BACKEND_API_URL}${targetURL}?productId=${encodeURIComponent(productId)}&hwid=${encodeURIComponent(hwid)}&licenseKey=${encodeURIComponent(licenseKey)}&source=${encodeURIComponent(window.location.hostname)}`;
                const response = await fetch(apiURL);

                if (!response.ok) {
                    throw new Error('Failed to fetch player data.');
                }

                const data = await response.json();

                if (selectedGame === 'minecraft') {
                    if (data.success && data.data) {
                        setMaxPlayers(data.data.maxplayers);
                        setNumPlayers(data.data.numplayers);
                    } else {
                        setError('Server is offline.');
                    }
                } else if (selectedGame === 'gta5f') {
                    setMaxPlayers(parseInt(data.data.maxPlayers, 10));
                    setNumPlayers(parseInt(data.data.numPlayers, 10));
                } else if (selectedGame === 'beammp') {
                    if (data.success && data.data) {
                        const parsedData = JSON.parse(data.data.replace(/\\/g, ''));
                        console.log(parsedData);
                        setMaxPlayers(parseInt(parsedData.maxplayers, 10));
                        setNumPlayers(parseInt(parsedData.players, 10));
                    } else {
                        setError('Server is offline.');
                    }
                } else {
                    if (data.success && data.data) {
                        setMaxPlayers(data.data.maxplayers);
                        setNumPlayers(data.data.numplayers);
                    } else {
                        setError('Server is offline.');
                    }
                }
            } catch (err) {
                console.error('An error occurred while fetching player data:', err);
                setError('An error occurred while fetching player data.');
            } finally {
                setLoading(false);
            }
        };

        // Fetch player data immediately and then every 20 seconds
        fetchPlayersFromAPI();
        const interval = setInterval(fetchPlayersFromAPI, 20000);

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [serverDataLoading, ip, port, selectedGame, BACKEND_API_URL]);

    if (!selectedGame) {
        return (
            <div
                className="style-module_2Vp6MaXq bg-gray-600 relative p-4 rounded serverid"
                id="server-id-container"
            >
                <div className="style-module_OFB5PMuf bg-gray-700 rounded"></div>
                <div className="style-module_1DtraXMW bg-gray-700 rounded">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        className="Icon___StyledSvg-sc-omsq29-0 ejRaBu text-gray-100"
                    >
                        <path
                            fill="#ffffff"
                            d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
                        />
                    </svg>
                </div>
                <div className="flex flex-col justify-center overflow-hidden w-full mt-2">
                    <p className="font-header leading-tight text-xs md:text-sm text-gray-200">Players Online</p>
                    <p
                        className="h-[1.75rem] w-full font-semibold text-gray-50 bg-transparent border-none outline-none"
                        style={{
                            fontSize: '115.625%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Not Setup
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div
                className="style-module_2Vp6MaXq bg-gray-600 relative p-4 rounded serverid"
                id="server-id-container"
            >
                <div className="style-module_OFB5PMuf bg-gray-700 rounded"></div>
                <div className="style-module_1DtraXMW bg-gray-700 rounded">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        className="Icon___StyledSvg-sc-omsq29-0 ejRaBu text-gray-100"
                    >
                        <path
                            fill="#ffffff"
                            d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
                        />
                    </svg>
                </div>
                <div className="flex flex-col justify-center overflow-hidden w-full mt-2">
                    <p className="font-header leading-tight text-xs md:text-sm text-gray-200">Players Online</p>
                    <p
                        className="h-[1.75rem] w-full font-semibold text-gray-50 bg-transparent border-none outline-none"
                        style={{
                            fontSize: '115.625%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="style-module_2Vp6MaXq bg-gray-600 relative p-4 rounded serverid"
                id="server-id-container"
            >
                <div className="style-module_OFB5PMuf bg-gray-700 rounded"></div>
                <div className="style-module_1DtraXMW bg-gray-700 rounded">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        className="Icon___StyledSvg-sc-omsq29-0 ejRaBu text-gray-100"
                    >
                        <path
                            fill="#ffffff"
                            d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
                        />
                    </svg>
                </div>
                <div className="flex flex-col justify-center overflow-hidden w-full mt-2">
                    <p className="font-header leading-tight text-xs md:text-sm text-gray-200">Players Online</p>
                    <p
                        className="h-[1.75rem] w-full font-semibold text-gray-50 bg-transparent border-none outline-none"
                        style={{
                            fontSize: '115.625%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Not Available
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="style-module_2Vp6MaXq bg-gray-600 relative p-4 rounded serverid"
            id="server-id-container"
        >
            <div className="style-module_OFB5PMuf bg-gray-700 rounded"></div>
            <div className="style-module_1DtraXMW bg-gray-700 rounded">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    className="Icon___StyledSvg-sc-omsq29-0 ejRaBu text-gray-100"
                >
                    <path
                        fill="#ffffff"
                        d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
                    />
                </svg>
            </div>
            <div className="flex flex-col justify-center overflow-hidden w-full mt-2">
                <p className="font-header leading-tight text-xs md:text-sm text-gray-200">Players Online</p>
                <p
                    className="h-[1.75rem] w-full font-semibold text-gray-50 bg-transparent border-none outline-none"
                    style={{
                        fontSize: '115.625%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {numPlayers} / {maxPlayers} Connected
                </p>
            </div>
        </div>
    );
};

export default PlayerCounts;