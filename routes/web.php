<?php
// API routes for egg-game mappings (these will be accessible from the Blueprint admin interface)
Route::get('/admin/eggs', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getEggs'])->name('blueprint.extensions.playerlisting.eggs');
Route::get('/admin/egg-game-mappings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getEggGameMappings'])->name('blueprint.extensions.playerlisting.egg-game-mappings');
Route::post('/admin/egg-game-mappings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveEggGameMappings'])->name('blueprint.extensions.playerlisting.egg-game-mappings.save');

// API URL configuration routes
Route::get('/admin/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getApiUrl'])->name('blueprint.extensions.playerlisting.api-url');
Route::post('/admin/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveApiUrl'])->name('blueprint.extensions.playerlisting.api-url.save');
Route::delete('/admin/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'resetApiUrl'])->name('blueprint.extensions.playerlisting.api-url.reset');

// Crafatar URL configuration routes
Route::get('/admin/crafatar-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getCrafatarApiUrl'])->name('blueprint.extensions.playerlisting.crafatar-api-url');
Route::post('/admin/crafatar-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveCrafatarApiUrl'])->name('blueprint.extensions.playerlisting.crafatar-api-url.save');
Route::delete('/admin/crafatar-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'resetCrafatarApiUrl'])->name('blueprint.extensions.playerlisting.crafatar-api-url.reset');

// Console configuration routes
Route::get('/admin/console-config', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getConsoleConfig'])->name('blueprint.extensions.playerlisting.console-config');
Route::post('/admin/console-config', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveConsoleConfig'])->name('blueprint.extensions.playerlisting.console-config.save');

// RCON configuration routes
Route::get('/admin/rcon-config', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getRconConfig'])->name('blueprint.extensions.playerlisting.rcon-config');
Route::post('/admin/rcon-config', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveRconConfig'])->name('blueprint.extensions.playerlisting.rcon-config.save');

// Frontend API URL access (accessible from server pages)
Route::get('/api/playerlisting/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getApiUrl'])->name('blueprint.extensions.playerlisting.frontend.api-url');
Route::get('/api/playerlisting/crafatar-api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getCrafatarApiUrl'])->name('blueprint.extensions.playerlisting.frontend.crafatar-api-url');
Route::get('/api/playerlisting/console-config', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getConsoleConfig'])->name('blueprint.extensions.playerlisting.frontend.console-config');
Route::get('/api/playerlisting/rcon-config', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getRconConfig'])->name('blueprint.extensions.playerlisting.frontend.rcon-config');

// User settings routes
Route::get('/api/user-settings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getUserSettings'])->name('blueprint.extensions.playerlisting.user-settings');
Route::post('/api/user-settings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveUserSettings'])->name('blueprint.extensions.playerlisting.user-settings.save');
Route::post('/api/rcon/variables', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'fetchRconVariables'])->name('blueprint.extensions.playerlisting.rcon.variables');
Route::post('/api/rcon/players', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'fetchRconPlayers'])->name('blueprint.extensions.playerlisting.rcon.players');
