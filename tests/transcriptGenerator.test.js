const assert = require("node:assert/strict");
const test = require("node:test");
const { buildTranscript, fetchAllMessages, markdown } = require("../transcriptGenerator");

function makeChannel(messages, overrides = {}) {
    const guild = {
        id: "guild-1",
        name: "<Support & Friends>",
        ownerId: "owner-1",
        iconURL: () => null,
        members: { cache: new Map() }
    };
    return {
        id: "ticket-1",
        name: "ticket-customer",
        topic: "customer user-1",
        createdTimestamp: 1_700_000_000_000,
        guild,
        messages: {
            fetch: async () => messages
        },
        ...overrides
    };
}

test("renders a polished, intentional empty state for a ticket with zero messages", async () => {
    const html = await buildTranscript(makeChannel(new Map()));
    assert.match(html, /No messages in this ticket/);
    assert.match(html, /id="total-messages">0/);
    assert.match(html, /&lt;Support &amp; Friends&gt;/);
    assert.doesNotMatch(html, /<Support & Friends>/);
});

test("escapes message HTML before applying supported Markdown", () => {
    assert.equal(markdown("<script>alert(1)</script> **safe**"), "&lt;script&gt;alert(1)&lt;/script&gt; <strong>safe</strong>");
});

test("fetches all transcript pages, then orders messages chronologically", async () => {
    const newestFirst = Array.from({ length: 100 }, (_value, index) => ({
        id: "message-" + (100 - index),
        createdTimestamp: 100 - index
    }));
    let requestCount = 0;
    let secondPageBefore;
    const channel = {
        messages: {
            fetch: async options => {
                requestCount += 1;
                if (requestCount === 1) {
                    assert.equal(options.limit, 100);
                    return new Map(newestFirst.map(message => [message.id, message]));
                }
                secondPageBefore = options.before;
                const oldest = { id: "message-0", createdTimestamp: 0 };
                return new Map([[oldest.id, oldest]]);
            }
        }
    };

    const messages = await fetchAllMessages(channel);
    assert.equal(messages.length, 101);
    assert.equal(messages[0].id, "message-0");
    assert.equal(messages[100].id, "message-100");
    assert.equal(secondPageBefore, "message-1");
});
