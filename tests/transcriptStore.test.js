const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const test = require("node:test");
const { createTranscriptApp } = require("../transcriptServer");
const { getTranscriptPath, publishTranscript } = require("../transcriptStore");

test("publishes HTML under a high-entropy, unlisted transcript URL", async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-transcripts-"));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));

    const html = "<!doctype html><h1>Ticket record</h1>";
    const published = await publishTranscript(html, {
        storageDirectory: directory,
        baseUrl: "https://archive.example.test/"
    });

    assert.match(published.id, /^[a-f0-9]{64}$/);
    assert.equal(published.url, "https://archive.example.test/transcripts/" + published.id);
    assert.equal(await fs.readFile(getTranscriptPath(published.id, { storageDirectory: directory }), "utf8"), html);
    assert.equal(getTranscriptPath("../private", { storageDirectory: directory }), null);
});

test("serves saved transcripts inline with private, no-index headers", async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-transcript-http-"));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));

    const id = "a".repeat(64);
    await fs.writeFile(path.join(directory, id + ".html"), "<h1>Readable transcript</h1>");

    const server = createTranscriptApp({ storageDirectory: directory }).listen(0, "127.0.0.1");
    t.after(() => new Promise(resolve => server.close(resolve)));
    await once(server, "listening");
    const address = server.address();
    const baseUrl = "http://127.0.0.1:" + address.port;

    const response = await fetch(baseUrl + "/transcripts/" + id);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
    assert.equal(await response.text(), "<h1>Readable transcript</h1>");

    const invalid = await fetch(baseUrl + "/transcripts/not-a-valid-id");
    assert.equal(invalid.status, 404);
});
