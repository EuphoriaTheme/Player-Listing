<!DOCTYPE html>
<html lang="en">
<head>
@section('meta')
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="robots" content="noindex">
    <link rel="icon" type="image/png" href="{{ asset('/extensions/playerlisting/logo.png') }}" sizes="32x32">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('/extensions/playerlisting/logo.png') }}">
    <link rel="icon" type="image/png" href="{{ asset('/extensions/playerlisting/logo.png') }}" sizes="16x16">
    <link rel="shortcut icon" href="{{ asset('/extensions/playerlisting/logo.png') }}">
    <link rel="manifest" href="/favicons/manifest.json">
    <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c">
    <meta name="msapplication-config" content="/favicons/browserconfig.xml">
    <meta name="theme-color" content="#0e4688">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
@show

    <title>Licensing - Euphoria Development</title>
    <style>
        body {
            background: radial-gradient(circle, #1e1e2e, #121212);
            color: #ffffff;
            font-family: "Poppins", sans-serif;
            text-align: center;
            overflow: hidden;
        }

        .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 25px;
            text-align: center;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            /*box-shadow: 0px 0px 25px rgba(98, 0, 234, 0.8);*/
            animation: fadeIn 1s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo img {
            width: 130px;
            animation: pulse 2s infinite alternate;
        }

        @keyframes pulse {
            from { transform: scale(1); }
            to { transform: scale(1.1); }
        }

        .title {
            font-size: 30px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: linear-gradient(90deg, #bb86fc, #6200ea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glow 1.5s infinite alternate;
        }

        @keyframes glow {
            from { text-shadow: 0px 0px 5px rgba(98, 0, 234, 0.6); }
            to { text-shadow: 0px 0px 20px rgba(98, 0, 234, 1); }
        }

        .form-group {
            margin-bottom: 20px;
        }

        .license-key-input {
            width: 80%;
            padding: 12px;
            border: 2px solid #6200ea;
            border-radius: 6px;
            background-color: #23232e;
            color: #ffffff;
            box-shadow: 0px 0px 10px rgba(255, 255, 255, 0.2);
            transition: all 0.3s;
            margin-top: 1rem;
            text-align: center;
        }

        .license-key-input:focus {
            transform: scale(1.05);
            outline: none;
            border-color: #bb86fc;
        }

        .submit-button {
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(45deg, #6200ea, #bb86fc);
            color: #ffffff;
            cursor: pointer;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s;
            box-shadow: 0px 0px 15px rgba(98, 0, 234, 0.8);
        }

        .submit-button:hover {
            background: linear-gradient(45deg, #3700b3, #bb86fc);
            box-shadow: 0px 0px 25px rgba(98, 0, 234, 1);
            transform: scale(1.1);
        }

        .support-button {
            display: inline-block;
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(45deg, #6200ea, #bb86fc);
            color: #ffffff;
            cursor: pointer;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s;
            box-shadow: 0px 0px 15px rgba(98, 0, 234, 0.8);
            margin-left:  1rem;
        }

        .support-button:hover {
            background: linear-gradient(45deg, #3700b3, #bb86fc);
            box-shadow: 0px 0px 25px rgba(98, 0, 234, 1);
            transform: scale(1.1);
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="{{ asset('/extensions/playerlisting/logo.png') }}" alt="Euphoria Theme Logo">
        </div>
        <h1 class="title">Player Listing Licensing</h1>
        <form id="license-form" action="{{ route('blueprint.extensions.playerlisting.wrapper.admin.license.submit') }}" method="POST">
            @csrf
            <div class="form-group">
                <label for="licenseKey">Enter License Key:</label>
                <input type="text" id="licenseKey" name="licenseKey" class="license-key-input" value="{{ $licenseKey }}" required>
                <input type="hidden" name="hwid" value="{{ $hwid }}">
                <input type="hidden" name="productId" value="{{ $productId }}">
            </div>
            <button type="submit" class="submit-button">Submit</button>
            <a href="https://discord.gg/Cus2zP4pPH" target="_blank" class="support-button" style="text-decoration: none;">Get Help</a>
        </form>
    </div>

    <script>
    // Create a toast container
    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);

    // Function to create a toast notification
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.style.padding = '15px 20px';
        toast.style.marginBottom = '10px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '16px';
        toast.style.fontFamily = '"Poppins", sans-serif';
        toast.style.color = '#fff';
        toast.style.boxShadow = '0px 0px 15px rgba(0, 0, 0, 0.5)';
        toast.style.animation = 'fadeInOut 5s ease-in-out';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';

        // Set background color based on type
        if (type === 'success') {
            toast.style.background = 'linear-gradient(45deg, #28a745, #218838)';
        } else if (type === 'error') {
            toast.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
        } else if (type === 'info') {
            toast.style.background = 'linear-gradient(45deg, #17a2b8, #138496)';
        }

        toast.textContent = message;

        // Append the toast to the container
        toastContainer.appendChild(toast);

        // Fade in the toast
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 100);

        // Remove the toast after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 500); // Wait for fade-out transition
        }, 5000);
    };

    // Add fade-in-out animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);

    // Handle form submission
    document.getElementById("license-form").addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent the default form submission

        const licenseKey = document.getElementById("licenseKey").value;
        const hwid = "{{ $hwid }}";
        const productId = "{{ $productId }}";

        if (!licenseKey) {
            showToast("Please enter a license key.", "error");
            return;
        }

        try {
            const response = await fetch("https://euphoriatheme.uk/api/verify-license", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ licenseKey, productId, hwid }),
            });

            const data = await response.json();

            if (data.success) {
                showToast("License key is valid!", "success");
                // Submit the form programmatically after a short delay
                setTimeout(() => {
                    document.getElementById("license-form").submit();
                }, 1500);
            } else {
                showToast("Invalid License Key: " + data.error, "error");
            }
        } catch (error) {
            showToast("Error verifying license key. Please try again.", "error");
            console.error("API error:", error);
        }
    });
</script>
</body>
</html>
