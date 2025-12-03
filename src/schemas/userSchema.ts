import {
    extendZodWithOpenApi
} from '@asteasolutions/zod-to-openapi';
import { z } from "zod";

extendZodWithOpenApi(z);

const UserMetadataSchema = z.object({
    tags: z.string().optional(),
    prompt: z.string().optional(),
    edited_clip_id: z.string().optional(),
    type: z.string(),
    duration: z.number(),
    has_vocal: z.boolean().optional(),
    video_upload_width: z.number().optional(),
    video_upload_height: z.number().optional(),
    edit_session_id: z.string().optional(),
    can_remix: z.boolean(),
    is_remix: z.boolean(),
});

const UserSongSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    video_url: z.string(),
    audio_url: z.string(),
    image_url: z.string(),
    image_large_url: z.string(),
    major_model_version: z.string(),
    model_name: z.string(),
    metadata: UserMetadataSchema.optional(),
    caption: z.string().optional(),
    is_liked: z.boolean(),
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    is_handle_updated: z.boolean(),
    avatar_image_url: z.string(),
    is_trashed: z.boolean(),
    is_pinned: z.boolean().optional(),
    explicit: z.boolean().optional(),
    comment_count: z.number(),
    flag_count: z.number(),
    display_tags: z.string().optional(),
    created_at: z.string(),
    status: z.string(),
    title: z.string(),
    play_count: z.number(),
    upvote_count: z.number(),
    is_public: z.boolean(),
    allow_comments: z.boolean(),
});

const UserPlaylistSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    image_url: z.string().optional(),
    playlist_clips: z.array(z.unknown()),
    current_page: z.number(),
    num_total_results: z.number(),
    is_owned: z.boolean(),
    is_trashed: z.boolean(),
    is_public: z.boolean(),
    user_display_name: z.string(),
    user_handle: z.string(),
    user_avatar_image_url: z.string(),
    upvote_count: z.number(),
    dislike_count: z.number(),
    flag_count: z.number().optional(),
    skip_count: z.number().optional(),
    play_count: z.number(),
    song_count: z.number(),
    name: z.string(),
    description: z.string().optional(),
    is_discover_playlist: z.boolean(),
});

const PersonasSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    image_s3_id: z.string().url().optional(),
    root_clip_id: z.string(),
    clip: z.object({
        id: z.string(),
        entity_type: z.string(),
        video_url: z.string(),
        audio_url: z.string(),
        image_url: z.string(),
        image_large_url: z.string(),
        major_model_version: z.string(),
        model_name: z.string(),
        metadata: UserMetadataSchema,
        caption: z.string().optional(),
        is_liked: z.boolean(),
        user_id: z.string(),
        display_name: z.string(),
        handle: z.string(),
        is_handle_updated: z.boolean(),
        avatar_image_url: z.string(),
        is_trashed: z.boolean(),
        explicit: z.boolean().optional(),
        display_tags: z.string().optional(),
        created_at: z.string(),
        status: z.string(),
        title: z.string(),
        play_count: z.number(),
        upvote_count: z.number(),
        is_public: z.boolean(),
        allow_comments: z.boolean()
    }),
    user_display_name: z.string(),
    user_handle: z.string(),
    user_image_url: z.string(),
    persona_clips: z.array(z.unknown()),
    is_suno_persona: z.boolean(),
    is_trashed: z.boolean(),
    is_owned: z.boolean(),
    is_public: z.boolean(),
    is_public_approved: z.boolean(),
    is_loved: z.boolean(),
    upvote_count: z.number(),
    clip_count: z.number()
});


export const UserPageResponseSchema = z.object({
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    profile_description: z.string(),
    clips: z.array(UserSongSchema),
    stats: z.union([
        z.object({
            upvote_count__sum: z.number(),
            play_count__sum: z.number(),
            followers_count: z.number(),
            following_count: z.number(),
        }),
        z.object({}).strict(),
    ]),
    is_flagged: z.boolean(),
    is_following: z.boolean(),
    num_total_clips: z.number(),
    current_page: z.number(),
    playlists: z.array(UserPlaylistSchema),
    avatar_image_url: z.string(),
    favorite_songs: z.array(z.unknown()),
    personas: z.array(PersonasSchema),
    user_comments_blocked: z.boolean(),
}).openapi({
    description: "User response schema",
    required: ["user_id", "display_name", "handle", "clips", "stats", "is_flagged", "is_following", "num_total_clips", "current_page", "playlists", "avatar_image_url", "favorite_songs", "personas"],
    example: {
        "user_id": "6f37e09d-0c89-43b5-bc69-0225ec367b14",
        "display_name": "DiggerMc",
        "handle": "diggermc",
        "profile_description": "Meine songs dürfen benutzt, verändert, geklaut werden!  ... ich mache das nur für Inspiration :)\n und einfach nur am \"BOCK AUF MUKKE MACHEN\" ^^  o7 ",
        "clips": [
            {
                "id": "5067b2fd-4ad4-47e5-8140-43a29e7ac9d6",
                "entity_type": "song_schema",
                "video_url": "https://cdn1.suno.ai/5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.mp4",
                "audio_url": "https://cdn1.suno.ai/5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.mp3",
                "image_url": "https://cdn2.suno.ai/image_5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.jpeg",
                "image_large_url": "https://cdn2.suno.ai/image_large_5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.jpeg",
                "major_model_version": "v4",
                "model_name": "chirp-v4",
                "metadata": {
                    "tags": "reggey, ska stealdrumm, up beat, kölsch",
                    "prompt": "(Intro)\nEy, ich stonn he am Strand,\ndat is' nit Kölle, aber ejal,\nweil ich spür et janz jenau…\nUsedom, Baby – Reggae en d’r Ostsee!\nWoah – joo!\n\n(Strophe 1)\nBin en kölsche Jung, doch he bliev ich länger\nDenn de Wind es mild un et Leben es wenger\nStress un Hektik bliev zohus\nHier jibbet Sonne statt Verdruss (Ey!)\n\nIwwerall Sand, de Möwe schreit\nUn ich tanz met d’r Flaschenpost durch d’r Zeit\nUsedom, du jeile Insle\nHier krieg selbst dr Köbes Hitzepickel (Haha!)\n\n(Pre-Chorus)\nReggae klingt us'm Lautsprecher raus\nUn ich spill op d’r Luftmatratz' Schach met d’r Maus\nDat is kein Trick, dat es Levve\nUsedom, ich well dich nie mehr abgewe' (Woah!)\n\n(Kölscher Chorus)\nSommerjeföhl\nPalme danze\nNaachlang danze (Danze)\nDJ spillt op (Oh, oh, oh, oh)\nSommerjeföhl\nStrand un Füer\nEt brennt en mir (Brennt!)\nIch will nur dir (Nur dir)\n\n(Strophe 2)\nZelten am Strand, Scholle frisch op’m Grill\nUn ich sing met dä Jungs: „Dat es, wat ich will!“\nStrandkörv in Reih, Seebrück’ wie im Film\nIn Ahlbeck danze selbst d’r Möw' met Stil (Ey!)\n\nBäderarchitektur, alles blink un blank\nReggae läuft, jeder Pitter wird zum Sang\nUsedom, du häs et jeblick\nMachst us Kölsche zu Jamaika-shick (Joo!)\n\n(Pre-Chorus)\nHe stonn Palmen aus Plastik, doch es ejal\nDenn et Herz schläht op One Love-Kanal\nMit e Flönz in d’r Hand un Rhythm im Blut\nBringe ich kölsche Sonn' met Roots – alles joot!\n\n(Kölscher Chorus)\nSommerjeföhl\nPalme danze\nNaachlang danze (Danze)\nDJ spillt op (Oh, oh, oh, oh)\nSommerjeföhl\nStrand un Füer\nEt brennt en mir (Brennt!)\nIch will nur dir (Nur dir)\n\n(Bridge)\nUnd wenn et rägnet – och kein Ding\nDenn ich spür d’r Bass, wie er springt un springt\nUsedom, du häs mie verzaubert\nNeu-Deutsch Jamaika – wat für e Zauberkraft! (Jaja!)\n\n(Letzter Chorus – mit extra Adlibs)\nSommerjeföhl (Ey, Summer!)\nPalme danze (Jo, sway met mir!)\nNaachlang danze (Danze – durch!)\nDJ spillt op (Oh, oh, oh, oh – fire!)\nSommerjeföhl (Ey, yeah!)\nStrand un Füer\nEt brennt en mir (Brennt!)\nIch will nur dir (Nur dir – woah!)\n\n(Outro)\nOp Usedom jibt et kein Dom,\naber dä Vibe – dä es wie Zohus\nKölsch un Reggae – dat es e Muss\nNeu-Deutsch Jamaika – op d’r Ostseekus’t\nJoo!\n\n\n",
                    "type": "gen",
                    "duration": 184.92,
                    "can_remix": true,
                    "is_remix": false
                },
                "is_liked": false,
                "user_id": "6f37e09d-0c89-43b5-bc69-0225ec367b14",
                "display_name": "DiggerMc",
                "handle": "diggermc",
                "is_handle_updated": true,
                "avatar_image_url": "https://cdn1.suno.ai/b9dbe5f2.webp",
                "is_trashed": false,
                "is_pinned": true,
                "explicit": false,
                "comment_count": 7,
                "flag_count": 0,
                "created_at": "2025-04-14T00:47:24.398Z",
                "status": "complete",
                "title": "Neu-Deutsch Jamaika (Usedom Vibes op Kölsch)",
                "play_count": 107,
                "upvote_count": 39,
                "is_public": true,
                "allow_comments": true
            }
        ],
        "stats": {
            "upvote_count__sum": 1598,
            "play_count__sum": 8958,
            "followers_count": 240,
            "following_count": 247
        },
        "is_flagged": false,
        "is_following": false,
        "num_total_clips": 97,
        "current_page": 1,
        "playlists": [
            {
                "id": "3c7f6ebe-a3b7-49c8-8e31-811f41b9e179",
                "entity_type": "playlist_schema",
                "image_url": "https://cdn2.suno.ai/image_bfaa4714-0ca5-4ba8-867e-4400cef719d1.jpeg",
                "playlist_clips": [],
                "current_page": 0,
                "num_total_results": 4,
                "is_owned": false,
                "is_trashed": false,
                "is_public": true,
                "user_display_name": "DiggerMc",
                "user_handle": "diggermc",
                "user_avatar_image_url": "https://cdn1.suno.ai/b9dbe5f2.webp",
                "upvote_count": 4,
                "dislike_count": 0,
                "flag_count": 0,
                "skip_count": 0,
                "play_count": 0,
                "song_count": 4,
                "name": "Halloween EP  (A side)",
                "description": "",
                "is_discover_playlist": false
            }
        ],
        "avatar_image_url": "https://cdn1.suno.ai/b9dbe5f2.webp",
        "favorite_songs": [],
        "personas": [
            {
                "id": "f35449ba-0cc8-4d52-90b9-c509d8fdce04",
                "name": "Hunter 2",
                "description": "",
                "image_s3_id": "https://cdn2.suno.ai/image_1b5a767b-edaf-46bf-bea4-44741f4471ba.jpeg",
                "root_clip_id": "1b5a767b-edaf-46bf-bea4-44741f4471ba",
                "clip": {
                    "id": "1b5a767b-edaf-46bf-bea4-44741f4471ba",
                    "entity_type": "song_schema",
                    "video_url": "https://cdn1.suno.ai/1b5a767b-edaf-46bf-bea4-44741f4471ba.mp4",
                    "audio_url": "https://cdn1.suno.ai/1b5a767b-edaf-46bf-bea4-44741f4471ba.mp3",
                    "image_url": "https://cdn2.suno.ai/image_1b5a767b-edaf-46bf-bea4-44741f4471ba.jpeg",
                    "image_large_url": "https://cdn2.suno.ai/image_large_1b5a767b-edaf-46bf-bea4-44741f4471ba.jpeg",
                    "major_model_version": "v4",
                    "model_name": "chirp-v4",
                    "metadata": {
                        "tags": "Caribbean, Tropical, Reggae, Ska, Dubstep, EDM, Epic, Heroic, Cinematic, Cosmic, Adventure, Intense, Atmospheric, Ambient, Steel Drums, Synth Pads, Dynamic Percussion, Battle, funny",
                        "prompt": "[Intro: After the Fall]\n(Flickering lights. Dust settles. A deep rumble in the distance)\nThe Rat King falls, Cyber rats are gone, the island stands,\nbut something stirs beneath the sands.\nA hidden force, a twisted scheme,\nthis war ain't over—just caught in between.\n\nSuper Canal Rodent Hunter breathes out slow,\nwipes his brow, thinks it's time to go. (Finally)\nBut then—a crack, a shift, a sound so deep,\nthe ground caves in, drags him beneath. (Oh, come on)\n\n[Darkness. Then a flickering neon light. A distorted voice speaks]\n“You beat the King... but you never asked—who built the throne?”\n\n[Verse 1: The Lab Below]\nHe wakes up in a room, cold steel, bright screens,\ntubes full of something—pulsing, obscene.\nA lab, abandoned, but not quite dead,\nmachines humming, blinking red.\n\nFigures in the dark, shadows in sync,\nglowing eyes watching—waiting to think.\nA scientist steps in, smirk so wide,\nhis glasses cracked, but sharp with pride.\n\n\"You fight well, but you don’t understand,\nthis island was never just palm trees and sand.\nThe rats? Just pawns, a simple game,\nbut now, dear Hunter—you’ll learn my name.\"\n\n[Pre-Chorus: The Mind Unleashed]\nThe walls start shifting, metal alive,\nHunter’s trapped—nowhere to dive.\nHe tries to punch, tries to swing,\nbut the room itself begins to sting. (Uh… this feels bad)\n\nThen—the scientist pulls a switch,\nthe world distorts, his thoughts start to glitch.\nA voice in his head, static and pain,\nhis mind unraveling, tied in chains. (Get… outta… my…)\n\n[Chorus: Breaking Free]\nWires coil, circuits spark,\nhis body’s frozen, mind goes dark.\nMemories twist, past feels fake,\nwho is he really—what’s at stake?\n\nBut deep inside, something snaps,\nthe static clears, the system cracks.\nOne deep breath—he locks his gaze,\nand for the first time, he’s unfazed.\n\n(Nah. Not today) - Not today\n\n[Verse 2: The Great Escape]\nHe breaks the hold, the lab goes red,\nalarms scream loud, the scientist fled.\nBut Hunter ain't done, not letting him run,\nthe real fight's coming, and he wants some fun.\n\nTunnels collapse, steam erupts,\nHunter jumps as the ceiling corrupts.\nA final door, a final test,\nbut what waits beyond ain't like the rest.\n\nRows of tubes—hundreds inside,\nmechanical beasts, glowing with pride.\nNot just rats, but something more,\na new breed waiting beyond the door.\n\nThe scientist whispers, voice so low—\n“Welcome, Hunter… to Level Two.”\n\n(To be continued…)",
                        "type": "gen",
                        "duration": 240,
                        "can_remix": true,
                        "is_remix": false
                    },
                    "is_liked": false,
                    "user_id": "6f37e09d-0c89-43b5-bc69-0225ec367b14",
                    "display_name": "DiggerMc",
                    "handle": "diggermc",
                    "is_handle_updated": true,
                    "avatar_image_url": "https://cdn1.suno.ai/b9dbe5f2.webp",
                    "is_trashed": false,
                    "created_at": "2025-02-26T06:54:49.760Z",
                    "status": "complete",
                    "title": "The Battle for Purradise (part 3)",
                    "play_count": 45,
                    "upvote_count": 10,
                    "is_public": true,
                    "allow_comments": true
                },
                "user_display_name": "DiggerMc",
                "user_handle": "diggermc",
                "user_image_url": "https://cdn1.suno.ai/b9dbe5f2.webp",
                "persona_clips": [],
                "is_suno_persona": false,
                "is_trashed": false,
                "is_owned": false,
                "is_public": false,
                "is_public_approved": false,
                "is_loved": false,
                "upvote_count": 0,
                "clip_count": 0
            }
        ],
        "user_comments_blocked": false
    }
});

const UserRecentSongSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    video_url: z.string(),
    audio_url: z.string(),
    image_url: z.string(),
    image_large_url: z.string(),
    major_model_version: z.string(),
    model_name: z.string(),
    metadata: UserMetadataSchema,
    caption: z.string().optional(),
    is_liked: z.boolean(),
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    is_handle_updated: z.boolean(),
    avatar_image_url: z.string(),
    is_trashed: z.boolean(),
    explicit: z.boolean().optional(),
    display_tags: z.string().optional(),
    created_at: z.string(),
    status: z.string(),
    title: z.string(),
    play_count: z.number(),
    upvote_count: z.number(),
});

export const UserRecentPageResponseSchema = z.object({
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    clips: z.array(UserRecentSongSchema),
}).openapi({
    description: "User recent response schema",
    required: ["user_id", "display_name", "handle", "clips"],
    example: {
        "user_id": "6f37e09d-0c89-43b5-bc69-0225ec367b14",
        "display_name": "DiggerMc",
        "handle": "diggermc",
        "clips": [
            {
                "id": "5067b2fd-4ad4-47e5-8140-43a29e7ac9d6",
                "entity_type": "song_schema",
                "video_url": "https://cdn1.suno.ai/5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.mp4",
                "audio_url": "https://cdn1.suno.ai/5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.mp3",
                "image_url": "https://cdn2.suno.ai/image_5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.jpeg",
                "image_large_url": "https://cdn2.suno.ai/image_large_5067b2fd-4ad4-47e5-8140-43a29e7ac9d6.jpeg",
                "major_model_version": "v4",
                "model_name": "chirp-v4",
                "metadata": {
                    "type": "gen",
                    "duration": 184.92,
                    "can_remix": true,
                    "is_remix": false
                },
                "is_liked": false,
                "user_id": "6f37e09d-0c89-43b5-bc69-0225ec367b14",
                "display_name": "DiggerMc",
                "handle": "diggermc",
                "is_handle_updated": true,
                "avatar_image_url": "https://cdn1.suno.ai/b9dbe5f2.webp",
                "is_trashed": false,
                "explicit": false,
                "created_at": "2025-04-14T00:47:24.398Z",
                "status": "complete",
                "title": "Neu-Deutsch Jamaika (Usedom Vibes op Kölsch)",
                "play_count": 107,
                "upvote_count": 39,
            }
        ]
    }
});

export type User = z.infer<typeof UserPageResponseSchema>;
export type UserSong = z.infer<typeof UserSongSchema>;
export type UserSongMetadata = z.infer<typeof UserMetadataSchema>;
export type UserPlaylist = z.infer<typeof UserPlaylistSchema>;
export type UserPersonas = z.infer<typeof PersonasSchema>;

export type UserRecent = z.infer<typeof UserRecentPageResponseSchema>;
export type UserRecentSong = z.infer<typeof UserRecentSongSchema>;
export type UserRecentSongMetadata = z.infer<typeof UserMetadataSchema>;
