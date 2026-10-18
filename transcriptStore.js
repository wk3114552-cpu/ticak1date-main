const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const TRANSCRIPT_ID_PATTERN = /^[a-f0-9]{64}$/;

function getStorageDirectory() {
    if (process.env.TRANSCRIPT_STORAGE_DIR) {
        return process.env.TRANSCRIPT_STORAGE_DIR;
    }

    if (process.env.RAILWAY_ENVIRONMENT) {
        return "/data/transcripts";
    }

    return path.join(__dirname, "data", "transcripts");
}

function getBaseUrl(override) {
    const configured = override ||
        process.env.TRANSCRIPT_BASE_URL ||
        (process.env.RAILWAY_PUBLIC_DOMAIN
            ? "https://" + process.env.RAILWAY_PUBLIC_DOMAIN
            : "");

    if (!configured) {
        throw new Error("Transcript hosting is not configured with a public base URL.");
    }

    let parsed;
    try {
        parsed = new URL(configured);
    } catch {
        throw new Error("TRANSCRIPT_BASE_URL must be a valid absolute URL.");
    }

    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        throw new Error("Transcript links must use HTTPS.");
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
        throw new Error("TRANSCRIPT_BASE_URL must not contain credentials, a query, or a fragment.");
    }

    return parsed.toString().replace(/\/+$/, "");
}

async function publishTranscript(html, options = {}) {
    if (typeof html !== "string" || !html.trim()) {
        throw new Error("A non-empty HTML transcript is required.");
    }

    const storageDirectory = options.storageDirectory || getStorageDirectory();
    const baseUrl = getBaseUrl(options.baseUrl);
    await fs.mkdir(storageDirectory, { recursive: true });

    const id = crypto.randomBytes(32).toString("hex");
    const filePath = path.join(storageDirectory, id + ".html");
    await fs.writeFile(filePath, html, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600
    });

    return {
        id,
        url: baseUrl + "/transcripts/" + id
    };
}

function getTranscriptPath(id, options = {}) {
    if (typeof id !== "string" || !TRANSCRIPT_ID_PATTERN.test(id)) {
        return null;
    }

    return path.join(options.storageDirectory || getStorageDirectory(), id + ".html");
}

module.exports = {
    TRANSCRIPT_ID_PATTERN,
    getBaseUrl,
    getStorageDirectory,
    getTranscriptPath,
    publishTranscript
};
