<?php
    $licenseKey = $blueprint->dbGet("playerlisting", 'licenseKey');
    $hwid = $blueprint->dbGet("playerlisting", 'hwid');
    $productId = $blueprint->dbGet("playerlisting", 'productId');
?>

@if(session('success'))
    <div class="alert alert-success">
        {{ session('success') }}
    </div>
@endif

<!DOCTYPE html>
<head>
<style>
    /* Floating buttons */
    .floating-buttons {
        position: fixed;
        bottom: 5%;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
        align-items: flex-end;
    }

    .floating-buttons a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        background-color: #181f27;
        color: white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transition: background-color 0.3s ease, transform 0.3s ease;
    }

    .floating-buttons a:hover {
        opacity: 0.9;
        transform: scale(1.1);
    }

    .floating-buttons a i {
        font-size: 20px;
    }

    /* Update the button styles */
    #license-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 500;
        transition: background-color 0.3s ease, transform 0.3s ease;
        border-radius: 10px;
        padding: 1rem;
        width: auto;
    }

    #license-button:hover {
        transform: scale(1.05);
    }
</style>


        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
            <meta name="_token" content="{{ csrf_token() }}">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <script src="https://unpkg.com/@popperjs/core@2"></script>
            <script src="https://unpkg.com/tippy.js@6"></script>
            <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css" />
           @show
    </head>

    @if(request()->is('admin'))
    <!-- Floating buttons -->
    <div class="floating-buttons">
        <a id="license-button" href="{{ route('blueprint.extensions.playerlisting.wrapper.admin.licensing') }}" class="bg-gray-500 flex items-center px-4 py-2 rounded-lg text-white">
            <i class="fa-solid fa-key mr-2"></i>
            <span id="license-status-text">Checking...</span>
        </a>
    </div>
    @endif

@if(request()->is('admin'))
<script>
   document.addEventListener('DOMContentLoaded', async () => {
    const licenseButton = document.querySelector('#license-button');
    const licenseStatusText = document.querySelector('#license-status-text');

    try {
        const sourceDomain = window.location.origin;
        const response = await fetch('https://euphoriatheme.uk/api/verify-license', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                licenseKey: '{{ $licenseKey }}',
                hwid: '{{ $hwid }}',
                productId: '{{ $productId }}',
                source: sourceDomain,
            }),
        });

        const data = await response.json();

        if (data.success === true) {
                // Set button to green and update text to "Valid"
                licenseButton.classList.add('bg-green-500');
                licenseButton.classList.remove('bg-red-500', 'bg-gray-500');
                licenseStatusText.textContent = 'Valid License Key';
            } else if (data.success === false) {
                // Set button to red and update text to "Invalid"
                licenseButton.classList.add('bg-red-500');
                licenseButton.classList.remove('bg-green-500', 'bg-gray-500');
                licenseStatusText.textContent = 'Invalid or Rate Limited';
            } else {
                // Handle unexpected responses
                throw new Error('Unexpected API response.');
            }
        } catch (error) {
            console.error('Error verifying license:', error);
            // Set button to red and update text to "API Timeout" in case of an error
            licenseButton.classList.add('bg-red-500');
            licenseButton.classList.remove('bg-green-500', 'bg-gray-500');
            licenseStatusText.textContent = 'API Timeout';
        }

    // Initialize the tooltip
    tippy('[data-tippy-content]', {
        placement: 'left',
        theme: 'dark',
    });
});
</script>
@endif