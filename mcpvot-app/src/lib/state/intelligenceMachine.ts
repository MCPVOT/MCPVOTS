import { assign, createMachine } from 'xstate';

export type IntelligenceMachineState = 'connecting' | 'live' | 'degraded' | 'offline';

export interface IntelligenceMachineContext {
    lastWsConnectedAt: number | null;
    lastHttpSuccessAt: number | null;
    consecutiveHttpFailures: number;
}

type IntelligenceMachineEvent =
    | { type: 'WS_CONNECTED' }
    | { type: 'WS_DISCONNECTED' }
    | { type: 'HTTP_SUCCESS' }
    | { type: 'HTTP_FAILURE' }
    | { type: 'RESET' };

export function createIntelligenceMachine() {
    return createMachine({
        id: 'intelligenceStreams',
        types: {} as {
            context: IntelligenceMachineContext;
            events: IntelligenceMachineEvent;
        },
        initial: 'connecting',
        context: {
            lastWsConnectedAt: null,
            lastHttpSuccessAt: null,
            consecutiveHttpFailures: 0,
        },
        states: {
            connecting: {
                on: {
                    WS_CONNECTED: {
                        target: 'live',
                        actions: assign(({ context }) => ({
                            ...context,
                            lastWsConnectedAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    HTTP_SUCCESS: {
                        target: 'degraded',
                        actions: assign(({ context }) => ({
                            ...context,
                            lastHttpSuccessAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    HTTP_FAILURE: {
                        actions: assign(({ context }) => ({
                            ...context,
                            consecutiveHttpFailures: context.consecutiveHttpFailures + 1,
                        })),
                    },
                    RESET: {
                        actions: assign(() => ({
                            lastWsConnectedAt: null,
                            lastHttpSuccessAt: null,
                            consecutiveHttpFailures: 0,
                        })),
                    },
                },
                always: [
                    {
                        target: 'offline',
                        guard: ({ context }) => context.consecutiveHttpFailures >= 3,
                    },
                ],
            },
            live: {
                on: {
                    WS_DISCONNECTED: { target: 'degraded' },
                    HTTP_FAILURE: {
                        target: 'degraded',
                        actions: assign(({ context }) => ({
                            ...context,
                            consecutiveHttpFailures: context.consecutiveHttpFailures + 1,
                        })),
                    },
                    HTTP_SUCCESS: {
                        actions: assign(({ context }) => ({
                            ...context,
                            lastHttpSuccessAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    WS_CONNECTED: {
                        actions: assign(({ context }) => ({
                            ...context,
                            lastWsConnectedAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    RESET: {
                        target: 'connecting',
                        actions: assign(() => ({
                            lastWsConnectedAt: null,
                            lastHttpSuccessAt: null,
                            consecutiveHttpFailures: 0,
                        })),
                    },
                },
            },
            degraded: {
                entry: assign(({ context }) => ({
                    ...context,
                    lastHttpSuccessAt: context.lastHttpSuccessAt ?? Date.now(),
                })),
                always: [
                    {
                        target: 'offline',
                        guard: ({ context }) => context.consecutiveHttpFailures >= 3,
                    },
                ],
                on: {
                    WS_CONNECTED: {
                        target: 'live',
                        actions: assign(({ context }) => ({
                            ...context,
                            lastWsConnectedAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    HTTP_SUCCESS: {
                        target: 'live',
                        actions: assign(({ context }) => ({
                            ...context,
                            lastHttpSuccessAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    HTTP_FAILURE: {
                        actions: assign(({ context }) => ({
                            ...context,
                            consecutiveHttpFailures: context.consecutiveHttpFailures + 1,
                        })),
                    },
                    RESET: {
                        target: 'connecting',
                        actions: assign(() => ({
                            lastWsConnectedAt: null,
                            lastHttpSuccessAt: null,
                            consecutiveHttpFailures: 0,
                        })),
                    },
                },
            },
            offline: {
                on: {
                    WS_CONNECTED: {
                        target: 'live',
                        actions: assign(({ context }) => ({
                            ...context,
                            lastWsConnectedAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    HTTP_SUCCESS: {
                        target: 'degraded',
                        actions: assign(({ context }) => ({
                            ...context,
                            lastHttpSuccessAt: Date.now(),
                            consecutiveHttpFailures: 0,
                        })),
                    },
                    RESET: {
                        target: 'connecting',
                        actions: assign(() => ({
                            lastWsConnectedAt: null,
                            lastHttpSuccessAt: null,
                            consecutiveHttpFailures: 0,
                        })),
                    },
                },
            },
        },
    });
}

export type IntelligenceMachineService = ReturnType<typeof createIntelligenceMachine>;
