import { ObjectId } from 'mongodb'; // Import ObjectId from mongodb

// Statistiques de tendance pour un clip
export interface TrendingRecord {
    clipId: ObjectId;           // ID du clip
    list: string;               // ID ou nom de la liste de trending (ex: "daily", "weekly")
    position: number;           // Position dans la liste
    timeSpan: string;           // Période (daily, weekly, monthly)
    firstSeen: Date;            // Première fois vu en trending
    lastSeen: Date;             // Dernière fois vu en trending
    peakPosition: number;       // Meilleure position atteinte
    totalDays: number;          // Nombre total de jours en trending
    consecutiveDays?: number;   // Jours consécutifs en trending
}