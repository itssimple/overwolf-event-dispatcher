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

class OverwolfEventDispatcher {
    constructor()
    {
        console.debug('[INIT]', 'Class initialized - Registering event handlers');
        this.setEventHandlers();
        console.debug('[INIT]', 'Setting up websocket connection');
        OverwolfEventDispatcher.openWebSocket();
    }

    static firstFiredEvent = true;

    static webSocket = null;

    static eventQueue = [];

    setEventHandlers() {
        overwolf.games.onGameLaunched.removeListener(this.gameLaunched);
        overwolf.games.onGameLaunched.addListener(this.gameLaunched);

        overwolf.games.onGameInfoUpdated.removeListener(this.gameInfoUpdated);
        overwolf.games.onGameInfoUpdated.addListener(this.gameInfoUpdated);

        overwolf.games.events.onError.removeListener(this.gameEventError);
        overwolf.games.events.onError.addListener(this.gameEventError);

        overwolf.games.events.onInfoUpdates.removeListener(this.gameEventUpdated);
        overwolf.games.events.onInfoUpdates.addListener(this.gameEventUpdated);

        overwolf.games.events.onInfoUpdates2.removeListener(this.gameEventUpdated2);
        overwolf.games.events.onInfoUpdates2.addListener(this.gameEventUpdated2);

        overwolf.games.events.onNewEvents.removeListener(this.gameEvents);
        overwolf.games.events.onNewEvents.addListener(this.gameEvents);

        console.debug('[EVENTHANDLERS]', 'All eventhandlers have been set.');
    }

    static openWebSocket() {
        if (!OverwolfEventDispatcher.webSocket || OverwolfEventDispatcher.webSocket.readyState != 1) {
            console.log('[WEBSOCKET]', 'Opening new websocket connection');
            try {
                OverwolfEventDispatcher.webSocket = new WebSocket('ws://localhost:61337/overwolf');
                OverwolfEventDispatcher.webSocket.addEventListener('open', () => {
                    console.log('[WEBSOCKET]', 'Websocket connection open');
                    OverwolfEventDispatcher.webSocket.addEventListener('error', () => {
                        console.log('[WEBSOCKET]', 'Got an error, creating new websocket in 5 seconds');
                        setTimeout(() => { OverwolfEventDispatcher.openWebSocket(); }, 5000);
                    });

                    OverwolfEventDispatcher.webSocket.addEventListener('close', () => {
                        console.log('[WEBSOCKET]', 'Socket got closed, creating new websocket in 5 seconds');
                        setTimeout(() => { OverwolfEventDispatcher.openWebSocket(); }, 5000);
                    });

                    if (OverwolfEventDispatcher.eventQueue.length > 0) {
                        console.log('[EVENTS]', `Sending ${OverwolfEventDispatcher.eventQueue.length} queued items to websocket!`);
                    }
                    while (OverwolfEventDispatcher.eventQueue.length > 0) {
                        let item = OverwolfEventDispatcher.eventQueue.pop();
                        OverwolfEventDispatcher.sendDataToWebsocket(item);
                    }
                });
            } catch { 
                setTimeout(function () { OverwolfEventDispatcher.openWebSocket(); }, 5000);
            }
        }
    }

    static sendDataToWebsocket(data) {
        if (!OverwolfEventDispatcher.webSocket || OverwolfEventDispatcher.webSocket.readyState != 1) {
            OverwolfEventDispatcher.eventQueue.push(data);
            OverwolfEventDispatcher.openWebSocket();
        } else {
            OverwolfEventDispatcher.webSocket.send(JSON.stringify(data));
        }
    }

    gameLaunched(event) {
        console.debug('[GAME]', 'GameLaunched', event);

        OverwolfEventDispatcher.sendDataToWebsocket(event);
        OverwolfEventDispatcher.setRequiredFeatures(event.classId);
    }

    static setFeatures(features) {
        overwolf.games.events.setRequiredFeatures(features, (info) => {
            if (info.status == 'error') {
                setTimeout(function () { OverwolfEventDispatcher.setFeatures(features); }, 5000);
            }

            OverwolfEventDispatcher.sendDataToWebsocket(info);
        });
    }

    static setRequiredFeatures(classId) {
        console.debug('[EVENTS]', 'Trying to set game features for ', classId);
        switch (classId) {
            case OverwolfGameWithEventSupport.APEX:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.APEX);
                break;
            case OverwolfGameWithEventSupport.CSGO:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.CSGO);
                break;
            case OverwolfGameWithEventSupport.DOTA2:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.DOTA2);
                break;
            case OverwolfGameWithEventSupport.DOTAUnderlords:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.DOTAUnderlords);
                break;
            case OverwolfGameWithEventSupport.EscapeFromTarkov:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.EscapeFromTarkov);
                break;
            case OverwolfGameWithEventSupport.Fortnite:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.Fortnite);
                break;
            case OverwolfGameWithEventSupport.Hearthstone:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.Hearthstone);
                break;
            case OverwolfGameWithEventSupport.HeroesOfTheStorm:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.HeroesOfTheStorm);
                break;
            case OverwolfGameWithEventSupport.LeagueOfLegends:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.LeagueOfLegends);
                break;
            case OverwolfGameWithEventSupport.LegendsOfRuneterra:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.LegendsOfRuneterra);
                break;
            case OverwolfGameWithEventSupport.MTGArena:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.MTGArena);
                break;
            case OverwolfGameWithEventSupport.PUBG:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.PUBG);
                break;
            case OverwolfGameWithEventSupport.PUBGLite:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.PUBGLite);
                break;
            case OverwolfGameWithEventSupport.PathOfExile:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.PathOfExile);
                break;
            case OverwolfGameWithEventSupport.RainbowSixSiege:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.RainbowSixSiege);
                break;
            case OverwolfGameWithEventSupport.RocketLeague:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.RocketLeague);
                break;
            case OverwolfGameWithEventSupport.Splitgate:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.Splitgate);
                break;
            case OverwolfGameWithEventSupport.StarCraft2:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.StarCraft2);
                break;
            case OverwolfGameWithEventSupport.TeamfightTactics:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.TeamfightTactics);
                break;
            case OverwolfGameWithEventSupport.Valorant:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.Valorant);
                break;
            case OverwolfGameWithEventSupport.WorldOfTanks:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.WorldOfTanks);
                break;
            case OverwolfGameWithEventSupport.WorldOfWarcraft:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.WorldOfWarcraft);
                break;
            case OverwolfGameWithEventSupport.WorldOfWarships:
                OverwolfEventDispatcher.setFeatures(OverwolfGameSupportedEvents.WorldOfWarships);
                break;
            default:
                console.log('[EVENTS]', 'Encountered unsupported game (No events)', classId);
                break;
        }
    }

    gameInfoUpdated(event) {
        console.debug('[GAME]', 'GameInfoUpdated', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);

        if (OverwolfEventDispatcher.firstFiredEvent) {
            OverwolfEventDispatcher.setRequiredFeatures(event.gameInfo.classId);
            OverwolfEventDispatcher.firstFiredEvent = false;
        }
    }

    gameEventError(event) {
        console.debug('[EVENT]', 'GameEventError', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    gameEventUpdated(event) {
        console.debug('[EVENT]', 'GameEventInfoUpdated', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    gameEventUpdated2(event) {
        console.debug('[EVENT]', 'GameEventInfoUpdated2', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    gameEvents(event) {
        console.debug('[EVENT]', 'GameEventNewEvents', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }
};

window.OverwolfEventDisp = new OverwolfEventDispatcher();