import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

// Fonction sleep pour les délais
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Middleware pour gérer les erreurs 429
const retryOnRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Essaie de récupérer les données de l'API ou d'autres actions
        await next();
    } catch (error) {
        // Vérifie que l'erreur provient d'une réponse d'axios
        if (axios.isAxiosError(error) && error.response && error.response.status === 429) {
            // Vérifie si l'en-tête Retry-After est présent
            const retryAfter = error.response.headers['retry-after'] || 60;  // Par défaut, attendre 60 secondes si l'en-tête n'est pas défini
            console.log(`Rate limit reached. Retrying after ${retryAfter} seconds...`);

            // Attends le temps spécifié dans Retry-After
            await sleep(retryAfter * 1000);

            // Réessaye l'action en cours
            try {
                // Appel direct de la fonction qui a échoué
                await next();
            } catch (secondError) {
                // Si une nouvelle erreur survient après le délai, la traiter
                console.error('Second attempt failed:', secondError);
                if (axios.isAxiosError(secondError) && secondError.response) {
                    res.status(secondError.response.status).json({ error: secondError.message });
                } else {
                    res.status(500).json({ error: 'An unknown error occurred.' });
                }
            }
        } else {
            // Si l'erreur n'est pas liée à la gestion du rate limit, on traite l'erreur
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
