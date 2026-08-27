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

const relFrom = document.getElementById("relFrom");
const relTo = document.getElementById("relTo");
const relType = document.getElementById("cardinality");
const addRelBtn = document.getElementById("addRelBtn");
const relationshipList = document.getElementById("relationshipList");

const stepBadge = document.getElementById("stepBadge");
const flowEntities = document.getElementById("flowEntities");
const flowRelations = document.getElementById("flowRelations");
const flowSql = document.getElementById("flowSql");

let sqlGenerated = false;
let dragState = null;

function updateProgress() {
    const hasEntities = entities.length > 0;
    const hasRelationships = relationships.length > 0;
    const stepNumber = sqlGenerated ? 3 : (hasRelationships ? 2 : 1);

    if (stepBadge) stepBadge.textContent = `Step ${stepNumber}`;
    if (flowEntities) flowEntities.classList.toggle("active", hasEntities);
    if (flowRelations) flowRelations.classList.toggle("active", hasRelationships);
    if (flowSql) flowSql.classList.toggle("active", sqlGenerated);
}

function detectPrimaryKey(name) {
    name = name.toLowerCase().trim();
    return name === "id" || name.endsWith("_id");
}

function inferDataType(name) {
    name = name.toLowerCase().trim();

    if (name === "id" || name.endsWith("_id")) return "INTEGER";

    if ([
        "age","count","quantity","credits","credit","marks",
        "score","year","number","total"
    ].some(x => name.includes(x))) return "INTEGER";

    if ([
        "price","salary","amount","cost","rate","percentage",
        "gpa","cgpa","height","weight"
    ].some(x => name.includes(x))) return "DECIMAL";

    if ([
        "date","dob","birth","created","updated"
    ].some(x => name.includes(x))) return "DATE";

    if ([
        "is_","has_","active","enabled"
    ].some(x => name.includes(x))) return "BOOLEAN";

    return "VARCHAR";
}

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

function showValidation(type, message) {
    validationBox.style.background =
        type === "error"
            ? "rgba(255,107,122,.08)"
            : "rgba(56,211,159,.08)";

    validationBox.style.borderColor =
        type === "error"
            ? "rgba(255,107,122,.3)"
            : "rgba(56,211,159,.3)";

    validationBox.innerHTML = `
        <strong style="color:${type === "error" ? "var(--danger)" : "var(--text)"}">
            ${type === "error" ? "Validation Error" : "Validation"}
        </strong>
        <p>${escapeHTML(message)}</p>
    `;
}

/* ================================
   ADD ENTITY
================================ */

addEntityBtn.addEventListener("click", () => {
    const name = entityNameInput.value.trim();
    const text = attributesInput.value.trim();

    if (!name) {
        showValidation("error", "Please enter an entity name.");
        return;
    }

    if (!text) {
        showValidation("error", "Please enter at least one attribute.");
        return;
    }

    if (entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        showValidation("error", "This entity already exists.");
        return;
    }

    const names = text
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const attributes = names.map(x => ({
        name: x,
        type: inferDataType(x),
        primaryKey: detectPrimaryKey(x)
    }));

    if (!attributes.some(a => a.primaryKey)) {
        showValidation(
            "error",
            "Add an attribute such as student_id or id to identify the entity."
        );
        return;
    }

    entities.push({
        name,
        attributes
    });

    entityNameInput.value = "";
    attributesInput.value = "";

    renderEntities();
    updateRelationshipSelectors();
    renderDiagram();

    sqlGenerated = false;
    updateProgress();

    showValidation("success", `${name} added successfully.`);
});

/* ================================
   ENTITY LIST
================================ */

function renderEntities() {
    if (!entities.length) {
        entityList.innerHTML =
            `<div class="empty-state">No entities added yet.</div>`;
        return;
    }

    entityList.innerHTML = "";

    entities.forEach((entity, index) => {
        const item = document.createElement("div");
        item.className = "entity-item";

        const attrs = entity.attributes.map(a =>
            `${a.name} (${a.type})${a.primaryKey ? " 🔑" : ""}`
        ).join(", ");

        item.innerHTML = `
            <button class="delete-btn"
                onclick="deleteEntity(${index})">×</button>
            <strong>${escapeHTML(entity.name)}</strong>
            <span>${escapeHTML(attrs)}</span>
        `;

        entityList.appendChild(item);
    });
}

function deleteEntity(index) {
    const removed = entities[index];

    relationships = relationships.filter(r =>
        r.from !== removed.name && r.to !== removed.name
    );

    entities.splice(index, 1);

    renderEntities();
    updateRelationshipSelectors();
    renderRelationshipList();
    renderDiagram();

    sqlGenerated = false;
    updateProgress();

    showValidation("success", `${removed.name} removed.`);
}

/* ================================
   RELATIONSHIP SELECTORS
================================ */

function updateRelationshipSelectors() {
    if (!relFrom || !relTo) return;

    relFrom.innerHTML = `<option value="">Select entity</option>`;
    relTo.innerHTML = `<option value="">Select entity</option>`;

    entities.forEach(entity => {
        const option1 = document.createElement("option");
        option1.value = entity.name;
        option1.textContent = entity.name;

        const option2 = document.createElement("option");
        option2.value = entity.name;
        option2.textContent = entity.name;

        relFrom.appendChild(option1);
        relTo.appendChild(option2);
    });
}

/* ================================
   ADD RELATIONSHIP
================================ */

if (addRelBtn) {
    addRelBtn.addEventListener("click", () => {
        const from = relFrom.value;
        const to = relTo.value;
        const type = relType.value;

        if (!from || !to) {
            showValidation("error", "Select both entities first.");
            return;
        }

        if (from === to) {
            showValidation(
                "error",
                "Choose two different entities."
            );
            return;
        }

        if (relationships.some(r =>
            r.from === from &&
            r.to === to
        )) {
            showValidation(
                "error",
                "This relationship already exists."
            );
            return;
        }

        relationships.push({
            from,
            to,
            type,
            name: getRelationshipName(type),
            x: null,
            y: null
        });

        renderRelationshipList();
        renderDiagram();

        sqlGenerated = false;
        updateProgress();

        showValidation(
            "success",
            `${from} ${getRelationshipName(type)} ${to} relationship added.`
        );
    });
}

/* ================================
   RELATIONSHIP NAME
================================ */

function getRelationshipName(type) {
    if (type === "1:1") return "relates to";
    if (type === "1:N") return "has";
    if (type === "N:1") return "belongs to";
    if (type === "M:N") return "associated with";
    return "relates to";
}

/* ================================
   RELATIONSHIP LIST
================================ */

function renderRelationshipList() {
    if (!relationshipList) return;

    if (!relationships.length) {
        relationshipList.innerHTML =
            `<div class="empty-state">No relationships added yet.</div>`;
        return;
    }

    relationshipList.innerHTML = "";

    relationships.forEach((r, i) => {
        const item = document.createElement("div");
        item.className = "relationship-item";

        item.innerHTML = `
            <span>
                ${escapeHTML(r.from)}
                <b> ${escapeHTML(r.name)} </b>
                ${escapeHTML(r.to)}
                (${escapeHTML(r.type)})
            </span>
            <button onclick="deleteRelationship(${i})">×</button>
        `;

        relationshipList.appendChild(item);
    });
}

function deleteRelationship(index) {
    relationships.splice(index, 1);

    renderRelationshipList();
    renderDiagram();

    sqlGenerated = false;
    updateProgress();
}

/* ================================
   ER DIAGRAM
================================ */

function renderDiagram() {
    if (!entities.length) {
        diagramArea.innerHTML = `
            <div class="diagram-placeholder">
                <div class="placeholder-icon">◇</div>
                <h3>Your ER diagram will appear here</h3>
                <p>Add an entity to begin building your database model.</p>
            </div>
        `;
        return;
    }

    diagramArea.innerHTML = "";

    const canvas = document.createElement("div");
    canvas.className = "er-canvas";
    canvas.style.position = "relative";
    canvas.style.width = "1100px";
    canvas.style.height = "650px";
    canvas.style.minWidth = "1100px";
    canvas.style.minHeight = "650px";

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.classList.add("relationship-svg");
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "1";

    canvas.appendChild(svg);

    const positions = {};

    entities.forEach((entity, index) => {
        const wrapper = document.createElement("div");

        wrapper.className = "er-entity-wrapper";
        wrapper.dataset.entity = entity.name;

        let x = 180 + (index % 2) * 520;
        let y = 220 + Math.floor(index / 2) * 320;

        wrapper.style.position = "absolute";
        wrapper.style.left = `${x}px`;
        wrapper.style.top = `${y}px`;
        wrapper.style.zIndex = "5";

        const entityBox = document.createElement("div");
        entityBox.className = "er-entity";
        entityBox.textContent = entity.name;

        wrapper.appendChild(entityBox);

        positions[entity.name] = {
            wrapper,
            x,
            y
        };

        entity.attributes.forEach((attribute, attrIndex) => {
            const attributeWrapper =
                document.createElement("div");

            attributeWrapper.className =
                "er-attribute-wrapper";

            attributeWrapper.dataset.attribute =
                attribute.name;

            attributeWrapper.style.position = "absolute";

            const angle =
                (attrIndex / entity.attributes.length) *
                Math.PI * 2;

            const radius = 125;

            const ax =
                87 +
                Math.cos(angle) * radius -
                65;

            const ay =
                35 +
                Math.sin(angle) * radius -
                29;

            attributeWrapper.style.left = `${ax}px`;
            attributeWrapper.style.top = `${ay}px`;

            const oval =
                document.createElement("div");

            oval.className = "er-attribute";

            if (attribute.primaryKey) {
                oval.classList.add("primary-key");
            }

            oval.innerHTML = `
                <span class="attribute-name">
                    ${
                        attribute.primaryKey
                            ? `<u>${escapeHTML(attribute.name)}</u>`
                            : escapeHTML(attribute.name)
                    }
                </span>
                <span class="attribute-type">
                    ${escapeHTML(attribute.type)}
                </span>
            `;

            const line =
                document.createElement("div");

            line.className = "er-line";

            attributeWrapper.appendChild(oval);
            attributeWrapper.appendChild(line);
            wrapper.appendChild(attributeWrapper);

            makeDraggable(
                attributeWrapper,
                canvas,
                () => updateAllLines()
            );
        });

        canvas.appendChild(wrapper);

        makeDraggable(
            wrapper,
            canvas,
            () => updateAllLines(),
            true
        );
    });

    relationships.forEach((relationship, index) => {
        createRelationship(
            relationship,
            index,
            canvas,
            svg,
            positions
        );
    });

    diagramArea.appendChild(canvas);

    requestAnimationFrame(() => {
        updateAllLines();
    });
}

/* ================================
   DRAGGING
================================ */

function makeDraggable(element, container, onMove, isEntity = false) {
    element.style.cursor = "grab";

    element.addEventListener("mousedown", e => {
        if (e.button !== 0) return;

        e.preventDefault();

        const rect = element.getBoundingClientRect();
        const containerRect =
            container.getBoundingClientRect();

        const offsetX =
            e.clientX - rect.left;

        const offsetY =
            e.clientY - rect.top;

        element.style.cursor = "grabbing";

        dragState = {
            element,
            container,
            offsetX,
            offsetY,
            onMove,
            isEntity
        };

        document.addEventListener(
            "mousemove",
            dragMove
        );

        document.addEventListener(
            "mouseup",
            dragEnd
        );
    });
}

function dragMove(e) {
    if (!dragState) return;

    const {
        element,
        container,
        offsetX,
        offsetY,
        onMove
    } = dragState;

    const containerRect =
        container.getBoundingClientRect();

    let x =
        e.clientX -
        containerRect.left -
        offsetX;

    let y =
        e.clientY -
        containerRect.top -
        offsetY;

    x = Math.max(0, x);
    y = Math.max(0, y);

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    if (onMove) onMove();
}

function dragEnd() {
    if (dragState) {
        dragState.element.style.cursor = "grab";
    }

    dragState = null;

    document.removeEventListener(
        "mousemove",
        dragMove
    );

    document.removeEventListener(
        "mouseup",
        dragEnd
    );
}

/* ================================
   RELATIONSHIP CREATION
================================ */

function createRelationship(
    relationship,
    index,
    canvas,
    svg,
    positions
) {
    const fromPosition =
        positions[relationship.from];

    const toPosition =
        positions[relationship.to];

    if (!fromPosition || !toPosition) return;

    const diamond =
        document.createElement("div");

    diamond.className =
        "er-relationship";

    diamond.dataset.relationship =
        index;

    diamond.style.position =
        "absolute";

    diamond.style.width = "110px";
    diamond.style.height = "70px";

    diamond.style.left =
        relationship.x !== null
            ? `${relationship.x}px`
            : `${(fromPosition.x + toPosition.x) / 2 + 45}px`;

    diamond.style.top =
        relationship.y !== null
            ? `${relationship.y}px`
            : `${(fromPosition.y + toPosition.y) / 2 + 40}px`;

    diamond.style.zIndex = "8";

    diamond.innerHTML = `
        <div class="relationship-diamond">
            <span>${escapeHTML(relationship.name)}</span>
        </div>

        <div class="cardinality cardinality-from">
            ${escapeHTML(getFromCardinality(relationship.type))}
        </div>

        <div class="cardinality cardinality-to">
            ${escapeHTML(getToCardinality(relationship.type))}
        </div>
    `;

    canvas.appendChild(diamond);

    makeDraggable(
        diamond,
        canvas,
        () => {
            saveRelationshipPosition(
                index,
                diamond
            );

            updateAllLines();
        }
    );

    relationship._diamond = diamond;
    relationship._svg = svg;
}

/* ================================
   CARDINALITY
================================ */

function getFromCardinality(type) {
    if (type === "1:1") return "1";
    if (type === "1:N") return "1";
    if (type === "N:1") return "N";
    if (type === "M:N") return "M";
    return "";
}

function getToCardinality(type) {
    if (type === "1:1") return "1";
    if (type === "1:N") return "N";
    if (type === "N:1") return "1";
    if (type === "M:N") return "N";
    return "";
}

/* ================================
   SAVE RELATIONSHIP POSITION
================================ */

function saveRelationshipPosition(
    index,
    diamond
) {
    const x = parseFloat(
        diamond.style.left
    );

    const y = parseFloat(
        diamond.style.top
    );

    if (relationships[index]) {
        relationships[index].x = x;
        relationships[index].y = y;
    }
}

/* ================================
   DRAW RELATIONSHIP LINES
================================ */

function updateAllLines() {
    const canvas =
        document.querySelector(".er-canvas");

    const svg =
        document.querySelector(".relationship-svg");

    if (!canvas || !svg) return;

    svg.innerHTML = "";

    relationships.forEach(
        (relationship, index) => {
            const diamond =
                relationship._diamond;

            if (!diamond) return;

            const from =
                document.querySelector(
                    `.er-entity-wrapper[data-entity="${CSS.escape(relationship.from)}"]`
                );

            const to =
                document.querySelector(
                    `.er-entity-wrapper[data-entity="${CSS.escape(relationship.to)}"]`
                );

            if (!from || !to) return;

            const canvasRect =
                canvas.getBoundingClientRect();

            const fromRect =
                from.getBoundingClientRect();

            const toRect =
                to.getBoundingClientRect();

            const diamondRect =
                diamond.getBoundingClientRect();

            const fromCenter = {
                x:
                    fromRect.left -
                    canvasRect.left +
                    fromRect.width / 2,

                y:
                    fromRect.top -
                    canvasRect.top +
                    fromRect.height / 2
            };

            const toCenter = {
                x:
                    toRect.left -
                    canvasRect.left +
                    toRect.width / 2,

                y:
                    toRect.top -
                    canvasRect.top +
                    toRect.height / 2
            };

            const diamondCenter = {
                x:
                    diamondRect.left -
                    canvasRect.left +
                    diamondRect.width / 2,

                y:
                    diamondRect.top -
                    canvasRect.top +
                    diamondRect.height / 2
            };

            drawLine(
                svg,
                fromCenter.x,
                fromCenter.y,
                diamondCenter.x,
                diamondCenter.y
            );

            drawLine(
                svg,
                diamondCenter.x,
                diamondCenter.y,
                toCenter.x,
                toCenter.y
            );
        }
    );

    drawAttributeLines();
}

/* ================================
   ATTRIBUTE LINES
================================ */

function drawAttributeLines() {
    const canvas =
        document.querySelector(".er-canvas");

    if (!canvas) return;

    document
        .querySelectorAll(".er-entity-wrapper")
        .forEach(wrapper => {

            const entityRect =
                wrapper.getBoundingClientRect();

            const canvasRect =
                canvas.getBoundingClientRect();

            const entityCenter = {
                x:
                    entityRect.left -
                    canvasRect.left +
                    entityRect.width / 2,

                y:
                    entityRect.top -
                    canvasRect.top +
                    entityRect.height / 2
            };

            wrapper
                .querySelectorAll(
                    ".er-attribute-wrapper"
                )
                .forEach(attributeWrapper => {

                    const attrRect =
                        attributeWrapper.getBoundingClientRect();

                    const attrCenter = {
                        x:
                            attrRect.left -
                            canvasRect.left +
                            attrRect.width / 2,

                        y:
                            attrRect.top -
                            canvasRect.top +
                            attrRect.height / 2
                    };

                    const line =
                        attributeWrapper.querySelector(
                            ".er-line"
                        );

                    if (!line) return;

                    const dx =
                        entityCenter.x -
                        attrCenter.x;

                    const dy =
                        entityCenter.y -
                        attrCenter.y;

                    const distance =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );

                    line.style.width =
                        `${distance}px`;

                    line.style.height =
                        "2px";

                    line.style.left =
                        "50%";

                    line.style.top =
                        "50%";

                    line.style.transformOrigin =
                        "0 50%";

                    line.style.transform =
                        `rotate(${Math.atan2(dy, dx)}rad)`;

                    line.style.position =
                        "absolute";

                    line.style.zIndex =
                        "-1";
                });
        });
}

/* ================================
   SVG LINE
================================ */

function drawLine(
    svg,
    x1,
    y1,
    x2,
    y2
) {
    const line =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    line.setAttribute(
        "x1",
        x1
    );

    line.setAttribute(
        "y1",
        y1
    );

    line.setAttribute(
        "x2",
        x2
    );

    line.setAttribute(
        "y2",
        y2
    );

    line.setAttribute(
        "stroke",
        "#8c99af"
    );

    line.setAttribute(
        "stroke-width",
        "2"
    );

    svg.appendChild(line);
}

/* ================================
   GENERATE SQL
================================ */

generateBtn.addEventListener(
    "click",
    () => {

        if (!entities.length) {
            showValidation(
                "error",
                "Add an entity before generating SQL."
            );
            return;
        }

        let sql = "";

        entities.forEach(entity => {
            sql +=
                `CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;

            entity.attributes.forEach(
                (attribute, index) => {

                    let type =
                        attribute.type;

                    if (type === "VARCHAR") {
                        type = "VARCHAR(100)";
                    }

                    let line =
                        `    ${sanitizeSQLName(attribute.name)} ${type}`;

                    if (attribute.primaryKey) {
                        line +=
                            " PRIMARY KEY";
                    }

                    if (
                        index <
                        entity.attributes.length - 1
                    ) {
                        line += ",";
                    }

                    sql += line + "\n";
                }
            );

            sql += ");\n\n";
        });

        /* ============================
           RELATIONSHIP TABLES
        ============================ */

        relationships.forEach(
            relationship => {

                const fromEntity =
                    entities.find(
                        e =>
                            e.name ===
                            relationship.from
                    );

                const toEntity =
                    entities.find(
                        e =>
                            e.name ===
                            relationship.to
                    );

                if (!fromEntity || !toEntity) {
                    return;
                }

                const fromPK =
                    fromEntity.attributes.find(
                        a => a.primaryKey
                    );

                const toPK =
                    toEntity.attributes.find(
                        a => a.primaryKey
                    );

                if (!fromPK || !toPK) {
                    return;
                }

                /* M:N gets its own relationship table */

                if (
                    relationship.type === "M:N"
                ) {
                    const tableName =
                        sanitizeSQLName(
                            `${relationship.from}_${relationship.name}_${relationship.to}`
                        );

                    sql +=
                        `CREATE TABLE ${tableName} (\n`;

                    sql +=
                        `    ${sanitizeSQLName(relationship.from)}_${sanitizeSQLName(fromPK.name)} ${fromPK.type},\n`;

                    sql +=
                        `    ${sanitizeSQLName(relationship.to)}_${sanitizeSQLName(toPK.name)} ${toPK.type},\n`;

                    sql +=
                        `    PRIMARY KEY (${sanitizeSQLName(relationship.from)}_${sanitizeSQLName(fromPK.name)}, ${sanitizeSQLName(relationship.to)}_${sanitizeSQLName(toPK.name)})\n`;

                    sql += ");\n\n";
                }

                /* 1:N */

                else if (
                    relationship.type === "1:N"
                ) {
                    sql +=
                        `-- Relationship: ${relationship.from} ${relationship.name} ${relationship.to}\n`;

                    sql +=
                        `-- Foreign key: ${relationship.to}.${relationship.from}_${fromPK.name}\n\n`;
                }

                /* N:1 */

                else if (
                    relationship.type === "N:1"
                ) {
                    sql +=
                        `-- Relationship: ${relationship.from} ${relationship.name} ${relationship.to}\n`;

                    sql +=
                        `-- Foreign key: ${relationship.from}.${relationship.to}_${toPK.name}\n\n`;
                }

                /* 1:1 */

                else if (
                    relationship.type === "1:1"
                ) {
                    sql +=
                        `-- Relationship: ${relationship.from} ${relationship.name} ${relationship.to}\n`;

                    sql +=
                        `-- Foreign key can be added between the two entities.\n\n`;
                }
            }
        );

        sqlOutput.textContent =
            sql.trim();

        sqlGenerated = true;
        updateProgress();

        showValidation(
            "success",
            "SQL generated successfully from the ER model."
        );
    }
);

/* ================================
   COPY SQL
================================ */

copyBtn.addEventListener(
    "click",
    async () => {

        const sql =
            sqlOutput.textContent;

        if (
            !sql ||
            sql ===
            "-- Generated SQL will appear here."
        ) {
            showValidation(
                "error",
                "Generate SQL first."
            );
            return;
        }

        try {
            await navigator.clipboard.writeText(sql);

            copyBtn.textContent =
                "Copied!";

            setTimeout(
                () => {
                    copyBtn.textContent =
                        "Copy SQL";
                },
                1500
            );

        } catch {
            showValidation(
                "error",
                "Unable to copy SQL."
            );
        }
    }
);

/* ================================
   THEME
================================ */

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );

        themeBtn.textContent =
            document.body.classList.contains(
                "light"
            )
                ? "☀"
                : "☾";
    }
);

/* ================================
   RESIZE
================================ */

window.addEventListener(
    "resize",
    () => {
        updateAllLines();
    }
);

/* ================================
   INITIALIZATION
================================ */

updateRelationshipSelectors();
renderEntities();
renderRelationshipList();
updateProgress();
