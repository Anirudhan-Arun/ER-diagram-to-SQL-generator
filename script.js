let entities = [];

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


/* =========================
   ADD ENTITY
========================= */

addEntityBtn.addEventListener("click", function () {

    const name = entityNameInput.value.trim();
    const attributesText = attributesInput.value.trim();

    if (!name) {
        showValidation(
            "error",
            "Please enter an entity name."
        );
        return;
    }

    if (!attributesText) {
        showValidation(
            "error",
            "Please enter at least one attribute."
        );
        return;
    }

    const duplicate = entities.some(
        entity => entity.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        showValidation(
            "error",
            "An entity with this name already exists."
        );
        return;
    }

    const attributes = attributesText
        .split(",")
        .map(attribute => attribute.trim())
        .filter(attribute => attribute.length > 0);

    if (attributes.length === 0) {
        showValidation(
            "error",
            "Please provide valid attributes."
        );
        return;
    }

    entities.push({
        name: name,
        attributes: attributes
    });

    entityNameInput.value = "";
    attributesInput.value = "";

    renderEntities();
    renderDiagram();

    showValidation(
        "success",
        `${name} was added successfully.`
    );
});


/* =========================
   DISPLAY ENTITY LIST
========================= */

function renderEntities() {

    if (entities.length === 0) {

        entityList.innerHTML = `
            <div class="empty-state">
                No entities added yet.
            </div>
        `;

        return;
    }

    entityList.innerHTML = "";

    entities.forEach((entity, index) => {

        const item = document.createElement("div");

        item.className = "entity-item";

        item.innerHTML = `
            <button
                class="delete-btn"
                onclick="deleteEntity(${index})"
            >
                ×
            </button>

            <strong>${escapeHTML(entity.name)}</strong>

            <span>
                ${entity.attributes
                    .map(attribute => escapeHTML(attribute))
                    .join(", ")}
            </span>
        `;

        entityList.appendChild(item);
    });
}


/* =========================
   DELETE ENTITY
========================= */

function deleteEntity(index) {

    const removed = entities[index];

    entities.splice(index, 1);

    renderEntities();
    renderDiagram();

    showValidation(
        "success",
        `${removed.name} was removed.`
    );
}


/* =========================
   ER DIAGRAM
========================= */

function renderDiagram() {

    if (entities.length === 0) {

        diagramArea.innerHTML = `
            <div class="diagram-placeholder">

                <div class="placeholder-icon">
                    ◇
                </div>

                <h3>Your ER diagram will appear here</h3>

                <p>
                    Add entities from the input panel
                    to begin building your database model.
                </p>

            </div>
        `;

        return;
    }

    const container = document.createElement("div");

    container.className = "diagram-container";

    entities.forEach(entity => {

        const entityBox = document.createElement("div");

        entityBox.className = "diagram-entity";

        let attributesHTML = "";

        entity.attributes.forEach((attribute, index) => {

            const isPrimaryKey =
                index === 0;

            attributesHTML += `
                <div class="diagram-attribute ${
                    isPrimaryKey ? "pk" : ""
                }">

                    ${isPrimaryKey ? "🔑 " : ""}
                    ${escapeHTML(attribute)}

                </div>
            `;
        });

        entityBox.innerHTML = `
            <div class="diagram-entity-title">
                ${escapeHTML(entity.name)}
            </div>

            ${attributesHTML}
        `;

        container.appendChild(entityBox);
    });

    diagramArea.innerHTML = "";
    diagramArea.appendChild(container);
}


/* =========================
   GENERATE SQL
========================= */

generateBtn.addEventListener("click", function () {

    if (entities.length === 0) {

        showValidation(
            "error",
            "Add at least one entity before generating SQL."
        );

        return;
    }

    let sql = "";

    entities.forEach(entity => {

        sql += `CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;

        entity.attributes.forEach((attribute, index) => {

            const comma =
                index === entity.attributes.length - 1
                    ? ""
                    : ",";

            const columnName =
                sanitizeSQLName(attribute);

            if (index === 0) {

                sql += `    ${columnName} INTEGER PRIMARY KEY${comma}\n`;

            } else {

                sql += `    ${columnName} VARCHAR(100)${comma}\n`;

            }

        });

        sql += `);\n\n`;
    });

    sqlOutput.textContent = sql.trim();

    showValidation(
        "success",
        "SQL generated successfully from the ER model."
    );
});


/* =========================
   COPY SQL
========================= */

copyBtn.addEventListener("click", async function () {

    const sql = sqlOutput.textContent;

    if (
        !sql ||
        sql === "-- Generated SQL will appear here."
    ) {

        showValidation(
            "error",
            "Generate SQL before copying it."
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(sql);

        copyBtn.textContent = "Copied!";

        setTimeout(() => {
            copyBtn.textContent = "Copy SQL";
        }, 1500);

    } catch (error) {

        showValidation(
            "error",
            "Unable to copy SQL automatically."
        );
    }
});


/* =========================
   VALIDATION
========================= */

function showValidation(type, message) {

    if (type === "error") {

        validationBox.style.background =
            "rgba(255, 107, 122, 0.08)";

        validationBox.style.borderColor =
            "rgba(255, 107, 122, 0.25)";

        validationBox.innerHTML = `
            <strong style="color: var(--danger)">
                Validation Error
            </strong>

            <p>${escapeHTML(message)}</p>
        `;

    } else {

        validationBox.style.background =
            "rgba(56, 211, 159, 0.08)";

        validationBox.style.borderColor =
            "rgba(56, 211, 159, 0.25)";

        validationBox.innerHTML = `
            <strong>
                Validation
            </strong>

            <p>${escapeHTML(message)}</p>
        `;
    }
}


/* =========================
   THEME
========================= */

themeBtn.addEventListener("click", function () {

    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {

        themeBtn.textContent = "☀";

    } else {

        themeBtn.textContent = "☾";

    }
});


/* =========================
   SECURITY / CLEAN INPUT
========================= */

function escapeHTML(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function sanitizeSQLName(value) {

    return value
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_");
}
