<?php
// API routes for egg-game mappings (these will be accessible from the Blueprint admin interface)
Route::get('/admin/eggs', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getEggs'])->name('blueprint.extensions.playerlisting.eggs');
Route::get('/admin/egg-game-mappings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getEggGameMappings'])->name('blueprint.extensions.playerlisting.egg-game-mappings');
Route::post('/admin/egg-game-mappings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveEggGameMappings'])->name('blueprint.extensions.playerlisting.egg-game-mappings.save');

// API URL configuration routes
Route::get('/admin/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getApiUrl'])->name('blueprint.extensions.playerlisting.api-url');
Route::post('/admin/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveApiUrl'])->name('blueprint.extensions.playerlisting.api-url.save');
Route::delete('/admin/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'resetApiUrl'])->name('blueprint.extensions.playerlisting.api-url.reset');

// Frontend API URL access (accessible from server pages)
Route::get('/api/playerlisting/api-url', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getApiUrl'])->name('blueprint.extensions.playerlisting.frontend.api-url');

// User settings routes
Route::get('/api/user-settings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'getUserSettings'])->name('blueprint.extensions.playerlisting.user-settings');
Route::post('/api/user-settings', [Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting\playerlistingExtensionController::class, 'saveUserSettings'])->name('blueprint.extensions.playerlisting.user-settings.save');
?>