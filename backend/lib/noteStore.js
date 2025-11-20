const { readUserFile, writeUserFile } = require("./authStore");

function ensureNotes(data) {
    if (!Array.isArray(data.notes)) data.notes = [];
}

exports.listNotes = async function (req) {
    const { data } = await readUserFile(req.username);
    ensureNotes(data);
    return data.notes;
};

exports.createNote = async function (req, body) {
    const { data, file } = await readUserFile(req.username);
    ensureNotes(data);

    const id = 
        typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());

    const now = new Date().toISOString();

    const note = {
        id, 
        title: body.title || "",
        body: body.body || "",
        updatedAt: now,
    };

    data.notes.unshift(note);

    await writeUserFile(file, data);
    return note;
};

exports.updateNote = async function (req, id, patch) {
    const { data, file } = await readUserFile(req.username);
    ensureNotes(data);

    const idx = data.notes.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    const now = new Date().toISOString();

    data.notes[idx] = {
        ...data.notes[idx],
        ...patch,
        updatedAt: now,
    };

    await writeUserFile(file, data);
    return data.notes[idx];
};

exports.removeNote = async function (req, id) {
    const { data, file } = await readUserFile(req.username);
    ensureNotes(data);

    const before = data.notes.length;
    data.notes = data.notes.filter((n) => n.id !== id);

    await writeUserFile(file, data);

    return { removed: before !== data.notes.length}
};

    