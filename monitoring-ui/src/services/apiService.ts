import axios from "axios";

const baseUrl =
    typeof import.meta.env !== "undefined" && import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL
        : "http://localhost:3000";

const API_URL = "/api/internal/monitoring";
const RESET_URL = "/api/internal/monitoring/reset";
const TOKEN =
    typeof import.meta.env !== "undefined" && import.meta.env.VITE_MONITOR_TOKEN
        ? import.meta.env.VITE_MONITOR_TOKEN
        : "";

export async function fetchStats() {
    const res = await axios.get(baseUrl + API_URL, {
        headers: { "x-monitor-token": TOKEN },
    });
    return res.data;
}

export async function resetStats() {
    await axios.post(
        baseUrl + RESET_URL,
        {},
        {
            headers: { "x-monitor-token": TOKEN },
        }
    );
}

export async function fetchTimeline() {
    const res = await axios.get(`${baseUrl}/api/internal/monitoring/timeline`,
        {
            headers: { "x-monitor-token": TOKEN },
        }
    );
    return res.data;
}