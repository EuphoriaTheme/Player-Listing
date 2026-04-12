<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Egg to Game Mapping</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="egg-select">Select Eggs</label>
                            <select id="egg-select" class="form-control" multiple size="8">
                                <option value="" disabled>Loading eggs...</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="game-search">Search Games</label>
                            <input type="text" id="game-search" class="form-control" placeholder="Search for games...">
                        </div>
                        <div class="form-group">
                            <label for="game-select">Select Game</label>
                            <select id="game-select" class="form-control" size="8">
                                <option value="" disabled>Loading games...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <div class="btn-group btn-group-sm">
                                <button type="button" id="prev-page" class="btn btn-default">Previous</button>
                                <button type="button" id="next-page" class="btn btn-default">Next</button>
                            </div>
                            <span id="page-info" class="text-muted ml-2">Page 1 of 1</span>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <button type="button" id="save-egg-game-mapping" class="btn btn-success">Save Mapping</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-xs-12">
        <div class="box box-info">
            <div class="box-header with-border">
                <h3 class="box-title">Current Mappings</h3>
            </div>
            <div class="box-body">
                <div id="egg-game-mapping-list">
                    <p class="text-muted">Loading mappings...</p>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-xs-12">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">Console Page Configuration</h3>
            </div>
            <div class="box-body">
                <div class="form-group">
                    <label class="checkbox-inline">
                        <input type="checkbox" id="show-console-players" value="1">
                        Show Player List on Console Page
                    </label>
                    <p class="help-block">
                        When enabled, the player list will be displayed on the server console page alongside the terminal.
                    </p>
                </div>
                <div class="form-group">
                    <button type="button" id="save-console-config" class="btn btn-success">Save Console Configuration</button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-xs-12">
        <div class="box box-danger">
            <div class="box-header with-border">
                <h3 class="box-title">RCON Configuration</h3>
            </div>
            <div class="box-body">
                <div class="form-group">
                    <label class="checkbox-inline">
                        <input type="checkbox" id="enable-rcon-user-settings" value="1">
                        Allow Users to Configure and Use RCON
                    </label>
                    <p class="help-block">
                        When enabled, users can set RCON details in their settings tab and fetch server variables through your API.
                    </p>
                </div>
                <div class="form-group">
                    <button type="button" id="save-rcon-config" class="btn btn-danger">Save RCON Configuration</button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-xs-12">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">API Configuration</h3>
            </div>
            <div class="box-body">
                <div class="form-group">
                    <label for="api-url">Custom API URL</label>
                    <input type="text" id="api-url" class="form-control" placeholder="https://api.euphoriadevelopment.uk/gameapi">
                    <p class="help-block">
                        Set a custom API URL for the game data service. Leave empty to use the default URL.
                        <br><strong>Default:</strong> https://api.euphoriadevelopment.uk/gameapi
                    </p>
                </div>
                <div class="form-group">
                    <button type="button" id="save-api-url" class="btn btn-warning">Save API URL</button>
                    <button type="button" id="reset-api-url" class="btn btn-default">Reset to Default</button>
                </div>
            </div>
            <div class="box-body">
                <div class="form-group">
                    <label for="crafatar-url">Custom Crafatar URL</label>
                    <input type="text" id="crafatar-url" class="form-control" placeholder="https://nitrocraft.uk">
                    <p class="help-block">
                        Set a custom API URL for the Crafatar service. Leave empty to use the default URL.
                        <br><strong>Default:</strong> https://nitrocraft.uk
                    </p>
                </div>
                <div class="form-group">
                    <button type="button" id="save-crafatar-url" class="btn btn-warning">Save API URL</button>
                    <button type="button" id="reset-crafatar-url" class="btn btn-default">Reset to Default</button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.mapping-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin: 5px 0;
    background: #302e2eff;
    border-radius: 4px;
    border: 1px solid #ddd;
}

.mapping-info {
    flex: 1;
    display: flex;
    align-items: center;
}

.mapping-info strong {
    color: #ffffff;
}

.mapping-info small {
    color: #666;
    display: block;
    margin-top: 2px;
}

.game-image {
    width: 32px;
    height: 32px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 10px;
    border: 1px solid #ddd;
}

.game-image-placeholder {
    width: 32px;
    height: 32px;
    background-color: #ccc;
    border-radius: 4px;
    margin-right: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
    color: #666;
    font-size: 12px;
}

.game-image-placeholder::after {
    content: "?";
    font-weight: bold;
}

.btn-danger {
    background-color: #d9534f;
    border-color: #d43f3a;
}

.btn-danger:hover {
    background-color: #c9302c;
    border-color: #ac2925;
}

#egg-select, #game-select {
    min-height: 180px;
}

.btn-group {
    margin-top: 10px;
}

.text-muted {
    margin-left: 10px;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', async function () {
    const eggSelect = document.getElementById('egg-select');
    const gameSelect = document.getElementById('game-select');
    const gameSearch = document.getElementById('game-search');
    const saveButton = document.getElementById('save-egg-game-mapping');
    const mappingList = document.getElementById('egg-game-mapping-list');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // Use direct URLs for the endpoints
    const eggsUrl = "/extensions/playerlisting/admin/eggs";
    const mappingsUrl = "/extensions/playerlisting/admin/egg-game-mappings";

    console.log('Eggs URL:', eggsUrl);
    console.log('Mappings URL:', mappingsUrl);

    let eggs = [];
    let games = [];
    let filteredGames = [];
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;

    // Fetch eggs
    const fetchEggs = async () => {
        try {
            console.log('Fetching eggs from:', eggsUrl);
            const csrfToken = '{{ csrf_token() }}';
            console.log('CSRF token:', csrfToken);
            
            const response = await fetch(eggsUrl, { 
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`Failed to fetch eggs: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (!data.eggs || !Array.isArray(data.eggs)) {
                throw new Error('Invalid eggs data received');
            }
            return data.eggs;
        } catch (e) {
            console.error('Error loading eggs:', e);
            alert('Error loading eggs: ' + e.message);
            return [];
        }
    };

    // Fetch games
    const fetchGames = async () => {
        try {
            // Use the configured API URL (if set) so the admin mapping UI matches the frontend.
            const csrfToken = '{{ csrf_token() }}';
            let apiBaseUrl = 'https://api.euphoriadevelopment.uk/gameapi';

            try {
                const apiUrlResponse = await fetch(apiUrlEndpoint, {
                    method: 'GET',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });

                if (apiUrlResponse.ok) {
                    const apiUrlData = await apiUrlResponse.json();
                    const customApiUrl = (apiUrlData.api_url || '').trim();
                    if (customApiUrl) {
                        apiBaseUrl = customApiUrl.replace(/\/+$/, '');
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch custom API URL, using default.', e);
            }

            const response = await fetch(`${apiBaseUrl}/`, { method: 'GET' });
            if (!response.ok) {
                throw new Error('Failed to fetch games');
            }
            const data = await response.json();
            // The API returns an object with game names as keys, and {id, image} as value
            // Convert to array of { name, id, image }
            return Object.entries(data).map(([name, value]) => ({ name, id: value.id, image: value.image }));
        } catch (e) {
            console.error('Error loading games:', e);
            alert('Error loading games: ' + e.message);
            return [];
        }
    };

    // Fetch mappings
    const fetchMappings = async () => {
        try {
            const response = await fetch(mappingsUrl, { 
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch mappings');
            }
            const data = await response.json();
            return data.mappings || [];
        } catch (e) {
            console.error('Error loading mappings:', e);
            return [];
        }
    };

    // Populate eggs dropdown
    const populateEggs = (eggs) => {
        eggSelect.innerHTML = '';
        if (!eggs.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No eggs found';
            option.disabled = true;
            eggSelect.appendChild(option);
            return;
        }
        eggs.forEach(egg => {
            if (egg && egg.id && egg.name) {
                const option = document.createElement('option');
                option.value = egg.id;
                option.textContent = egg.name;
                eggSelect.appendChild(option);
            }
        });
    };

    // Paginate and populate games dropdown
    const updateGameDropdown = () => {
        gameSelect.innerHTML = '';
        totalPages = Math.ceil(filteredGames.length / pageSize) || 1;
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        
        const gamesToShow = filteredGames.slice(start, end);
        
        if (gamesToShow.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No games found';
            option.disabled = true;
            gameSelect.appendChild(option);
        } else {
            gamesToShow.forEach(game => {
                const option = document.createElement('option');
                option.value = game.id;
                option.textContent = game.name;
                option.setAttribute('data-image', game.image || '');
                gameSelect.appendChild(option);
            });
        }
        
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    };

    // Search filter
    gameSearch.addEventListener('input', () => {
        const query = gameSearch.value.toLowerCase();
        filteredGames = games.filter(game => game.name.toLowerCase().includes(query));
        currentPage = 1;
        updateGameDropdown();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateGameDropdown();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateGameDropdown();
        }
    });

    const getEggIdFromMapping = (mapping) => {
        if (!mapping) return null;

        if (typeof mapping === 'string') {
            const parts = mapping.split('_');
            if (parts.length >= 2) {
                const eggId = parseInt(parts[1], 10);
                return isNaN(eggId) ? null : eggId;
            }
            return null;
        }

        if (typeof mapping === 'object' && mapping.egg_id !== undefined) {
            const eggId = parseInt(mapping.egg_id, 10);
            return isNaN(eggId) ? null : eggId;
        }

        return null;
    };

    // Save mapping
    saveButton.addEventListener('click', async () => {
        const selectedEggOptions = Array.from(eggSelect.selectedOptions);
        const selectedEggs = selectedEggOptions.map(opt => ({ id: opt.value, name: opt.textContent }));
        const selectedGameOption = gameSelect.selectedOptions[0];
        
        if (!selectedEggs.length || !selectedGameOption) {
            alert('Please select at least one Egg and a Game.');
            return;
        }
        
        const selectedGameId = selectedGameOption.value;
        const selectedGameName = selectedGameOption.textContent;
        const csrfToken = '{{ csrf_token() }}';
        const selectedEggIds = new Set(selectedEggs.map(egg => parseInt(egg.id, 10)).filter(id => !isNaN(id)));
        
        // Get existing mappings
        const existingMappings = await fetchMappings();
        const filteredExistingMappings = Array.isArray(existingMappings)
            ? existingMappings.filter(m => {
                const eggId = getEggIdFromMapping(m);
                return eggId === null || !selectedEggIds.has(eggId);
            })
            : [];
        
        // Add new mappings
        const newMappings = selectedEggs.map(egg => `${egg.name}_${egg.id}_${selectedGameName}_${selectedGameId}`);
        const allMappings = [...filteredExistingMappings, ...newMappings];
        
        try {
            const response = await fetch(mappingsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ mappings: allMappings }),
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Mapping saved successfully!');
                await populateMappings();
                // Clear selections
                eggSelect.selectedIndex = -1;
                gameSelect.selectedIndex = -1;
            } else {
                alert('Error saving mapping: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error saving mapping:', e);
            alert('Error saving mapping: ' + e.message);
        }
    });

    // Delete mapping
    const deleteMapping = async (eggIdToDelete) => {
        if (!confirm('Are you sure you want to delete this mapping?')) return;
        
        try {
            // Fetch all mappings, remove the selected one, and save
            let mappings = await fetchMappings();
            mappings = Array.isArray(mappings)
                ? mappings.filter(m => getEggIdFromMapping(m) !== eggIdToDelete)
                : [];
            
            const csrfToken = '{{ csrf_token() }}';
            const response = await fetch(mappingsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ mappings }),
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Mapping deleted successfully!');
                await populateMappings();
            } else {
                alert('Error deleting mapping: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error deleting mapping:', e);
            alert('Error deleting mapping: ' + e.message);
        }
    };

    // Populate mappings list (show all, with delete buttons)
    const populateMappings = async () => {
        const mappings = await fetchMappings();
        mappingList.innerHTML = '';
        
        if (!Array.isArray(mappings) || mappings.length === 0) {
            mappingList.innerHTML = '<p class="text-muted">No mappings found. Create your first mapping above.</p>';
            return;
        }
        
        // Create a lookup map for game images
        const gameImageMap = {};
        games.forEach(game => {
            gameImageMap[game.id] = game.image;
        });
        
        mappings.forEach(mapping => {
            let eggName = null;
            let eggId = null;
            let gameName = null;
            let gameId = null;

            if (typeof mapping === 'string') {
                const parts = mapping.split('_');
                if (parts.length >= 4) {
                    eggName = parts[0];
                    eggId = parseInt(parts[1], 10);
                    gameName = parts[2];
                    gameId = parts[3];
                }
            } else if (mapping && typeof mapping === 'object') {
                eggId = parseInt(mapping.egg_id, 10);
                gameId = mapping.game_id;
                gameName = mapping.game_name;
                eggName = (eggs.find(e => parseInt(e.id, 10) === eggId)?.name) || 'Egg';
            }

            if (!eggId || !gameId || !gameName) return;

            const gameImage = gameImageMap[gameId];
                
                const div = document.createElement('div');
                div.className = 'mapping-item';
                
                // Build the image HTML if image exists
                const imageHtml = gameImage ? 
                    `<img src="${gameImage}" alt="${gameName}" class="game-image" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; margin-right: 10px;">` : 
                    '<div class="game-image-placeholder" style="width: 32px; height: 32px; background-color: #ccc; border-radius: 4px; margin-right: 10px; display: inline-block;"></div>';
                
                div.innerHTML = `
                    <div class="mapping-info" style="display: flex; align-items: center;">
                        ${imageHtml}
                        <div>
                            <strong>${eggName}</strong> (ID: ${eggId})
                            <small>-> ${gameName} (${gameId})</small>
                        </div>
                    </div>
                    <button class="btn btn-danger btn-sm delete-mapping" data-egg-id="${eggId}">Delete</button>
                `;
                
                mappingList.appendChild(div);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-mapping').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eggId = parseInt(e.target.getAttribute('data-egg-id'), 10);
                if (isNaN(eggId)) return;
                deleteMapping(eggId);
            });
        });
    };

    // API URL Management
    const apiUrlInput = document.getElementById('api-url');
    const saveApiUrlBtn = document.getElementById('save-api-url');
    const resetApiUrlBtn = document.getElementById('reset-api-url');
    const apiUrlEndpoint = '/extensions/playerlisting/admin/api-url';

    // Crafatar URL Management
    const crafatarUrlInput = document.getElementById('crafatar-url');
    const saveCrafatarUrlBtn = document.getElementById('save-crafatar-url');
    const resetCrafatarUrlBtn = document.getElementById('reset-crafatar-url');
    const crafatarUrlEndpoint = '/extensions/playerlisting/admin/crafatar-url';

    // Console Configuration Management
    const showConsolePlayersCheckbox = document.getElementById('show-console-players');
    const saveConsoleConfigBtn = document.getElementById('save-console-config');
    const consoleConfigEndpoint = '/extensions/playerlisting/admin/console-config';

    // RCON Configuration Management
    const enableRconUserSettingsCheckbox = document.getElementById('enable-rcon-user-settings');
    const saveRconConfigBtn = document.getElementById('save-rcon-config');
    const rconConfigEndpoint = '/extensions/playerlisting/admin/rcon-config';

    // Fetch current API URL
    const fetchApiUrl = async () => {
        try {
            const csrfToken = '{{ csrf_token() }}';
            const response = await fetch(apiUrlEndpoint, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                apiUrlInput.value = data.api_url || '';
            }
        } catch (e) {
            console.error('Error fetching API URL:', e);
        }
    };

    // Fetch current Crafatar API URL
    const fetchCrafatarApiUrl = async () => {
        try {
            const csrfToken = '{{ csrf_token() }}';
            const response = await fetch(crafatarUrlEndpoint, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                crafatarUrlInput.value = data.api_url || '';
            }
        } catch (e) {
            console.error('Error fetching Crafatar API URL:', e);
        }
    };

    // Fetch current console configuration
    const fetchConsoleConfig = async () => {
        try {
            const csrfToken = '{{ csrf_token() }}';
            const response = await fetch(consoleConfigEndpoint, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                showConsolePlayersCheckbox.checked = data.show_console_players || false;
            }
        } catch (e) {
            console.error('Error fetching console config:', e);
        }
    };

    // Fetch current RCON configuration
    const fetchRconConfig = async () => {
        try {
            const csrfToken = '{{ csrf_token() }}';
            const response = await fetch(rconConfigEndpoint, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                enableRconUserSettingsCheckbox.checked = data.enabled || false;
            }
        } catch (e) {
            console.error('Error fetching RCON config:', e);
        }
    };

    // Save API URL
    saveApiUrlBtn.addEventListener('click', async () => {
        const apiUrl = apiUrlInput.value.trim();
        const csrfToken = '{{ csrf_token() }}';
        
        try {
            const response = await fetch(apiUrlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ api_url: apiUrl }),
            });
            
            const data = await response.json();
            if (data.success) {
                alert('API URL saved successfully!');
            } else {
                alert('Error saving API URL: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error saving API URL:', e);
            alert('Error saving API URL: ' + e.message);
        }
    });

    // Save Crafatar API URL
    saveCrafatarUrlBtn.addEventListener('click', async () => {
        const crafatarApiUrl = crafatarUrlInput.value.trim();
        const csrfToken = '{{ csrf_token() }}';
        
        try {
            const response = await fetch(crafatarUrlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ api_url: crafatarApiUrl }),
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Crafatar API URL saved successfully!');
            } else {
                alert('Error saving Crafatar API URL: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error saving Crafatar API URL:', e);
            alert('Error saving Crafatar API URL: ' + e.message);
        }
    });

    // Save Console Configuration
    saveConsoleConfigBtn.addEventListener('click', async () => {
        const showConsolePlayers = showConsolePlayersCheckbox.checked;
        const csrfToken = '{{ csrf_token() }}';
        
        try {
            const response = await fetch(consoleConfigEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ show_console_players: showConsolePlayers }),
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Console configuration saved successfully!');
            } else {
                alert('Error saving console configuration: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error saving console configuration:', e);
            alert('Error saving console configuration: ' + e.message);
        }
    });

    // Save RCON Configuration
    saveRconConfigBtn.addEventListener('click', async () => {
        const enabled = enableRconUserSettingsCheckbox.checked;
        const csrfToken = '{{ csrf_token() }}';

        try {
            const response = await fetch(rconConfigEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ enabled }),
            });

            const data = await response.json();
            if (data.success) {
                alert('RCON configuration saved successfully!');
            } else {
                alert('Error saving RCON configuration: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error saving RCON configuration:', e);
            alert('Error saving RCON configuration: ' + e.message);
        }
    });

    // Reset API URL
    resetApiUrlBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to reset the API URL to default?')) return;
        
        const csrfToken = '{{ csrf_token() }}';
        
        try {
            const response = await fetch(apiUrlEndpoint, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (data.success) {
                apiUrlInput.value = '';
                alert('API URL reset to default successfully!');
            } else {
                alert('Error resetting API URL: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error resetting API URL:', e);
            alert('Error resetting API URL: ' + e.message);
        }
    });

    // Reset Crafatar API URL
    resetCrafatarUrlBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to reset the Crafatar API URL to default?')) return;
        
        const csrfToken = '{{ csrf_token() }}';
        
        try {
            const response = await fetch(crafatarUrlEndpoint, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (data.success) {
                crafatarUrlInput.value = '';
                alert('Crafatar API URL reset to default successfully!');
            } else {
                alert('Error resetting Crafatar API URL: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error resetting Crafatar API URL:', e);
            alert('Error resetting Crafatar API URL: ' + e.message);
        }
    });

    // Initial load
    try {
        eggs = await fetchEggs();
        console.log('Loaded eggs:', eggs);
    } catch (e) {
        console.error('Failed to load eggs:', e);
        alert('Failed to load eggs.');
        eggs = [];
    }
    
    try {
        games = await fetchGames();
        console.log('Loaded games:', games);
    } catch (e) {
        console.error('Failed to load games:', e);
        alert('Failed to load games.');
        games = [];
    }
    
    filteredGames = games;
    populateEggs(eggs);
    updateGameDropdown();
    
    try {
        await populateMappings();
    } catch (e) {
        console.error('Failed to load mappings:', e);
        alert('Failed to load mappings.');
    }
    
    // Load current API URL
    try {
        await fetchApiUrl();
    } catch (e) {
        console.error('Failed to load API URL:', e);
    }

    // Load current Crafatar API URL
    try {
        await fetchCrafatarApiUrl();
    } catch (e) {
        console.error('Failed to load Crafatar API URL:', e);
    }

    // Load current console configuration
    try {
        await fetchConsoleConfig();
    } catch (e) {
        console.error('Failed to load console configuration:', e);
    }

    // Load current RCON configuration
    try {
        await fetchRconConfig();
    } catch (e) {
        console.error('Failed to load RCON configuration:', e);
    }
});
</script>
