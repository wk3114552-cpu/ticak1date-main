const assert = require("node:assert/strict");
const test = require("node:test");
const { createTicketClosureNotice } = require("../ticketClosure");

test("manual and automatic close DMs share ticket details and link to the transcript", () => {
    const guild = {
        name: "Support Server",
        iconURL: () => null
    };
    const channel = {
        id: "channel-123",
        name: "ticket-customer",
        topic: "customer 12345678901234567",
        guild
    };
    const transcriptUrl = "https://archive.example.test/transcripts/" + "a".repeat(64);
    const manual = createTicketClosureNotice({ channel, transcriptUrl });
    const automatic = createTicketClosureNotice({ channel, transcriptUrl, automatic: true });

    const manualDescription = manual.embeds[0].data.description;
    const automaticDescription = automatic.embeds[0].data.description;
    for (const description of [manualDescription, automaticDescription]) {
        assert.match(description, /Ticket Information/);
        assert.match(description, /<@12345678901234567>/);
        assert.match(description, /ticket-customer/);
        assert.match(description, /Support Server/);
    }
    assert.match(manualDescription, /successfully resolved by our staff/);
    assert.match(automaticDescription, /automatically closed after 48 hours/);
    assert.equal(manual.components[0].components[0].data.url, transcriptUrl);
    assert.equal(automatic.components[0].components[0].data.url, transcriptUrl);
});
