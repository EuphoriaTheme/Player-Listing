const parsePositiveInt = (value: unknown): number | null => {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const resolveStableMaxPlayers = (
    nextMax: number,
    panelFallbackMax: number,
    previousMax: number,
    currentPlayers: number
): number => {
    if (Number.isFinite(nextMax) && nextMax > 0) return nextMax;
    if (Number.isFinite(panelFallbackMax) && panelFallbackMax > 0) return panelFallbackMax;
    if (Number.isFinite(previousMax) && previousMax > 0) return previousMax;
    if (Number.isFinite(currentPlayers) && currentPlayers > 0) return currentPlayers;
    return 0;
};

export const extractMaxPlayersFromPanelServer = (server: any): number | null => {
    const buildEnv = server?.build?.env && typeof server.build.env === 'object' ? server.build.env : null;

    const directEnvironments = [
        server?.container?.environment,
        server?.environment,
        server?.build?.env,
        server?.build?.environment,
        server?.BlueprintFramework?.environment,
    ].filter((env) => env && typeof env === 'object');

    const preferredKeys = [
        'MAX_PLAYERS',
        'MAXPLAYERS',
        'MAX_SLOTS',
        'SERVER_SLOTS',
        'SERVER_MAXPLAYERS',
        'SERVER_MAX_PLAYER',
        'SERVER_MAX_PLAYERS',
        'SERVER_PLAYERS',
        'SV_MAXPLAYERS',
        'MAXCLIENTS',
        'SLOTS',
        'PLAYERS',
    ];

    for (const env of directEnvironments) {
        for (const key of preferredKeys) {
            const parsed = parsePositiveInt(env?.[key]);
            if (parsed !== null) return parsed;
        }

        for (const [key, value] of Object.entries(env)) {
            if (/(max.*player|maxplayers|sv_maxplayers|maxclients|slots?|server_players|players$)/i.test(String(key))) {
                const parsed = parsePositiveInt(value);
                if (parsed !== null) return parsed;
            }
        }
    }

    const relationVariables = Array.isArray(server?.relationships?.variables?.data)
        ? server.relationships.variables.data
        : [];

    for (const variable of relationVariables) {
        const attributes = variable?.attributes || variable || {};
        const envName = String(attributes.envVariable || attributes.env_variable || attributes.name || '').trim();
        if (!/(max.*player|maxplayers|sv_maxplayers|maxclients|slots?|server_players|players$)/i.test(envName)) continue;

        const parsed = parsePositiveInt(
            attributes.serverValue
            ?? attributes.server_value
            ?? attributes.value
            ?? attributes.defaultValue
            ?? attributes.default_value
        );

        if (parsed !== null) return parsed;
    }

    const startupCandidates = [
        server?.container?.startupCommand,
        server?.container?.startup,
        server?.startup,
        server?.build?.startup,
    ]
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0);

    for (const startup of startupCandidates) {
        const directMatchPatterns = [
            /max\s*players\s*=\s*(\d+)/i,
            /maxplayers\s*=\s*(\d+)/i,
            /max_players\s*=\s*(\d+)/i,
            /max\s*connections\s*=\s*(\d+)/i,
            /sv_maxplayers\s*[= ]\s*(\d+)/i,
            /slots\s*[= ]\s*(\d+)/i,
            /max-players\s*[= ]\s*(\d+)/i,
            /-players\s*[= ]\s*(\d+)/i,
            /\+maxplayers\s+(\d+)/i,
        ];

        for (const pattern of directMatchPatterns) {
            const directMatch = startup.match(pattern);
            if (!directMatch) continue;
            const parsed = parsePositiveInt(directMatch[1]);
            if (parsed !== null) return parsed;
        }

        const templateMatchPatterns = [
            /max\s*players\s*=\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /maxplayers\s*=\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /max_players\s*=\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /max\s*connections\s*=\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /sv_maxplayers\s*[= ]\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /slots\s*[= ]\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /max-players\s*[= ]\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /-players\s*[= ]\s*\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
            /\+maxplayers\s+\{\{\s*server\.build\.env\.([A-Z0-9_]+)\s*\}\}/i,
        ];

        if (!buildEnv) continue;

        for (const pattern of templateMatchPatterns) {
            const templateMatch = startup.match(pattern);
            if (!templateMatch) continue;
            const envKey = String(templateMatch[1] || '').trim();
            const parsed = parsePositiveInt(buildEnv?.[envKey]);
            if (parsed !== null) return parsed;
        }
    }

    return null;
};

export const extractMaxPlayersFromStartupPayload = (payload: any): number | null => {
    const directCandidates = [
        payload?.data?.maxplayers,
        payload?.maxplayers,
        payload?.meta?.maxplayers,
    ];

    for (const candidate of directCandidates) {
        const parsed = parsePositiveInt(candidate);
        if (parsed !== null) return parsed;
    }

    const startupTextCandidates = [
        payload?.data?.startup_command,
        payload?.data?.startup,
        payload?.startup_command,
        payload?.startup,
    ]
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0);

    for (const startup of startupTextCandidates) {
        const directMatch = startup.match(/max\s*players\s*=\s*(\d+)/i) || startup.match(/maxplayers\s*=\s*(\d+)/i);
        if (directMatch) {
            const parsed = parsePositiveInt(directMatch[1]);
            if (parsed !== null) return parsed;
        }
    }

    const variables = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.variables)
            ? payload.variables
            : Array.isArray(payload?.data?.variables)
                ? payload.data.variables
                : [];

    for (const variable of variables) {
        const attributes = variable?.attributes || variable || {};
        const envName = String(attributes.env_variable || attributes.envVariable || attributes.name || '').trim();
        if (!/(max.*player|maxplayers|sv_maxplayers|maxclients|slots?|server_players|players$)/i.test(envName)) continue;

        const parsed = parsePositiveInt(
            attributes.server_value
            ?? attributes.serverValue
            ?? attributes.value
            ?? attributes.default_value
            ?? attributes.defaultValue
        );

        if (parsed !== null) return parsed;
    }

    return null;
};
