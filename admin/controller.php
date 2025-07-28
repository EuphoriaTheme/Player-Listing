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
            $userUuid = $request->input('user_uuid');
            $serverUuid = $request->input('server_uuid');
            
            if (!$userUuid || !$serverUuid) {
                return response()->json(['error' => 'User UUID and Server UUID are required'], 400);
            }

            $settingsKey = "playerlisting::user_settings_{$userUuid}_{$serverUuid}";
            $settings = $this->settings->get($settingsKey, []);
            
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
            $userUuid = $request->input('user_uuid');
            $serverUuid = $request->input('server_uuid');
            $customDomain = $request->input('custom_domain');
            $customPort = $request->input('custom_port');
            
            if (!$userUuid || !$serverUuid) {
                return response()->json(['error' => 'User UUID and Server UUID are required'], 400);
            }

            $settings = [
                'custom_domain' => $customDomain,
                'custom_port' => $customPort,
                'updated_at' => now()->toISOString(),
            ];

            $settingsKey = "playerlisting::user_settings_{$userUuid}_{$serverUuid}";
            $this->settings->set($settingsKey, json_encode($settings));

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save user settings'], 500);
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