<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\playerlisting;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\View\View;
use Illuminate\Support\Facades\File;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;

class playerlistingExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private ConfigRepository $config,
        private SettingsRepositoryInterface $settings,
    ){}

    public function index(): View
    {
        return $this->view->make('admin.extensions.playerlisting.index', [
            'blueprint' => $this->blueprint
        ]);
    }

    public function getEggs(): \Illuminate\Http\JsonResponse
    {
        try {
            $eggs = Egg::select('id', 'name')->get();
            return response()->json(['eggs' => $eggs]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch eggs'], 500);
        }
    }

    public function getEggGameMappings(): \Illuminate\Http\JsonResponse
    {
        try {
            $mappings = $this->settings->get('playerlisting::egg_game_mappings', []);
            if (is_string($mappings)) {
                $mappings = json_decode($mappings, true) ?? [];
            }
            return response()->json(['mappings' => $mappings]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch mappings'], 500);
        }
    }

    public function saveEggGameMappings(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $mappings = $request->input('mappings', []);
            $this->settings->set('playerlisting::egg_game_mappings', json_encode($mappings));
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save mappings'], 500);
        }
    }

    public function getUserSettings(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $serverUuid = $request->input('server_uuid');

            // Prefer the authenticated user rather than trusting user-provided identifiers.
            // Keep a legacy fallback to avoid breaking existing installs that stored settings
            // under the hardcoded "current_user" key.
            $requestedUserUuid = $request->input('user_uuid');
            $userUuid = Auth::user()?->uuid ?? $requestedUserUuid;
            
            if (!$serverUuid) {
                return response()->json(['error' => 'Server UUID is required'], 400);
            }

            if (!$userUuid) {
                return response()->json(['error' => 'User UUID is required'], 400);
            }

            $settingsKey = "playerlisting::user_settings_{$userUuid}_{$serverUuid}";
            $settings = $this->settings->get($settingsKey, []);

            // Legacy fallback: if nothing was found under the authenticated key, try the
            // explicitly-requested key (e.g. "current_user") so older data continues to work.
            if ((empty($settings) || $settings === '[]' || $settings === '{}') && $requestedUserUuid && $requestedUserUuid !== $userUuid) {
                $legacyKey = "playerlisting::user_settings_{$requestedUserUuid}_{$serverUuid}";
                $legacySettings = $this->settings->get($legacyKey, []);
                if (!empty($legacySettings)) {
                    $settings = $legacySettings;
                }
            }
            
            if (is_string($settings)) {
                $settings = json_decode($settings, true) ?? [];
            }

            return response()->json(['settings' => $settings]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch user settings'], 500);
        }
    }

    public function saveUserSettings(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $serverUuid = $request->input('server_uuid');
            $customDomain = $request->input('custom_domain');
            $customPort = $request->input('custom_port');
            $selectedGame = $request->input('selected_game');
            $rconEnabled = filter_var($request->input('rcon_enabled', false), FILTER_VALIDATE_BOOLEAN);
            $rconHost = $request->input('rcon_host');
            $rconPort = $request->input('rcon_port');
            $rconPassword = $request->input('rcon_password');
            $rconType = $request->input('rcon_type', 'source');
            $rconCommand = $request->input('rcon_command');

            // Prefer the authenticated user rather than trusting user-provided identifiers.
            $requestedUserUuid = $request->input('user_uuid');
            $userUuid = Auth::user()?->uuid ?? $requestedUserUuid;
            
            if (!$serverUuid) {
                return response()->json(['error' => 'Server UUID is required'], 400);
            }

            if (!$userUuid) {
                return response()->json(['error' => 'User UUID is required'], 400);
            }

            $settings = [
                'custom_domain' => $customDomain,
                'custom_port' => $customPort,
                'selected_game' => $selectedGame,
                'rcon_enabled' => $rconEnabled,
                'rcon_host' => $rconEnabled ? $rconHost : null,
                'rcon_port' => $rconEnabled ? $rconPort : null,
                'rcon_password' => $rconEnabled ? $rconPassword : null,
                'rcon_type' => $rconEnabled ? $rconType : null,
                'rcon_command' => $rconEnabled ? $rconCommand : null,
                'updated_at' => now()->toISOString(),
            ];

            $settingsKey = "playerlisting::user_settings_{$userUuid}_{$serverUuid}";
            $this->settings->set($settingsKey, json_encode($settings));

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save user settings'], 500);
        }
    }

    public function getCrafatarApiUrl(): \Illuminate\Http\JsonResponse
    {
        try {
            $apiUrl = $this->settings->get('playerlisting::crafatar_api_url', '');
            return response()->json(['api_url' => $apiUrl]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch CRAFATAR API URL'], 500);
        }
    }

    public function saveCrafatarApiUrl(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $apiUrl = $request->input('api_url', '');
            $this->settings->set('playerlisting::crafatar_api_url', $apiUrl);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save CRAFATAR API URL'], 500);
        }
    }

    public function resetCrafatarApiUrl(): \Illuminate\Http\JsonResponse
    {
        try {
            $this->settings->forget('playerlisting::crafatar_api_url');
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to reset CRAFATAR API URL'], 500);
        }
    }

    public function getApiUrl(): \Illuminate\Http\JsonResponse
    {
        try {
            $apiUrl = $this->settings->get('playerlisting::api_url', '');
            return response()->json(['api_url' => $apiUrl]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch API URL'], 500);
        }
    }

    public function saveApiUrl(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $apiUrl = $request->input('api_url', '');
            $this->settings->set('playerlisting::api_url', $apiUrl);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save API URL'], 500);
        }
    }

    public function resetApiUrl(): \Illuminate\Http\JsonResponse
    {
        try {
            $this->settings->forget('playerlisting::api_url');
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to reset API URL'], 500);
        }
    }

    public function getConsoleConfig(): \Illuminate\Http\JsonResponse
    {
        try {
            $showConsolePlayers = $this->settings->get('playerlisting::show_console_players', false);
            return response()->json(['show_console_players' => (bool)$showConsolePlayers]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch console configuration'], 500);
        }
    }

    public function saveConsoleConfig(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $showConsolePlayers = $request->input('show_console_players', false);
            $this->settings->set('playerlisting::show_console_players', (bool)$showConsolePlayers);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save console configuration'], 500);
        }
    }

    public function getRconConfig(): \Illuminate\Http\JsonResponse
    {
        try {
            $enabled = $this->settings->get('playerlisting::rcon_enabled', false);
            return response()->json(['enabled' => (bool) $enabled]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch RCON configuration'], 500);
        }
    }

    public function saveRconConfig(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $enabled = filter_var($request->input('enabled', false), FILTER_VALIDATE_BOOLEAN);
            $this->settings->set('playerlisting::rcon_enabled', $enabled);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save RCON configuration'], 500);
        }
    }

    public function fetchRconVariables(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $rconEnabled = (bool) $this->settings->get('playerlisting::rcon_enabled', false);
            if (!$rconEnabled) {
                return response()->json(['success' => false, 'error' => 'RCON is disabled by admin.'], 403);
            }

            $host = trim((string) $request->input('host', ''));
            $password = (string) $request->input('password', '');
            $port = (int) $request->input('port', 0);
            $type = trim((string) $request->input('type', 'source'));
            $command = trim((string) $request->input('command', 'status'));

            if ($host === '' || $password === '' || $port < 1 || $port > 65535) {
                return response()->json(['success' => false, 'error' => 'Valid host, port, and password are required.'], 422);
            }

            $apiUrl = trim((string) $this->settings->get('playerlisting::api_url', ''));
            $apiBase = $apiUrl !== '' ? preg_replace('#/gameapi/?$#', '', $apiUrl) : 'https://api.euphoriadevelopment.uk';
            $target = rtrim((string) $apiBase, '/') . '/rcon/variables';

            $response = Http::acceptJson()->timeout(12)->post($target, [
                'host' => $host,
                'port' => $port,
                'password' => $password,
                'type' => $type !== '' ? $type : 'source',
                'command' => $command !== '' ? $command : 'status',
            ]);

            $contentType = strtolower((string) $response->header('Content-Type', ''));
            $isJson = str_contains($contentType, 'application/json') || str_contains($contentType, 'text/json');

            if (!$response->successful()) {
                $error = null;

                if ($isJson) {
                    $error = $response->json('error');
                }

                if (!is_string($error) || trim($error) === '') {
                    $body = trim((string) $response->body());
                    if ($body !== '') {
                        if (preg_match('/<title>(.*?)<\/title>/is', $body, $matches)) {
                            $error = trim(html_entity_decode(strip_tags((string) ($matches[1] ?? ''))));
                        } else {
                            $error = trim(substr(strip_tags($body), 0, 200));
                        }
                    }
                }

                if (!is_string($error) || trim($error) === '') {
                    $error = 'Failed to fetch RCON variables.';
                }

                if (is_string($error) && preg_match('/Failed all\s+\d+\s+attempts/i', $error)) {
                    $error = 'RCON is unreachable. The game server may be offline, the RCON port closed, or credentials/type are incorrect.';
                }

                if ((int) $response->status() === 502 && (!is_string($error) || trim($error) === '' || stripos($error, 'Failed to fetch') !== false)) {
                    $error = 'RCON gateway returned 502 from upstream API.';
                }

                return response()->json(['success' => false, 'error' => $error], $response->status());
            }

            if (!$isJson) {
                return response()->json(['success' => false, 'error' => 'RCON backend returned a non-JSON response.'], 502);
            }

            $json = $response->json();
            if (!is_array($json)) {
                return response()->json(['success' => false, 'error' => 'RCON backend returned invalid JSON.'], 502);
            }

            return response()->json($json);
        } catch (ConnectionException $e) {
            return response()->json(['success' => false, 'error' => 'RCON backend timed out or is unreachable.'], 504);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to fetch RCON variables'], 500);
        }
    }

    public function fetchRconPlayers(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $rconEnabled = (bool) $this->settings->get('playerlisting::rcon_enabled', false);
            if (!$rconEnabled) {
                return response()->json(['success' => false, 'error' => 'RCON is disabled by admin.'], 403);
            }

            $host = trim((string) $request->input('host', ''));
            $password = (string) $request->input('password', '');
            $port = (int) $request->input('port', 0);
            $type = trim((string) $request->input('type', 'source'));
            $game = trim((string) $request->input('game', ''));
            $command = trim((string) $request->input('command', ''));

            if ($host === '' || $password === '' || $port < 1 || $port > 65535) {
                return response()->json(['success' => false, 'error' => 'Valid host, port, and password are required.'], 422);
            }

            $apiUrl = trim((string) $this->settings->get('playerlisting::api_url', ''));
            $apiBase = $apiUrl !== '' ? preg_replace('#/gameapi/?$#', '', $apiUrl) : 'https://api.euphoriadevelopment.uk';
            $target = rtrim((string) $apiBase, '/') . '/rcon/players';

            $payload = [
                'host' => $host,
                'port' => $port,
                'password' => $password,
                'type' => $type !== '' ? $type : 'source',
                'game' => $game,
            ];

            if ($command !== '') {
                $payload['command'] = $command;
            }

            $response = Http::acceptJson()->timeout(12)->post($target, $payload);

            $contentType = strtolower((string) $response->header('Content-Type', ''));
            $isJson = str_contains($contentType, 'application/json') || str_contains($contentType, 'text/json');

            if (!$response->successful()) {
                $error = null;

                if ($isJson) {
                    $error = $response->json('error');
                }

                if (!is_string($error) || trim($error) === '') {
                    $body = trim((string) $response->body());
                    if ($body !== '') {
                        if (preg_match('/<title>(.*?)<\/title>/is', $body, $matches)) {
                            $error = trim(html_entity_decode(strip_tags((string) ($matches[1] ?? ''))));
                        } else {
                            $error = trim(substr(strip_tags($body), 0, 200));
                        }
                    }
                }

                if (!is_string($error) || trim($error) === '') {
                    $error = 'Failed to fetch players via RCON.';
                }

                if (is_string($error) && preg_match('/Failed all\s+\d+\s+attempts/i', $error)) {
                    $error = 'RCON is unreachable. The game server may be offline, the RCON port closed, or credentials/type are incorrect.';
                }

                if ((int) $response->status() === 502 && (!is_string($error) || trim($error) === '' || stripos($error, 'Failed to fetch') !== false)) {
                    $error = 'RCON gateway returned 502 from upstream API.';
                }

                return response()->json(['success' => false, 'error' => $error], $response->status());
            }

            if (!$isJson) {
                return response()->json(['success' => false, 'error' => 'RCON backend returned a non-JSON response.'], 502);
            }

            $json = $response->json();
            if (!is_array($json)) {
                return response()->json(['success' => false, 'error' => 'RCON backend returned invalid JSON.'], 502);
            }

            return response()->json($json);
        } catch (ConnectionException $e) {
            return response()->json(['success' => false, 'error' => 'RCON backend timed out or is unreachable.'], 504);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to fetch RCON players'], 500);
        }
    }
}

class playerlistingSettingsFormRequest extends AdminFormRequest
{
  public function rules(): array
  {
    return [
        'enabled' => 'nullable|string',
    ];
  }

  public function attributes(): array
  {
    return [
        'enabled' => 'Enabled',
    ];
  }
  
}
