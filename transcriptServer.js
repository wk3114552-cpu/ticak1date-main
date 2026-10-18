const express = require("express");
const fs = require("node:fs/promises");
const { getStorageDirectory, getTranscriptPath } = require("./transcriptStore");

function setPrivacyHeaders(response) {
    response.set({
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow, noarchive"
    });
}

function createTranscriptApp(options = {}) {
    const app = express();
    const storageDirectory = options.storageDirectory || getStorageDirectory();
    app.disable("x-powered-by");

    app.get("/healthz", (_request, response) => {
        response.status(200).type("text/plain").send("ok");
    });

    app.get("/transcripts/:id", async (request, response) => {
        setPrivacyHeaders(response);
        const filePath = getTranscriptPath(request.params.id, { storageDirectory });
        if (!filePath) {
            return response.status(404).type("text/plain").send("Transcript not found.");
        }

        try {
            const html = await fs.readFile(filePath, "utf8");
            return response.status(200).type("html").send(html);
        } catch (error) {
            if (error.code === "ENOENT") {
                return response.status(404).type("text/plain").send("Transcript not found.");
            }
            console.error("Could not read a ticket transcript:", error);
            return response.status(500).type("text/plain").send("Transcript could not be opened.");
        }
    });

    app.use((_request, response) => {
        setPrivacyHeaders(response);
        response.status(404).type("text/plain").send("Page not found.");
    });

    return app;
}

function startTranscriptServer(options = {}) {
    const app = createTranscriptApp(options);
    const port = Number(options.port ?? process.env.PORT ?? 3000);
    const host = options.host || "0.0.0.0";

    return new Promise((resolve, reject) => {
        const server = app.listen(port, host, () => resolve(server));
        server.once("error", reject);
    });
}

module.exports = { createTranscriptApp, setPrivacyHeaders, startTranscriptServer };
