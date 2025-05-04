import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });
console.log(`Connecting to Redis at ${redisUrl}`);

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});
redisClient.on('ready', () => {
    console.log('Redis Client is ready to use');
});

export default redisClient;