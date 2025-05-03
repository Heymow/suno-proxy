const MAX_PAGE_NUMBER = process.env.MAX_PAGE_NUMBER ? parseInt(process.env.MAX_PAGE_NUMBER, 10) : 20;

export const isValidSongId = (songId: string): boolean => {
    const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return regex.test(songId);
};

export const isSharedSongId = (songId: string): boolean => {
    const regex = /^[a-z0-9]{16}$/i;
    return regex.test(songId);
}

export const isValidPlaylistId = (playlistId: string): boolean => {
    const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return regex.test(playlistId);
};

export const isValidPageNumber = (page: string): boolean => {
    if (!page) return false;
    const regex = /^[1-9]\d*$/;
    const pageNumber = parseInt(page, 10);
    return regex.test(page) && pageNumber > 0 && pageNumber <= MAX_PAGE_NUMBER;
}