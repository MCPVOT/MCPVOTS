export interface NeynarCastAuthor {
    username?: string;
}

export interface NeynarCastReactions {
    likes_count?: number;
    recasts_count?: number;
}

export interface NeynarCast {
    hash?: string;
    text?: string;
    author?: NeynarCastAuthor;
    timestamp?: string;
    reactions?: NeynarCastReactions;
}

export interface NeynarSearchCastsResult {
    result?: {
        casts?: NeynarCast[];
    };
}

export interface NeynarFeedResponse {
    feedData: {
        casts: NeynarCast[];
        next?: unknown;
    };
    networkInfo: {
        activeUsers: string;
        totalCasts: string;
        timestamp: string;
    };
}
