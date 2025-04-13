<?php
Route::get('/user/profile', [Pterodactyl\Http\Controllers\Admin\Extensions\{identifier}\{identifier}ExtensionController::class, 'fetchProfile'])->name('blueprint.extensions.playerlisting.wrapper.user.profile');

Route::get('/admin/licensing', [Pterodactyl\Http\Controllers\Admin\Extensions\{identifier}\{identifier}ExtensionController::class, 'showLicenseForm'])->name('blueprint.extensions.playerlisting.wrapper.admin.licensing');
Route::post('/admin/licensing', [Pterodactyl\Http\Controllers\Admin\Extensions\{identifier}\{identifier}ExtensionController::class, 'saveLicense'])->name('blueprint.extensions.playerlisting.wrapper.admin.license.submit');

Route::get('/admin/settings', [Pterodactyl\Http\Controllers\Admin\Extensions\{identifier}\{identifier}ExtensionController::class, 'index'])->name('blueprint.extensions.playerlisting.wrapper.admin.themeCustomiser');
Route::post('/admin/save-settings', [Pterodactyl\Http\Controllers\Admin\Extensions\{identifier}\{identifier}ExtensionController::class, 'update'])->name('blueprint.extensions.playerlisting.wrapper.admin.themeCustomiser.save');
?>