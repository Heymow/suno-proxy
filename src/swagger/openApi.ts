import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { PlaylistResponseSchema } from '../schemas/playlistSchema.js';
import { SongResponseSchema } from '../schemas/songSchema.js';
import { CommentsResponseSchema } from '../schemas/songSchema.js';
import { UserPageResponseSchema } from '../schemas/userSchema.js';
import { UserRecentPageResponseSchema } from '../schemas/userSchema.js';
import { SunoStatusResponseSchema } from '../schemas/sunoStatusSchema.js';
import { TrendingResponseSchema } from '../schemas/trendingSchema.js';
import { NewSongsResponseSchema } from '../schemas/newSongsSchema.js';
import { get_new_songs_example } from './example_responses/get_new_songs.js';

const registry = new OpenAPIRegistry();
registry.register('Playlist', PlaylistResponseSchema);
registry.register('Song', SongResponseSchema);
registry.register('Comment', CommentsResponseSchema);
registry.register('User', UserPageResponseSchema);
registry.register('UserRecent', UserRecentPageResponseSchema);
registry.register('Status', SunoStatusResponseSchema);
registry.register('Trending', TrendingResponseSchema);
registry.register('NewSongs', NewSongsResponseSchema);


const generator = new OpenApiGeneratorV3(registry.definitions);
const openApiDoc = generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'New Suno API', version: '1.0.0' },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Suno API'
        }
    ]
});


openApiDoc.paths = {
    ...(openApiDoc.paths || {}),
    "/playlist/{playlistId}": {
        get: {
            summary: "Get playlist info",
            tags: ["Playlists"],
            parameters: [
                {
                    name: "playlistId",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            responses: {
                "200": {
                    description: "A playlist response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Playlist"
                            }
                        }
                    }
                }
            }
        }
    },
    "/playlist/{playlistId}/{page}": {
        get: {
            summary: "Get playlist page",
            tags: ["Playlists"],
            parameters: [
                {
                    name: "playlistId",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                },
                {
                    name: "page",
                    in: "path",
                    required: true,
                    schema: { type: "integer" }
                }
            ],
            responses: {
                "200": {
                    description: "A playlist response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Playlist"
                            }
                        }
                    }
                }
            }
        }
    },
    "/song/new_songs": {
        get: {
            summary: "Get new songs playlist",
            tags: ["Songs"],
            responses: {
                "200": {
                    description: "A new songs playlist response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/NewSongs"
                            },
                            example: get_new_songs_example
                        }
                    }
                }
            }
        }
    },
    "/song/{songId}": {
        get: {
            summary: "Get song info",
            tags: ["Songs"],
            parameters: [
                {
                    name: "songId",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            responses: {
                "200": {
                    description: "A song response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Song"
                            }
                        }
                    }
                }
            }
        }
    },
    "/song/comments/{songId}": {
        get: {
            summary: "Get song comments",
            tags: ["Songs"],
            parameters: [
                {
                    name: "songId",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            responses: {
                "200": {
                    description: "A song comments response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Comment"
                            }
                        }
                    }
                }
            }
        }
    },
    "/user/{userId}": {
        get: {
            summary: "Get user info",
            tags: ["Users"],
            parameters: [
                {
                    name: "userId",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            responses: {
                "200": {
                    description: "A user info response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/User"
                            }
                        }
                    }
                }
            }
        }
    },
    "/user/recent/{userId}": {
        get: {
            summary: "Get user recent songs",
            tags: ["Users"],
            parameters: [
                {
                    name: "userId",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            responses: {
                "200": {
                    description: "A user recent songs response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/User"
                            }
                        }
                    }
                }
            }
        }
    },
    "/trending/status": {
        get: {
            summary: "Get Suno global status",
            tags: ["Trending"],
            parameters: [],
            responses: {
                "200": {
                    description: "A Suno global status response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Status"
                            }
                        }
                    }
                }
            }
        }
    },
    "/trending/{list}/{timeSpan}": {
        get: {
            summary: "Get specific trending page",
            tags: ["Trending"],
            parameters: [
                {
                    name: "list",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        enum: ["Global",
                            "Arabic",
                            "Bengali",
                            "Chinese",
                            "Czech",
                            "Dutch",
                            "English",
                            "Finnish",
                            "French",
                            "German",
                            "Greek",
                            "Gujarati",
                            "Hebrew",
                            "Hindi",
                            "Hungarian",
                            "Indonesian",
                            "Italian",
                            "Japanese",
                            "Kazakh",
                            "Korean",
                            "Malay",
                            "Persian",
                            "Polish",
                            "Portuguese",
                            "Panjabi",
                            "Russian",
                            "Spanish",
                            "Swedish",
                            "Tagalog",
                            "Tamil",
                            "Telugu",
                            "Thai",
                            "Turkish",
                            "Ukrainian",
                            "Urdu",
                            "Vietnamese"]
                    }
                },
                {
                    name: "timeSpan",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        enum: ["Now",
                            "Weekly",
                            "Monthly",
                            "All Time"]
                    }
                }
            ],
            responses: {
                "200": {
                    description: "A specific trending info response",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Trending"
                            }
                        }
                    }
                }
            }
        }
    }
};

import fs from 'fs';
fs.writeFileSync('./src/swagger/openapi.json', JSON.stringify(openApiDoc, null, 2));