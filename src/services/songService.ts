import playwright from "playwright";


export async function getHandleFromSongPage(songId: string): Promise<string> {
    const url = `https://suno.com/song/${songId}`;
    let browser;
    let handle: string = '';

    try {
        browser = await playwright.chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: process.env.USER_AGENT
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 1500 });

        const response = await page.waitForResponse(response => response.url().includes('/api/profiles/') && response.status() === 200, { timeout: 5000 });

        const data = await response.json();
        const clip = data.clips.find((c: { id: string }) => c.id === songId);

        if (!clip) {
            console.log('Song not found in network response');
            throw new Error('Song not found');
        }

        handle = clip.handle;

    } catch (error) {
        console.error('Error while fetching handle for songId:', songId, error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return handle;
}