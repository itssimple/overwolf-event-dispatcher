const OverwolfGameWithEventSupport = {
    APEX: 21566,
    CSGO: 7764,
    DOTA2: 7314,
    DOTAUnderlords: 21586,
    EscapeFromTarkov: 21634,
    Fortnite: 21216,
    Hearthstone: 9898,
    HeroesOfTheStorm: 10624,
    LeagueOfLegends: 5426,
    LegendsOfRuneterra: 21620,
    MTGArena: 21308,
    PUBG: 10906,
    PUBGLite: 21598,
    PathOfExile: 7212,
    RainbowSixSiege: 10826,
    RocketLeague: 10798,
    Splitgate: 21404,
    StarCraft2: 5855,
    TeamfightTactics: 5426,
    Valorant: 21640,
    WorldOfTanks: 6365,
    WorldOfWarcraft: 765,
    WorldOfWarships: 10746
};

const OverwolfGameSupportedEvents = {
    APEX: ['gep_internal', 'me', 'team', 'kill', 'damage', 'death', 'revive', 'match_state', 'match_info', 'inventory', 'location', 'match_summary', 'roster', 'rank', 'kill_feed'],
    CSGO: ['gep_internal', 'match_info', 'kill', 'death', 'assist', 'headshot', 'round_start', 'match_start', 'match_info', 'match_end', 'team_round_win', 'bomb_planted', 'bomb_change', 'reloading', 'fired', 'weapon_change', 'weapon_acquired', 'info', 'roster', 'player_activity_change', 'team_set', 'replay', 'counters', 'mvp', 'scoreboard', 'kill_feed'],
    DOTA2: ['gep_internal', 'game_state_changed', 'match_state_changed', 'match_detected', 'daytime_changed', 'clock_time_changed', 'ward_purchase_cooldown_changed', 'match_ended', 'kill', 'assist', 'death', 'cs', 'xpm', 'gpm', 'gold', 'hero_leveled_up', 'hero_respawned', 'hero_buyback_info_changed', 'hero_boughtback', 'hero_health_mana_info', 'hero_status_effect_changed', 'hero_attributes_skilled', 'hero_ability_skilled', 'hero_ability_used', 'hero_ability_cooldown_changed', 'hero_ability_changed', 'hero_item_cooldown_changed', 'hero_item_changed', 'hero_item_used', 'hero_item_consumed', 'hero_item_charged', 'match_info', 'roster', 'party', 'error', 'hero_pool', 'me', 'game'],
    DOTAUnderlords: ['gep_internal', 'match_info'],
    EscapeFromTarkov: ['gep_internal', 'match_info', 'game_info'],
    Fortnite: ['gep_internal', 'kill', 'killed', 'revived', 'death', 'match', 'match_info', 'rank', 'me', 'phase', 'location', 'team', 'items', 'counters'],
    Hearthstone: ['gep_internal', 'scene_state', 'collection', 'decks', 'match', 'match_info'],
    HeroesOfTheStorm: ['gep_internal', 'match_info', 'me', 'game_info', 'roster', 'death', 'kill'],
    LeagueOfLegends: ['gep_internal', 'live_client_data', 'matchState', 'match_info', 'death', 'respawn', 'abilities', 'kill', 'assist', 'gold', 'minions', 'summoner_info', 'gameMode', 'teams', 'level', 'announcer', 'counters', 'damage', 'heal'],
    LegendsOfRuneterra: ['game_client_data'],
    MTGArena: ['gep_internal', 'game_info', 'match_info'],
    PUBG: ['gep_internal', 'kill', 'revived', 'death', 'killer', 'match', 'rank', 'counters', 'location', 'me', 'team', 'phase', 'map', 'roster'],
    PUBGLite: ['gep_internal', 'kill', 'revived', 'death', 'killer', 'match', 'rank', 'me', 'phase', 'map', 'team_feed'],
    PathOfExile: ['gep_internal', 'kill', 'death', 'me', 'match_info'],
    RainbowSixSiege: ['gep_internal', 'game_info', 'match', 'match_info', 'roster', 'kill', 'death', 'me'],
    RocketLeague: ['gep_internal', 'stats', 'teamGoal', 'opposingTeamGoal', 'match', 'roster', 'me', 'match_info'],
    Splitgate: ['gep_internal', 'game_info', 'match_info', 'player', 'location', 'match', 'feed', 'connection', 'kill', 'death', 'portal', 'assist'],
    StarCraft2: ['gep_internal', 'match_info'],
    TeamfightTactics: ['gep_internal', 'live_client_data', 'me', 'match_info', 'roster', 'store', 'board', 'bench', 'carousel'],
    Valorant: ['gep_internal', 'me', 'game_info', 'match_info', 'kill', 'death'],
    WorldOfTanks: ['gep_internal', 'kill', 'death', 'game_info', 'match_info'],
    WorldOfWarcraft: ['game_info'],
    WorldOfWarships: ['gep_internal', 'game_info', 'account_info', 'match', 'match_info', 'kill', 'death']
};

function log(message, ...params) {
    console.log(message, ...params);
    /*
    if (OverwolfEventDispatcher.webSocket && OverwolfEventDispatcher.webSocket.readyState === 1) {
        OverwolfEventDispatcher.sendDataToWebsocket({ message, ...params });
    }
    */
}

class OverwolfEventDispatcher {
    constructor()
    {
        log('[INIT]', 'Class initialized - Registering event handlers');
        OverwolfEventDispatcher.setEventHandlers();
        log('[INIT]', 'Setting up websocket connection');
        OverwolfEventDispatcher.openWebSocket();
    }

    static firstFiredEvent = true;

    static webSocket = null;

    static eventQueue = [];

    static currentGame = null;

    static webSocketRetries = 0;
    static webSocketRetryTimeout = null;

    static setEventHandlers() {
        overwolf.games.onGameLaunched.removeListener(OverwolfEventDispatcher.gameLaunched);
        overwolf.games.onGameLaunched.addListener(OverwolfEventDispatcher.gameLaunched);

        overwolf.games.onGameInfoUpdated.removeListener(OverwolfEventDispatcher.gameInfoUpdated);
        overwolf.games.onGameInfoUpdated.addListener(OverwolfEventDispatcher.gameInfoUpdated);

        log('[EVENTHANDLERS]', 'All eventhandlers have been set.');
    }

    static setGameEventHandlers() {
        log('[EVENTHANDLERS]', 'Setting game event-handlers');
        overwolf.games.events.onError.removeListener(OverwolfEventDispatcher.gameEventError);
        overwolf.games.events.onError.addListener(OverwolfEventDispatcher.gameEventError);

        overwolf.games.events.onInfoUpdates.removeListener(OverwolfEventDispatcher.gameEventUpdated);
        overwolf.games.events.onInfoUpdates.addListener(OverwolfEventDispatcher.gameEventUpdated);

        overwolf.games.events.onInfoUpdates2.removeListener(OverwolfEventDispatcher.gameEventUpdated2);
        overwolf.games.events.onInfoUpdates2.addListener(OverwolfEventDispatcher.gameEventUpdated2);

        overwolf.games.events.onNewEvents.removeListener(OverwolfEventDispatcher.gameEvents);
        overwolf.games.events.onNewEvents.addListener(OverwolfEventDispatcher.gameEvents);
    }

    static openWebSocket() {
        if (OverwolfEventDispatcher.webSocketRetries >= 5) {
            log('[WEBSOCKET]', 'Too many errors, waiting a while before we retry connection.');
            if (OverwolfEventDispatcher.webSocketRetries > 0 && OverwolfEventDispatcher.webSocketRetryTimeout == null) {
                OverwolfEventDispatcher.webSocketRetryTimeout = setTimeout(function () {
                    OverwolfEventDispatcher.webSocketRetries--;
                    OverwolfEventDispatcher.webSocketRetryTimeout = null;
                }, 10000);
                log('[WEBSOCKET]', `Still got ${OverwolfEventDispatcher.webSocketRetries} retries to remove.`);
                return;
            }
        }
        if (!OverwolfEventDispatcher.webSocket || OverwolfEventDispatcher.webSocket.readyState !== 1) {
            log('[WEBSOCKET]', 'Opening new websocket connection');
            try {
                OverwolfEventDispatcher.webSocket = new WebSocket('ws://localhost:61337/overwolf');
                OverwolfEventDispatcher.webSocket.addEventListener('open', () => {
                    log('[WEBSOCKET]', 'Websocket connection open');
                    OverwolfEventDispatcher.webSocket.addEventListener('error', () => {
                        log('[WEBSOCKET]', 'Got an error, creating new websocket in 5 seconds');
                        OverwolfEventDispatcher.webSocketRetries++;
                        setTimeout(() => { OverwolfEventDispatcher.openWebSocket(); }, 5000);
                    });

                    OverwolfEventDispatcher.webSocket.addEventListener('close', () => {
                        log('[WEBSOCKET]', 'Socket got closed, creating new websocket in 5 seconds');
                        OverwolfEventDispatcher.webSocketRetries++;
                        setTimeout(() => { OverwolfEventDispatcher.openWebSocket(); }, 5000);
                    });

                    if (OverwolfEventDispatcher.eventQueue.length > 0) {
                        log('[EVENTS]', `Sending ${OverwolfEventDispatcher.eventQueue.length} queued items to websocket!`);
                    }
                    while (OverwolfEventDispatcher.eventQueue.length > 0) {
                        let item = OverwolfEventDispatcher.eventQueue.pop();
                        OverwolfEventDispatcher.sendDataToWebsocket(item);
                    }

                    overwolf.games.getRunningGameInfo(info => {
                        if (info && info.classId) {
                            OverwolfEventDispatcher.setRequiredFeatures(info.classId);
                       } 
                    });
                });
            } catch { 
                OverwolfEventDispatcher.webSocketRetries++;
                setTimeout(function () { OverwolfEventDispatcher.openWebSocket(); }, 5000);
            }
        }
    }

    static sendDataToWebsocket(data) {
        if (!OverwolfEventDispatcher.webSocket || OverwolfEventDispatcher.webSocket.readyState != 1) {
            OverwolfEventDispatcher.eventQueue.push(data);
            OverwolfEventDispatcher.openWebSocket();
        } else {
            OverwolfEventDispatcher.webSocket.send(JSON.stringify({ game: OverwolfEventDispatcher.currentGame, data: data }));
        }
    }

    static gameLaunched(event) {
        log('[GAME]', 'GameLaunched', event);

        OverwolfEventDispatcher.sendDataToWebsocket(event);
        OverwolfEventDispatcher.setRequiredFeatures(event.classId);
        OverwolfEventDispatcher.firstFiredEvent = true;
    }

    static featureTimeout = null;

    static setFeatures(features) {
        if (OverwolfEventDispatcher.featureTimeout != null) {
            clearTimeout(OverwolfEventDispatcher.featureTimeout);
            OverwolfEventDispatcher.featureTimeout = null;
        }

        OverwolfEventDispatcher.featureTimeout = setTimeout(function () {
            overwolf.games.events.setRequiredFeatures(features, (info) => {
                log('[GAME-EVENTS]', info);
                if (info.status == 'error') {
                    setTimeout(function () { OverwolfEventDispatcher.setFeatures(features); }, 5000);
                } else {
                    OverwolfEventDispatcher.setGameEventHandlers();
                }

                OverwolfEventDispatcher.sendDataToWebsocket(info);
            });
        }, 100);
    }

    static setRequiredFeatures(classId) {
        let game = Object.keys(OverwolfGameWithEventSupport).find(key => OverwolfGameWithEventSupport[key] == classId);
        if (game) {
            log('[EVENTS]', 'Trying to set game features for', game);
            OverwolfEventDispatcher.currentGame = game;
            OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents[game]);
        } else {
            log('[EVENTS]', 'Encountered unsupported game (No events)', classId);
        }
    }

    static gameInfoUpdated(event) {
        log('[GAME]', 'GameInfoUpdated', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);

        if (OverwolfEventDispatcher.firstFiredEvent) {
            OverwolfEventDispatcher.setRequiredFeatures(event.gameInfo.classId);
            OverwolfEventDispatcher.firstFiredEvent = false;
        }

        if (!event.gameInfo.isRunning && event.runningChanged) {
            OverwolfEventDispatcher.firstFiredEvent = true;
        }
    }

    static gameEventError(event) {
        log('[EVENT]', 'GameEventError', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    static gameEventUpdated(event) {
        log('[EVENT]', 'GameEventInfoUpdated', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    static gameEventUpdated2(event) {
        log('[EVENT]', 'GameEventInfoUpdated2', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    static gameEvents(event) {
        log('[EVENT]', 'GameEventNewEvents', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }
};

window.OverwolfEventDisp = new OverwolfEventDispatcher();