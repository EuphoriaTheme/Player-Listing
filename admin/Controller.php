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
    
    public function getHWID()
    {
        // Generate a unique HWID based on system information
        $macAddress = trim(shell_exec("getmac")); // Windows
        if (!$macAddress) {
            $macAddress = trim(shell_exec("cat /sys/class/net/eth0/address")); // Linux
        }

        $hwid = hash('sha256', $macAddress . php_uname());
        return $hwid;
    }

    //License Handler
    public function showLicenseForm(Request $request)
    {
        if (!$request->user() || !$request->user()->root_admin) {
            throw new AccessDeniedHttpException();
        }
    
        $this->initializeDefaultSettings(); // Ensure defaults are set
    
        $hwid = $this->blueprint->dbGet("playerlisting", 'hwid');
        $productId = $this->blueprint->dbGet("playerlisting", 'productId');
        $licenseKey = $this->blueprint->dbGet("playerlisting", 'licenseKey');
    
        return view('blueprint.extensions.playerlisting.wrappers.admin.licensing', [
            'hwid' => $hwid,
            'productId' => $productId,
            'licenseKey' => $licenseKey,
        ]);
    }

    public function saveLicense(Request $request)
    {
        if (!$request->user() || !$request->user()->root_admin) {
            throw new AccessDeniedHttpException();
        }
    
        $settings = [
            'licenseKey' => $request->input('licenseKey', ''),
            'hwid' => $request->input('hwid', $this->getHWID()),
            'productId' => $request->input('productId', $this->blueprint->dbGet("playerlisting", '53'))
        ];
    
        // Save each setting explicitly in the database
        foreach ($settings as $key => $value) {
            $this->blueprint->dbSet("playerlisting", $key, $value);
        }
    
        // Redirect to /admin with a success message
        return redirect('/admin')->with('success', 'Settings updated successfully.');
    }

    public function fetchProfile(Request $request)
    {
        if (!$request->user()) {
            throw new AccessDeniedHttpException();
        }
    
        $user = Auth::user();
    
        $profileData = [
            'licenseKey' => $this->blueprint->dbGet("playerlisting", 'licenseKey'),
            'hwid' => $this->blueprint->dbGet("playerlisting", 'hwid'),
            'productId' => $this->blueprint->dbGet("playerlisting", 'productId'),
        ];
    
        return response()->json($profileData);
    }

    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->root_admin) {
            throw new AccessDeniedHttpException();
        }

        // Fetch stored theme settings
        $licenseKey = $this->blueprint->dbGet("playerlisting", 'licenseKey');
        $hwid = $this->blueprint->dbGet("playerlisting", 'hwid');
        $productId = $this->blueprint->dbGet("playerlisting", 'productId');

        $this->initializeDefaultSettings();

        // Pass settings to the view
        return $this->view->make(
            'admin.extensions.{identifier}.index', [
              'root' => "/admin/extensions/{identifier}",
              'blueprint' => $this->blueprint,
              'licenseKey' => $licenseKey,
              'hwid' => $hwid, 
              'productId' => $productId
            ]
          );
    }

    private function initializeDefaultSettings()
    {
    $settings = [
        'licenseKey' => '',
        'hwid' => $this->getHWID(), 
        'productId' => '53',
    ];

    foreach ($settings as $key => $default) {
        $current = $this->blueprint->dbGet("playerlisting", $key);
        if ($current === null || $current === '') {
            $this->blueprint->dbSet("playerlisting", $key, $default);
        }
        }
    }
}


class playerlistingSettingsFormRequest extends AdminFormRequest
{
  public function rules(): array
  {
    return [
        'licenseKey' => 'nullable|string',
        'hwid' => 'nullable|string',
        'productId' => 'nullable|string'
    ];
  }

  public function attributes(): array
  {
    return [
        'licenseKey' => 'License Key',
        'hwid' => 'Hardware ID',
        'productId' => 'Product ID'
    ];
  }
  
}