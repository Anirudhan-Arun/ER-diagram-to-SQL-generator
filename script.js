let entities = [];
let relationships = [];

const entityNameInput = document.getElementById("entityName");
const attributesInput = document.getElementById("attributes");
const addEntityBtn = document.getElementById("addEntityBtn");
const generateBtn = document.getElementById("generateBtn");
const entityList = document.getElementById("entityList");
const diagramArea = document.getElementById("diagramArea");
const sqlOutput = document.getElementById("sqlOutput");
const validationBox = document.getElementById("validationBox");
const copyBtn = document.getElementById("copyBtn");
const themeBtn = document.getElementById("themeBtn");

function detectPrimaryKey(name) {
    name = name.toLowerCase().trim();
    return name === "id" || name.endsWith("_id");
}

function inferDataType(name) {
    name = name.toLowerCase().trim();

    if (name === "id" || name.endsWith("_id")) return "INTEGER";

    if (["age","count","quantity","credits","credit","marks","score","year","number","total"]
        .some(x => name === x || name.includes(x))) return "INTEGER";

    if (["price","salary","amount","cost","rate","percentage"]
        .some(x => name.includes(x))) return "DECIMAL";

    if (["date","dob","birth","created","updated"]
        .some(x => name.includes(x))) return "DATE";

    if (["is_","has_","active","enabled"]
        .some(x => name.includes(x))) return "BOOLEAN";

    return "VARCHAR";
}

addEntityBtn.addEventListener("click", () => {
    const name = entityNameInput.value.trim();
    const text = attributesInput.value.trim();

    if (!name || !text) {
        showValidation("error", "Enter an entity name and at least one attribute.");
        return;
    }

    if (entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        showValidation("error", "This entity already exists.");
        return;
    }

    const names = text.split(",").map(x => x.trim()).filter(Boolean);
    const attrs = names.map(name => ({
        name,
        type: inferDataType(name),
        primaryKey: detectPrimaryKey(name)
    }));

    if (!attrs.some(a => a.primaryKey)) {
        showValidation("error", "Add an attribute such as id or student_id to create a primary key.");
        return;
    }

    entities.push({ name, attributes: attrs });

    entityNameInput.value = "";
    attributesInput.value = "";

    renderEntities();
    renderRelationshipSelectors();
    renderDiagram();

    showValidation("success", `${name} added successfully.`);
});

function renderEntities() {
    if (!entities.length) {
        entityList.innerHTML = '<div class="empty-state">No entities added yet.</div>';
        return;
    }

    entityList.innerHTML = entities.map((e, i) => `
        <div class="entity-item">
            <button class="delete-btn" onclick="deleteEntity(${i})">×</button>
            <strong>${escapeHTML(e.name)}</strong>
            <span>${e.attributes.map(a =>
                `${escapeHTML(a.name)} (${a.type})${a.primaryKey ? " 🔑" : ""}`
            ).join(", ")}</span>
        </div>
    `).join("");
}

function deleteEntity(index) {
    const removed = entities[index];
    relationships = relationships.filter(r =>
        r.from !== removed.name && r.to !== removed.name
    );

    entities.splice(index, 1);
    renderEntities();
    renderRelationshipSelectors();
    renderRelationshipList();
    renderDiagram();

    showValidation("success", `${removed.name} removed.`);
}

function renderRelationshipSelectors() {
    const selects = document.querySelectorAll(".relationship-entity");

    selects.forEach(select => {
        const oldValue = select.value;

        select.innerHTML =
            '<option value="">Select entity</option>' +
            entities.map(e =>
                `<option value="${escapeHTML(e.name)}">${escapeHTML(e.name)}</option>`
            ).join("");

        if (entities.some(e => e.name === oldValue)) {
            select.value = oldValue;
        }
    });
}

function addRelationship() {
    const from = document.getElementById("relationshipFrom").value;
    const to = document.getElementById("relationshipTo").value;
    const name = document.getElementById("relationshipName").value.trim();
    const cardinality = document.getElementById("cardinality").value;

    if (!from || !to || !name) {
        showValidation("error", "Select both entities and enter a relationship name.");
        return;
    }

    if (from === to) {
        showValidation("error", "Select two different entities.");
        return;
    }

    relationships.push({ from, to, name, cardinality });

    document.getElementById("relationshipName").value = "";

    renderRelationshipList();
    renderDiagram();

    showValidation("success", `${name} relationship added.`);
}

function renderRelationshipList() {
    const box = document.getElementById("relationshipList");
    if (!box) return;

    if (!relationships.length) {
        box.innerHTML = '<div class="empty-state">No relationships added yet.</div>';
        return;
    }

    box.innerHTML = relationships.map((r, i) => `
        <div class="relationship-item">
            <span>
                <strong>${escapeHTML(r.from)}</strong>
                — ${escapeHTML(r.name)} —
                <strong>${escapeHTML(r.to)}</strong>
                <small>${escapeHTML(r.cardinality)}</small>
            </span>
            <button onclick="deleteRelationship(${i})">×</button>
        </div>
    `).join("");
}

function deleteRelationship(index) {
    relationships.splice(index, 1);
    renderRelationshipList();
    renderDiagram();
}

function renderDiagram() {
    if (!entities.length) {
        diagramArea.innerHTML = `
            <div class="diagram-placeholder">
                <div class="placeholder-icon">◇</div>
                <h3>Your ER diagram will appear here</h3>
                <p>Add an entity to begin building your database model.</p>
            </div>`;
        return;
    }

    const canvas = document.createElement("div");
    canvas.className = "er-canvas";

    const entityNodes = {};

    entities.forEach((entity, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "er-node";
        wrapper.dataset.name = entity.name;

        const box = document.createElement("div");
        box.className = "er-entity";
        box.textContent = entity.name;

        wrapper.appendChild(box);

        const attrs = document.createElement("div");
        attrs.className = "er-attributes";

        entity.attributes.forEach(attribute => {
            const oval = document.createElement("div");
            oval.className = "er-attribute";
            if (attribute.primaryKey) oval.classList.add("primary-key");

            oval.innerHTML = `
                <span class="attribute-name">
                    ${attribute.primaryKey ? "<u>" + escapeHTML(attribute.name) + "</u>" : escapeHTML(attribute.name)}
                </span>
                <span class="attribute-type">${attribute.type}</span>
            `;

            attrs.appendChild(oval);
        });

        wrapper.appendChild(attrs);
        canvas.appendChild(wrapper);
        entityNodes[entity.name] = wrapper;
    });

    if (entities.length > 1) {
        const relationshipsLayer = document.createElement("div");
        relationshipsLayer.className = "relationships-layer";

        relationships.forEach(r => {
            const rel = document.createElement("div");
            rel.className = "relationship-node";

            rel.innerHTML = `
                <div class="cardinality from-cardinality">${cardinalityStart(r.cardinality)}</div>
                <div class="relationship-diamond">${escapeHTML(r.name)}</div>
                <div class="cardinality to-cardinality">${cardinalityEnd(r.cardinality)}</div>
            `;

            relationshipsLayer.appendChild(rel);
        });

        canvas.appendChild(relationshipsLayer);
    }

    diagramArea.innerHTML = "";
    diagramArea.appendChild(canvas);
}

function cardinalityStart(value) {
    if (value === "1 : 1") return "1";
    if (value === "1 : N") return "1";
    if (value === "N : 1") return "N";
    return "M";
}

function cardinalityEnd(value) {
    if (value === "1 : 1") return "1";
    if (value === "1 : N") return "N";
    if (value === "N : 1") return "1";
    return "N";
}

generateBtn.addEventListener("click", () => {
    if (!entities.length) {
        showValidation("error", "Add an entity before generating SQL.");
        return;
    }

    let sql = "";

    entities.forEach(entity => {
        sql += `CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;

        entity.attributes.forEach((a, i) => {
            let type = a.type === "VARCHAR" ? "VARCHAR(100)" : a.type;
            let line = `    ${sanitizeSQLName(a.name)} ${type}`;

            if (a.primaryKey) line += " PRIMARY KEY";

            sql += line + (i < entity.attributes.length - 1 ? "," : "") + "\n";
        });

        sql += ");\n\n";
    });

    relationships.forEach(r => {
        const from = entities.find(e => e.name === r.from);
        const to = entities.find(e => e.name === r.to);

        if (!from || !to) return;

        if (r.cardinality === "M : N") {
            const table = sanitizeSQLName(r.name);
            const fk1 = sanitizeSQLName(from.name) + "_id";
            const fk2 = sanitizeSQLName(to.name) + "_id";

            sql += `CREATE TABLE ${table} (\n`;
            sql += `    ${fk1} INTEGER,\n`;
            sql += `    ${fk2} INTEGER,\n`;
            sql += `    PRIMARY KEY (${fk1}, ${fk2})\n`;
            sql += `);\n\n`;
        }
    });

    sqlOutput.textContent = sql.trim();

    showValidation("success", "SQL generated successfully from the ER model.");
});

copyBtn.addEventListener("click", async () => {
    const sql = sqlOutput.textContent;

    if (!sql || sql.startsWith("--")) {
        showValidation("error", "Generate SQL first.");
        return;
    }

    try {
        await navigator.clipboard.writeText(sql);
        copyBtn.textContent = "Copied!";

        setTimeout(() => {
            copyBtn.textContent = "Copy SQL";
        }, 1500);
    } catch {
        showValidation("error", "Unable to copy SQL.");
    }
});

function showValidation(type, message) {
    validationBox.innerHTML = `
        <strong>${type === "error" ? "Validation Error" : "Validation"}</strong>
        <p>${escapeHTML(message)}</p>
    `;

    validationBox.className = `validation-box ${type}`;
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeBtn.textContent =
        document.body.classList.contains("light") ? "☀" : "☾";
});

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function sanitizeSQLName(value) {
    return value.trim().replace(/[^a-zA-Z0-9_]/g, "_");
}

renderEntities();
renderRelationshipSelectors();
renderRelationshipList();
renderDiagram();
