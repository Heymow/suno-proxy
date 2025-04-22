import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOnRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await next();
    } catch (error) {
        if (axios.isAxiosError(error) && error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.log(`Rate limit reached. Retrying after ${retryAfter} seconds...`);

            await sleep(retryAfter * 1000);

            try {

                await next();
            } catch (secondError) {
                console.error('Second attempt failed:', secondError);
                if (axios.isAxiosError(secondError) && secondError.response) {
                    res.status(secondError.response.status).json({ error: secondError.message });
                } else {
                    res.status(500).json({ error: 'An unknown error occurred.' });
                }
            }
        } else {
            console.error('Error occurred:', error);
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'An unknown error occurred.' });
            }
        }
    }
};

export { retryOnRateLimit };
