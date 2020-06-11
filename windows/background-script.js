/**
 * Should we enable extra output for debugging purposes or not?
 */
const DEBUGMODE = true;

/**
 * 
 * @param {string} category What part of the script we currently are in
 * @param {...any} params   Everything else, text, objects and so forth.
 */
function log(category, ...params) {
    console.log(category, JSON.stringify([...params]));
    if (DEBUGMODE) {
        OverwolfEventDispatcher.sendDataToWebsocket({ category, ...params });
    }
}

class OverwolfEventDispatcher {

    /**
     * Sets the initial event handlers, to handle game launches and game info updates
     * Opens connection to websocket server
     */
    constructor() {
        log('[INIT]', 'Class initialized - Registering event handlers');
        OverwolfEventDispatcher.setEventHandlers();
        log('[INIT]', 'Setting up websocket connection');
        OverwolfEventDispatcher.openWebSocket();
    }

    static hasSetRequiredFeatures = false;

    /**
     * Contains all currently unsent events (because websocket was down or not opened)
     */
    static eventQueue = [];

    /**
     * Keeps track of which game we are currently running (we send this as extra data to the websocket)
     */
    static currentGame = null;

    static webSocket = null;

    /**
     * Sets the event handlers for gameLaunched and gameInfoUpdated
     */
    static setEventHandlers() {
        overwolf.games.onGameLaunched.removeListener(OverwolfEventDispatcher.gameLaunched);
        overwolf.games.onGameLaunched.addListener(OverwolfEventDispatcher.gameLaunched);

        overwolf.games.onGameInfoUpdated.removeListener(OverwolfEventDispatcher.gameInfoUpdated);
        overwolf.games.onGameInfoUpdated.addListener(OverwolfEventDispatcher.gameInfoUpdated);

        log('[EVENTHANDLERS]', 'All eventhandlers have been set.');
    }

    /**
     * Sets the event listeners for game events (onError, onInfoUpdates2, onNewEvents)
     */
    static setGameEventHandlers() {
        log('[EVENTHANDLERS]', 'Setting game event-handlers');
        overwolf.games.events.onError.removeListener(OverwolfEventDispatcher.gameEventError);
        overwolf.games.events.onError.addListener(OverwolfEventDispatcher.gameEventError);

        overwolf.games.events.onInfoUpdates2.removeListener(OverwolfEventDispatcher.gameEventUpdated2);
        overwolf.games.events.onInfoUpdates2.addListener(OverwolfEventDispatcher.gameEventUpdated2);

        overwolf.games.events.onNewEvents.removeListener(OverwolfEventDispatcher.gameEvents);
        overwolf.games.events.onNewEvents.addListener(OverwolfEventDispatcher.gameEvents);
    }

    /**
     * Opens up (if it can) the websocket connection, gets the current game info and sends any queued data
     */
    static openWebSocket() {
        if (OverwolfEventDispatcher.webSocket == null || OverwolfEventDispatcher.webSocket.readyState !== 1) {
            log('[WEBSOCKET]', 'Opening new websocket connection');
            try {
                OverwolfEventDispatcher.webSocket = new WebSocket('ws://localhost:61337/overwolf');
                OverwolfEventDispatcher.webSocket.addEventListener('error', () => {
                    log('[WEBSOCKET]', 'Got an error, creating new websocket in 30 seconds');
                    OverwolfEventDispatcher.webSocket = null;
                    setTimeout(() => { OverwolfEventDispatcher.openWebSocket(); }, 30000);
                });

                OverwolfEventDispatcher.webSocket.addEventListener('open', () => {
                    log('[WEBSOCKET]', 'Websocket connection open');

                    OverwolfEventDispatcher.webSocket.addEventListener('close', () => {
                        log('[WEBSOCKET]', 'Socket got closed, creating new websocket in 5 seconds');
                        OverwolfEventDispatcher.webSocket = null;
                        setTimeout(() => { OverwolfEventDispatcher.openWebSocket(); }, 5000);
                    });

                    OverwolfEventDispatcher.sendEventQueueToWebsocket();

                    overwolf.games.getRunningGameInfo(info => {
                        if (info && info.classId) {
                            OverwolfEventDispatcher.setRequiredFeatures(info.classId);
                       } 
                    });
                });
            } catch { 
                OverwolfEventDispatcher.webSocket = null;
                setTimeout(function () { OverwolfEventDispatcher.openWebSocket(); }, 30000);
            }
        }
    }

    /**
     * Tries to send the queued items that was stored in case of errors/no connection
     */
    static sendEventQueueToWebsocket() {
        if (OverwolfEventDispatcher.webSocket != null && OverwolfEventDispatcher.webSocket.readyState == 1) {
            if (OverwolfEventDispatcher.eventQueue.length > 0) {
                // Reversing the eventQueue, so that we get all events in the correct order when we try to empty it
                OverwolfEventDispatcher.eventQueue.reverse();

                while (OverwolfEventDispatcher.eventQueue.length > 0) {
                    let item = OverwolfEventDispatcher.eventQueue.pop();
                    OverwolfEventDispatcher.webSocket.send(item);
                }
            }
        }
    }

    /**
     * Sends our data to the websocket (or the event queue, in case of no connection)
     * @param {any} data 
     */
    static sendDataToWebsocket(data) {
        let sendData = JSON.stringify({ game: OverwolfEventDispatcher.currentGame, data: data });

        if (OverwolfEventDispatcher.webSocket == null || OverwolfEventDispatcher.webSocket.readyState !== 1) {
            OverwolfEventDispatcher.eventQueue.push(sendData);
        } else {
            try {
                OverwolfEventDispatcher.sendEventQueueToWebsocket();
                OverwolfEventDispatcher.webSocket.send(sendData);
            }
            catch {
                OverwolfEventDispatcher.webSocketRetries++;
                OverwolfEventDispatcher.eventQueue.push(sendData);
            }
        }
    }

    /**
     * Fired when we detect a game launch, sends the event forward to the websocket and tries to register the required features
     * @param {RunningGameInfo} event 
     */
    static gameLaunched(event) {
        log('[GAME]', 'GameLaunched', event);

        OverwolfEventDispatcher.hasSetRequiredFeatures = false;

        OverwolfEventDispatcher.sendDataToWebsocket(event);
        OverwolfEventDispatcher.setRequiredFeatures(event.classId);
    }

    /**
     * Tries to request the required features from the game we're currently playing
     * @param {string[]} features A string array with all the supported features we want
     */
    static setFeatures(features) {
        overwolf.games.events.setRequiredFeatures(features, (info) => {
            log('[GAME-EVENTS]', info);
            if (info.status == 'error') {
                OverwolfEventDispatcher.hasSetRequiredFeatures = false;
                setTimeout(function () { OverwolfEventDispatcher.setFeatures(features); }, 5000);
            } else {
                OverwolfEventDispatcher.setGameEventHandlers();
                OverwolfEventDispatcher.hasSetRequiredFeatures = true;
            }

            OverwolfEventDispatcher.sendDataToWebsocket(info);
        });
    }

    /**
     * Fetches the currently active game, and sets the required features
     * @param {Number} classId Contains the "classId" from Overwolf
     */
    static setRequiredFeatures(classId) {
        if (!OverwolfEventDispatcher.hasSetRequiredFeatures) {
            OverwolfEventDispatcher.hasSetRequiredFeatures = true;
            let features = overwolf.games.getSupportedFeatures(classId);
            if (features) {
                log('[EVENTS]', 'Trying to set game features for', features.game);
                OverwolfEventDispatcher.currentGame = features.game;
                OverwolfEventDispatcher.setFeatures(features.events);
            } else {
                log('[EVENTS]', 'Encountered unsupported game (No events)', classId);
            }
        }
    }

    /**
     * Fired when the game info is updated (tab in/out, running, resolution, game)
     * We also try to set the required features based on the game.
     * @param {GameInfoUpdatedEvent} event Contains the gameinfo, and what was changed
     */
    static gameInfoUpdated(event) {
        log('[GAME]', 'GameInfoUpdated', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);

        if (event.gameInfo.isRunning && !OverwolfEventDispatcher.hasSetRequiredFeatures) {
            OverwolfEventDispatcher.setRequiredFeatures(event.gameInfo.classId);
        }

        if (!event.gameInfo.isRunning && event.runningChanged) {
            OverwolfEventDispatcher.hasSetRequiredFeatures = false;
            OverwolfEventDispatcher.currentGame = null;
        }
    }

    /**
     * Fired when an error occurs in the Game Event system
     * @param {any} event We don't know what we get here, since it's not documented :D
     */
    static gameEventError(event) {
        log('[EVENT]', 'GameEventError', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    /**
     * Fired when we get information updates from the game, it can have many forms and features
     * @param {any} event 
     */
    static gameEventUpdated2(event) {
        log('[EVENT]', 'GameEventInfoUpdated2', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }

    /**
     * Fired when there are new game events that we are interested in
     * @param {any} event 
     */
    static gameEvents(event) {
        log('[EVENT]', 'GameEventNewEvents', event);
        OverwolfEventDispatcher.sendDataToWebsocket(event);
    }
};

window.OverwolfEventDisp = new OverwolfEventDispatcher();