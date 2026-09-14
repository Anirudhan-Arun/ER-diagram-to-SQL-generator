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
const resetLayoutBtn = document.getElementById("resetLayoutBtn");

const relFrom = document.getElementById("relFrom");
const relName = document.getElementById("relName");
const relTo = document.getElementById("relTo");
const relType = document.getElementById("cardinality");
const addRelBtn = document.getElementById("addRelBtn");
const relationshipList = document.getElementById("relationshipList");

const stepBadge = document.getElementById("stepBadge");
const flowEntities = document.getElementById("flowEntities");
const flowRelations = document.getElementById("flowRelations");
const flowSql = document.getElementById("flowSql");

let sqlGenerated = false;

/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {
    const hasEntities = entities.length > 0;
    const hasRelationships = relationships.length > 0;

    const stepNumber = sqlGenerated ? 3 : (hasRelationships ? 2 : 1);

    if (stepBadge) stepBadge.textContent = `Step ${stepNumber}`;
    if (flowEntities) flowEntities.classList.toggle("active", hasEntities);
    if (flowRelations) flowRelations.classList.toggle("active", hasRelationships);
    if (flowSql) flowSql.classList.toggle("active", sqlGenerated);
}

/* =========================================================
   HELPERS
========================================================= */

let attributeUid = 0;

function detectPrimaryKey(name) {
    name = name.toLowerCase().trim();
    return name === "id" || name.endsWith("_id");
}

function inferDataType(name) {
    name = name.toLowerCase().trim();

    if (name === "id" || name.endsWith("_id")) return "INTEGER";

    if (["age", "count", "quantity", "credits", "credit", "marks", "score", "year", "number", "total"]
        .some(x => name.includes(x))) return "INTEGER";

    if (["price", "salary", "amount", "cost", "rate", "percentage"]
        .some(x => name.includes(x))) return "DECIMAL";

    if (["date", "dob", "birth", "created", "updated"]
        .some(x => name.includes(x))) return "DATE";

    if (["is_", "has_", "active", "enabled"]
        .some(x => name.includes(x))) return "BOOLEAN";

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
    validationBox.style.background = type === "error" ? "rgba(255,107,122,.08)" : "rgba(56,211,159,.08)";
    validationBox.style.borderColor = type === "error" ? "rgba(255,107,122,.3)" : "rgba(56,211,159,.3)";
    validationBox.innerHTML = `
        <strong style="color:${type === "error" ? "var(--danger)" : "var(--text)"}">
            ${type === "error" ? "Validation Error" : "Validation"}
        </strong>
        <p>${escapeHTML(message)}</p>
    `;
}

/* =========================================================
   ADD ENTITY
========================================================= */

addEntityBtn.addEventListener("click", () => {
    const name = entityNameInput.value.trim();
    const text = attributesInput.value.trim();

    if (!name) return showValidation("error", "Please enter an entity name.");
    if (!text) return showValidation("error", "Please enter at least one attribute.");
    if (entities.some(e => e.name.toLowerCase() === name.toLowerCase()))
        return showValidation("error", "This entity already exists.");

    const names = text.split(",").map(x => x.trim()).filter(Boolean);

    const attributes = names.map(x => ({
        id: `attr_${attributeUid++}`,
        name: x,
        type: inferDataType(x),
        primaryKey: detectPrimaryKey(x),
        startOffsetX: 0, // manual drag of the line's end that sits on the entity
        startOffsetY: 0,
        lineOffsetX: 0,  // manual bend in the middle of the line
        lineOffsetY: 0,
        endOffsetX: 0,   // manual drag of the line's end that sits on the attribute
        endOffsetY: 0
    }));

    if (!attributes.some(a => a.primaryKey))
        return showValidation("error", "Add an attribute such as student_id or id to identify the entity.");

    entities.push({ name, attributes, x: null, y: null });

    entityNameInput.value = "";
    attributesInput.value = "";

    renderEntities();
    updateRelationshipSelectors();
    renderDiagram();

    sqlGenerated = false;
    updateProgress();

    showValidation("success", `${name} added successfully.`);
});

/* =========================================================
   ENTITY LIST
========================================================= */

function renderEntities() {
    if (!entities.length) {
        entityList.innerHTML = `<div class="empty-state">No entities added yet.</div>`;
        return;
    }

    entityList.innerHTML = "";

    entities.forEach((entity, index) => {
        const item = document.createElement("div");
        item.className = "entity-item";

        const attrs = entity.attributes
            .map(a => `${a.name} (${a.type})${a.primaryKey ? " 🔑" : ""}`)
            .join(", ");

        item.innerHTML = `
            <button class="delete-btn" onclick="deleteEntity(${index})">×</button>
            <strong>${escapeHTML(entity.name)}</strong>
            <span>${escapeHTML(attrs)}</span>
        `;

        entityList.appendChild(item);
    });
}

function deleteEntity(index) {
    const removed = entities[index];

    relationships = relationships.filter(r => r.from !== removed.name && r.to !== removed.name);
    entities.splice(index, 1);

    renderEntities();
    updateRelationshipSelectors();
    renderRelationshipList();
    renderDiagram();

    sqlGenerated = false;
    updateProgress();

    showValidation("success", `${removed.name} removed.`);
}

/* =========================================================
   RELATIONSHIP SELECTORS
========================================================= */

function updateRelationshipSelectors() {
    if (!relFrom || !relTo) return;

    const oldFrom = relFrom.value;
    const oldTo = relTo.value;

    relFrom.innerHTML = '<option value="">Select entity</option>';
    relTo.innerHTML = '<option value="">Select entity</option>';

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

    if (entities.some(e => e.name === oldFrom)) relFrom.value = oldFrom;
    if (entities.some(e => e.name === oldTo)) relTo.value = oldTo;
}

/* =========================================================
   ADD RELATIONSHIP
========================================================= */

if (addRelBtn) {
    addRelBtn.addEventListener("click", () => {
        const from = relFrom.value;
        const to = relTo.value;
        const type = relType.value;
        const name = relName ? relName.value.trim() : "";

        if (!from || !to) return showValidation("error", "Select both entities first.");
        if (!name) return showValidation("error", "Enter a relationship name such as teaches.");
        if (from === to) return showValidation("error", "Choose two different entities.");
        if (relationships.some(r => r.from === from && r.to === to))
            return showValidation("error", "This relationship already exists.");

        relationships.push({
            from,
            to,
            name,
            type,
            x: null, // absolute canvas position of the diamond center; null = "not yet placed"
            y: null,
            // "from" segment: fromEntity <-> diamond
            fromSegStartOffsetX: 0, // manual drag of the end that sits on the "from" entity
            fromSegStartOffsetY: 0,
            fromOffsetX: 0,         // manual bend in the middle
            fromOffsetY: 0,
            fromSegEndOffsetX: 0,   // manual drag of the end that sits on the diamond
            fromSegEndOffsetY: 0,
            // "to" segment: diamond <-> toEntity
            toSegStartOffsetX: 0,   // manual drag of the end that sits on the diamond
            toSegStartOffsetY: 0,
            toOffsetX: 0,           // manual bend in the middle
            toOffsetY: 0,
            toSegEndOffsetX: 0,     // manual drag of the end that sits on the "to" entity
            toSegEndOffsetY: 0
        });

        if (relName) relName.value = "";

        renderRelationshipList();
        renderDiagram();

        sqlGenerated = false;
        updateProgress();

        showValidation("success", `${name} relationship added between ${from} and ${to}.`);
    });
}

/* =========================================================
   RELATIONSHIP LIST
========================================================= */

function renderRelationshipList() {
    if (!relationshipList) return;

    if (!relationships.length) {
        relationshipList.innerHTML = `<div class="empty-state">No relationships added yet.</div>`;
        return;
    }

    relationshipList.innerHTML = "";

    relationships.forEach((r, i) => {
        const item = document.createElement("div");
        item.className = "relationship-item";

        item.innerHTML = `
            <span>${escapeHTML(r.from)} → ${escapeHTML(r.name)} → ${escapeHTML(r.to)} (${escapeHTML(r.type)})</span>
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

/* =========================================================
   UNIVERSAL FREE DRAGGING
   Every draggable shape (entity, attribute, relationship
   diamond) uses this same function. Position is stored as
   plain left/top pixel values on the element itself, so any
   shape can move anywhere on the canvas independently of any
   other shape. onMove fires on every pixel of movement so
   connecting lines can be redrawn live.
========================================================= */

// Updated every render; used to keep dragged shapes inside the scrollable area.
let currentCanvasWidth = 0;
let currentCanvasHeight = 0;

function makeDraggable(element, onMove) {
    let dragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let originLeft = 0;
    let originTop = 0;

    element.style.touchAction = "none";

    element.addEventListener("pointerdown", e => {
        if (e.target.closest("button")) return;

        dragging = true;
        element.classList.add("dragging");
        element.setPointerCapture(e.pointerId);

        startClientX = e.clientX;
        startClientY = e.clientY;
        originLeft = parseFloat(element.style.left) || 0;
        originTop = parseFloat(element.style.top) || 0;

        element.style.cursor = "grabbing";

        e.preventDefault();
        e.stopPropagation();
    });

    element.addEventListener("pointermove", e => {
        if (!dragging) return;

        const dx = e.clientX - startClientX;
        const dy = e.clientY - startClientY;

        // Clamp to the canvas so a shape can never be dragged somewhere the
        // scroll area can't reach (which is what made shapes "disappear
        // forever" before).
        const maxLeft = Math.max(0, currentCanvasWidth - element.offsetWidth);
        const maxTop = Math.max(0, currentCanvasHeight - element.offsetHeight);

        const newLeft = Math.min(maxLeft, Math.max(0, originLeft + dx));
        const newTop = Math.min(maxTop, Math.max(0, originTop + dy));

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;

        if (onMove) onMove(newLeft, newTop);

        e.stopPropagation();
    });

    const stop = e => {
        if (!dragging) return;
        dragging = false;
        element.style.cursor = "grab";
        element.classList.remove("dragging");
        e.stopPropagation();
    };

    element.addEventListener("pointerup", stop);
    element.addEventListener("pointercancel", stop);
}

/* =========================================================
   EDGE-INTERSECTION MATH
   These compute the exact point on a shape's boundary where a
   line toward another shape's center should stop, so lines
   always terminate ON the shape instead of floating near it
   or plunging through its middle.
========================================================= */

// Rectangle boundary point in the direction (dx,dy) from its center.
function rectEdgePoint(cx, cy, halfW, halfH, dx, dy) {
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
    const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
    const scale = Math.min(scaleX, scaleY);
    return { x: cx + dx * scale, y: cy + dy * scale };
}

// Ellipse boundary point in the direction (dx,dy) from its center.
function ellipseEdgePoint(cx, cy, halfW, halfH, dx, dy) {
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const denom = Math.sqrt((dx * dx) / (halfW * halfW) + (dy * dy) / (halfH * halfH));
    const t = denom === 0 ? 0 : 1 / denom;
    return { x: cx + dx * t, y: cy + dy * t };
}

// Diamond (rhombus) boundary point in the direction (dx,dy) from its center.
function diamondEdgePoint(cx, cy, halfW, halfH, dx, dy) {
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const denom = Math.abs(dx) / halfW + Math.abs(dy) / halfH;
    const t = denom === 0 ? 0 : 1 / denom;
    return { x: cx + dx * t, y: cy + dy * t };
}

function centerOf(el) {
    return {
        x: (parseFloat(el.style.left) || 0) + el.offsetWidth / 2,
        y: (parseFloat(el.style.top) || 0) + el.offsetHeight / 2,
        halfW: el.offsetWidth / 2,
        halfH: el.offsetHeight / 2
    };
}

/* =========================================================
   ER DIAGRAM
========================================================= */

// Live registries rebuilt on every render, used by redraw().
let entityEls = {};      // name -> wrapper element
let attributeEls = [];   // [{ el, entityName }]
let relationshipEls = []; // [{ el, relationship }]
let svgLayer = null;

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
    entityEls = {};
    attributeEls = [];
    relationshipEls = [];

    const canvas = document.createElement("div");
    canvas.className = "er-canvas";
    canvas.style.position = "relative";

    const COLUMNS = Math.min(3, entities.length) || 1;
    const COL_SPACING = 620;
    const ROW_SPACING = 520;
    const rows = Math.ceil(entities.length / COLUMNS);

    // The diagram's natural footprint (entities + room for attributes and
    // relationship diamonds spreading out around them).
    const naturalContentWidth = COLUMNS * COL_SPACING + 900;
    const naturalContentHeight = rows * ROW_SPACING + 900;

    // The canvas itself is always 4x that footprint, so there is always at
    // least 1.5x the diagram's own size worth of empty space to drag into on
    // every side, no matter how the diagram is arranged.
    const canvasWidth = naturalContentWidth * 4;
    const canvasHeight = naturalContentHeight * 4;

    // Center the default grid inside the much larger canvas.
    const START_X = (canvasWidth - COLUMNS * COL_SPACING) / 2;
    const START_Y = (canvasHeight - rows * ROW_SPACING) / 2;

    currentCanvasWidth = canvasWidth;
    currentCanvasHeight = canvasHeight;

    canvas.style.minWidth = canvasWidth + "px";
    canvas.style.minHeight = canvasHeight + "px";

    svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgLayer.classList.add("relationship-svg");
    svgLayer.style.position = "absolute";
    svgLayer.style.left = "0";
    svgLayer.style.top = "0";
    svgLayer.style.width = canvasWidth + "px";
    svgLayer.style.height = canvasHeight + "px";
    svgLayer.style.pointerEvents = "none";
    svgLayer.style.overflow = "visible";
    // Sits ABOVE entities (5), attributes (4), and diamonds (6) in stacking
    // order. Combined with pointer-events:none on the layer itself and
    // pointer-events:all only on individual handle circles, this guarantees
    // a click precisely on a handle always hits the handle — never the
    // shape underneath it — while clicks anywhere else pass straight
    // through to the shape below as normal.
    svgLayer.style.zIndex = "50";
    canvas.appendChild(svgLayer);

    // --- ENTITIES ---
    entities.forEach((entity, index) => {
        const defaultX = entity.x ?? (START_X + (index % COLUMNS) * COL_SPACING);
        const defaultY = entity.y ?? (START_Y + Math.floor(index / COLUMNS) * ROW_SPACING);
        entity.x = defaultX;
        entity.y = defaultY;

        const wrapper = document.createElement("div");
        wrapper.className = "er-entity-wrapper";
        wrapper.style.position = "absolute";
        wrapper.style.left = `${defaultX}px`;
        wrapper.style.top = `${defaultY}px`;
        wrapper.style.cursor = "grab";

        const entityBox = document.createElement("div");
        entityBox.className = "er-entity";
        entityBox.textContent = entity.name;
        wrapper.appendChild(entityBox);

        canvas.appendChild(wrapper);
        entityEls[entity.name] = wrapper;

        makeDraggable(wrapper, (newLeft, newTop) => {
            entity.x = newLeft;
            entity.y = newTop;
            redrawConnections();
        });

        // --- ATTRIBUTES (siblings of entity, NOT nested, so they drag independently) ---
        const anchorOffsets = [
            { dx: 20, dy: -190 },   // top
            { dx: 260, dy: 40 },    // right
            { dx: 20, dy: 260 },    // bottom
            { dx: -260, dy: 40 }    // left
        ];

        entity.attributes.forEach((attribute, attributeIndex) => {
            const ring = Math.floor(attributeIndex / 4);
            const anchor = anchorOffsets[attributeIndex % 4];
            const ringPadding = ring * 90;

            const defaultAX = attribute.x ?? (defaultX + anchor.dx + (anchor.dx < 0 ? -ringPadding : anchor.dx > 100 ? ringPadding : 0));
            const defaultAY = attribute.y ?? (defaultY + anchor.dy + (anchor.dy < 0 ? -ringPadding : ringPadding));
            attribute.x = defaultAX;
            attribute.y = defaultAY;

            const attrWrapper = document.createElement("div");
            attrWrapper.className = "er-attribute-wrapper";
            attrWrapper.style.position = "absolute";
            attrWrapper.style.left = `${defaultAX}px`;
            attrWrapper.style.top = `${defaultAY}px`;
            attrWrapper.style.cursor = "grab";

            const attrOval = document.createElement("div");
            attrOval.className = "er-attribute";
            if (attribute.primaryKey) attrOval.classList.add("primary-key");

            attrOval.innerHTML = `
                <span class="attribute-name">${attribute.primaryKey ? `<u>${escapeHTML(attribute.name)}</u>` : escapeHTML(attribute.name)}</span>
                <span class="attribute-type">${escapeHTML(attribute.type)}</span>
            `;

            attrWrapper.appendChild(attrOval);
            canvas.appendChild(attrWrapper);

            attributeEls.push({ el: attrWrapper, entityName: entity.name, attribute });

            makeDraggable(attrWrapper, (newLeft, newTop) => {
                attribute.x = newLeft;
                attribute.y = newTop;
                redrawConnections();
            });
        });
    });

    // --- RELATIONSHIP DIAMONDS (real draggable DOM elements, not SVG hit-circles) ---
    relationships.forEach(relationship => {
        const fromEl = entityEls[relationship.from];
        const toEl = entityEls[relationship.to];
        if (!fromEl || !toEl) return;

        if (relationship.x == null || relationship.y == null) {
            const fromC = centerOf(fromEl);
            const toC = centerOf(toEl);
            relationship.x = (fromC.x + toC.x) / 2 - 45;
            relationship.y = (fromC.y + toC.y) / 2 - 45;
        }

        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.left = `${relationship.x}px`;
        wrapper.style.top = `${relationship.y}px`;
        wrapper.style.width = "90px";
        wrapper.style.height = "90px";
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.justifyContent = "center";
        wrapper.style.cursor = "grab";
        wrapper.style.zIndex = "6";

        const diamond = document.createElement("div");
        diamond.style.width = "62px";
        diamond.style.height = "62px";
        diamond.style.transform = "rotate(45deg)";
        diamond.style.background = "var(--panel)";
        diamond.style.border = "2px solid var(--success)";
        diamond.style.boxShadow = "0 6px 16px rgba(0,0,0,.25)";

        const label = document.createElement("div");
        label.textContent = relationship.name && relationship.name.trim() ? relationship.name.trim() : "RELATES";
        label.style.position = "absolute";
        label.style.maxWidth = "80px";
        label.style.textAlign = "center";
        label.style.fontSize = "11px";
        label.style.fontWeight = "700";
        label.style.color = "var(--text)";
        label.style.pointerEvents = "none";

        wrapper.appendChild(diamond);
        wrapper.appendChild(label);
        canvas.appendChild(wrapper);

        relationshipEls.push({ el: wrapper, relationship });

        makeDraggable(wrapper, (newLeft, newTop) => {
            relationship.x = newLeft;
            relationship.y = newTop;
            redrawConnections();
        });
    });

    diagramArea.appendChild(canvas);

    // Center the visible scroll area on the diagram content, since the
    // canvas is now 4x bigger than the content itself.
    requestAnimationFrame(() => {
        diagramArea.scrollLeft = (canvasWidth - diagramArea.clientWidth) / 2;
        diagramArea.scrollTop = (canvasHeight - diagramArea.clientHeight) / 2;
        redrawConnections();
    });
}

/* =========================================================
   REDRAW ALL CONNECTING LINES
   Called after ANY shape moves. Nothing is cached — every
   line is recomputed from the live position of both shapes it
   connects, so a line can never go stale or point at empty
   space.
========================================================= */

function createSVGEl(type) {
    return document.createElementNS("http://www.w3.org/2000/svg", type);
}

function isLight() {
    return document.body.classList.contains("light");
}

// Drag helper for the small handle dots that live directly on the SVG lines.
// Since the svg is drawn 1:1 with canvas pixels (no viewBox scaling), raw
// clientX/clientY deltas map straight onto svg coordinate deltas.
function makeSvgHandleDraggable(handleEl, onDrag) {
    let dragging = false;
    let startClientX = 0;
    let startClientY = 0;

    handleEl.style.pointerEvents = "all";
    handleEl.style.cursor = "grab";

    handleEl.addEventListener("pointerdown", e => {
        dragging = true;
        handleEl.setPointerCapture(e.pointerId);
        handleEl.style.cursor = "grabbing";
        startClientX = e.clientX;
        startClientY = e.clientY;
        e.preventDefault();
        e.stopPropagation();
    });

    handleEl.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startClientX;
        const dy = e.clientY - startClientY;
        startClientX = e.clientX;
        startClientY = e.clientY;
        onDrag(dx, dy);
        e.stopPropagation();
    });

    const stop = e => {
        if (!dragging) return;
        dragging = false;
        handleEl.style.cursor = "grab";
        e.stopPropagation();
    };

    handleEl.addEventListener("pointerup", stop);
    handleEl.addEventListener("pointercancel", stop);
}

// Point on a quadratic bezier at fraction t, given start/control/end.
function quadraticPoint(p0, p1, p2, t) {
    const mt = 1 - t;
    return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
}

// Draws one small draggable circular handle at (x,y). onDrag receives the
// raw pixel delta of the drag; endpoint handles are drawn solid (they mark
// where the line attaches), the bend handle is drawn hollow (it only curves
// the path in between).
function drawHandle(x, y, onDrag, variant) {
    const handle = createSVGEl("circle");
    handle.setAttribute("cx", x);
    handle.setAttribute("cy", y);
    handle.setAttribute("r", variant === "endpoint" ? "9" : "6");
    handle.setAttribute("fill", variant === "endpoint" ? "#6c8cff" : (isLight() ? "#ffffff" : "#11182b"));
    handle.setAttribute("stroke", "#6c8cff");
    handle.setAttribute("stroke-width", "2");
    svgLayer.appendChild(handle);
    makeSvgHandleDraggable(handle, onDrag);
}

// Draws a connector between two shapes with THREE draggable points:
//   - a handle at the start (drag it to move where the line touches shape A)
//   - a handle in the middle (drag it to bend the path)
//   - a handle at the end (drag it to move where the line touches shape B)
// `anchorStart`/`anchorEnd` are the auto-computed default touch points on
// each shape's boundary. `holder` is the attribute or relationship object
// that persists the offsets; `keys` names the six offset fields on it:
// { sx, sy, bx, by, ex, ey } for start/bend/end x/y.
// Returns the actual {start,end} points used, for label placement.
function drawDraggableConnector(anchorStart, anchorEnd, holder, keys) {
    const actualStart = {
        x: anchorStart.x + (holder[keys.sx] || 0),
        y: anchorStart.y + (holder[keys.sy] || 0)
    };
    const actualEnd = {
        x: anchorEnd.x + (holder[keys.ex] || 0),
        y: anchorEnd.y + (holder[keys.ey] || 0)
    };

    const midX = (actualStart.x + actualEnd.x) / 2;
    const midY = (actualStart.y + actualEnd.y) / 2;

    const control = {
        x: midX + (holder[keys.bx] || 0),
        y: midY + (holder[keys.by] || 0)
    };

    const path = createSVGEl("path");
    path.setAttribute("d", `M ${actualStart.x},${actualStart.y} Q ${control.x},${control.y} ${actualEnd.x},${actualEnd.y}`);
    path.setAttribute("stroke", "#8c99af");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svgLayer.appendChild(path);

    // Start handle — reattach this end anywhere.
    drawHandle(actualStart.x, actualStart.y, (dx, dy) => {
        holder[keys.sx] = (holder[keys.sx] || 0) + dx;
        holder[keys.sy] = (holder[keys.sy] || 0) + dy;
        redrawConnections();
    }, "endpoint");

    // Bend handle — curve the middle of the path.
    const bendPos = quadraticPoint(actualStart, control, actualEnd, 0.5);
    drawHandle(bendPos.x, bendPos.y, (dx, dy) => {
        holder[keys.bx] = (holder[keys.bx] || 0) + dx;
        holder[keys.by] = (holder[keys.by] || 0) + dy;
        redrawConnections();
    }, "bend");

    // End handle — reattach this end anywhere.
    drawHandle(actualEnd.x, actualEnd.y, (dx, dy) => {
        holder[keys.ex] = (holder[keys.ex] || 0) + dx;
        holder[keys.ey] = (holder[keys.ey] || 0) + dy;
        redrawConnections();
    }, "endpoint");

    return { start: actualStart, end: actualEnd };
}

function redrawConnections() {
    if (!svgLayer) return;

    while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);

    // Entity <-> attribute lines (draggable curve, locked endpoints)
    attributeEls.forEach(({ el, entityName, attribute }) => {
        const entityEl = entityEls[entityName];
        if (!entityEl) return;

        const entityC = centerOf(entityEl);
        const attrC = centerOf(el);

        const dx = attrC.x - entityC.x;
        const dy = attrC.y - entityC.y;

        const start = rectEdgePoint(entityC.x, entityC.y, entityC.halfW, entityC.halfH, dx, dy);
        const end = ellipseEdgePoint(attrC.x, attrC.y, attrC.halfW, attrC.halfH, -dx, -dy);

        drawDraggableConnector(start, end, attribute, {
            sx: "startOffsetX", sy: "startOffsetY",
            bx: "lineOffsetX", by: "lineOffsetY",
            ex: "endOffsetX", ey: "endOffsetY"
        });
    });

    // Entity <-> diamond <-> entity lines + cardinality labels
    relationshipEls.forEach(({ el: diamondEl, relationship }) => {
        const fromEl = entityEls[relationship.from];
        const toEl = entityEls[relationship.to];
        if (!fromEl || !toEl) return;

        const fromC = centerOf(fromEl);
        const toC = centerOf(toEl);
        const diamondC = centerOf(diamondEl);

        const dxFrom = diamondC.x - fromC.x;
        const dyFrom = diamondC.y - fromC.y;
        const startFrom = rectEdgePoint(fromC.x, fromC.y, fromC.halfW, fromC.halfH, dxFrom, dyFrom);
        const endFrom = diamondEdgePoint(diamondC.x, diamondC.y, diamondC.halfW, diamondC.halfH, -dxFrom, -dyFrom);

        const dxTo = diamondC.x - toC.x;
        const dyTo = diamondC.y - toC.y;
        const startTo = rectEdgePoint(toC.x, toC.y, toC.halfW, toC.halfH, dxTo, dyTo);
        const endTo = diamondEdgePoint(diamondC.x, diamondC.y, diamondC.halfW, diamondC.halfH, -dxTo, -dyTo);

        const segFrom = drawDraggableConnector(startFrom, endFrom, relationship, {
            sx: "fromSegStartOffsetX", sy: "fromSegStartOffsetY",
            bx: "fromOffsetX", by: "fromOffsetY",
            ex: "fromSegEndOffsetX", ey: "fromSegEndOffsetY"
        });
        const segTo = drawDraggableConnector(startTo, endTo, relationship, {
            sx: "toSegStartOffsetX", sy: "toSegStartOffsetY",
            bx: "toOffsetX", by: "toOffsetY",
            ex: "toSegEndOffsetX", ey: "toSegEndOffsetY"
        });

        const cardinalities = getCardinalities(relationship.type);

        const fromLabelPos = pointAlong(segFrom.start, segFrom.end, 0.3, 14);
        const toLabelPos = pointAlong(segTo.start, segTo.end, 0.3, 14);

        [[fromLabelPos, cardinalities.from], [toLabelPos, cardinalities.to]].forEach(([pos, text]) => {
            if (!text) return;
            const label = createSVGEl("text");
            label.setAttribute("x", pos.x);
            label.setAttribute("y", pos.y);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("fill", "#38d39f");
            label.setAttribute("font-size", "14");
            label.setAttribute("font-weight", "800");
            label.textContent = text;
            svgLayer.appendChild(label);
        });
    });
}

// Point at fraction `t` along segment a->b, offset perpendicular by `offset` px
// (keeps cardinality labels from sitting directly on top of the line).
function pointAlong(a, b, t, offset) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return {
        x: a.x + dx * t + nx * offset,
        y: a.y + dy * t + ny * offset
    };
}

/* =========================================================
   RESET LAYOUT
========================================================= */

function resetLayout() {
    if (!entities.length) return showValidation("error", "Add an entity first.");

    entities.forEach(e => {
        e.x = null;
        e.y = null;
        e.attributes.forEach(a => {
            a.x = null;
            a.y = null;
            a.startOffsetX = 0;
            a.startOffsetY = 0;
            a.lineOffsetX = 0;
            a.lineOffsetY = 0;
            a.endOffsetX = 0;
            a.endOffsetY = 0;
        });
    });

    relationships.forEach(r => {
        r.x = null;
        r.y = null;
        r.fromSegStartOffsetX = 0;
        r.fromSegStartOffsetY = 0;
        r.fromOffsetX = 0;
        r.fromOffsetY = 0;
        r.fromSegEndOffsetX = 0;
        r.fromSegEndOffsetY = 0;
        r.toSegStartOffsetX = 0;
        r.toSegStartOffsetY = 0;
        r.toOffsetX = 0;
        r.toOffsetY = 0;
        r.toSegEndOffsetX = 0;
        r.toSegEndOffsetY = 0;
    });

    renderDiagram();
    showValidation("success", "Layout reset to default positions.");
}

if (resetLayoutBtn) resetLayoutBtn.addEventListener("click", resetLayout);

/* =========================================================
   CARDINALITY
========================================================= */

function getCardinalities(type) {
    if (type === "1:1") return { from: "1", to: "1" };
    if (type === "1:N") return { from: "1", to: "N" };
    if (type === "N:1") return { from: "N", to: "1" };
    if (type === "M:N") return { from: "M", to: "N" };
    return { from: "", to: "" };
}

/* =========================================================
   GENERATE SQL
========================================================= */

generateBtn.addEventListener("click", () => {
    if (!entities.length) return showValidation("error", "Add an entity before generating SQL.");

    let sql = "";

    entities.forEach(entity => {
        sql += `CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;

        entity.attributes.forEach((attribute, index) => {
            let type = attribute.type;
            if (type === "VARCHAR") type = "VARCHAR(100)";

            let line = `    ${sanitizeSQLName(attribute.name)} ${type}`;
            if (attribute.primaryKey) line += " PRIMARY KEY";
            if (index < entity.attributes.length - 1) line += ",";

            sql += line + "\n";
        });

        sql += ");\n\n";
    });

    relationships.forEach(relationship => {
        const from = entities.find(e => e.name === relationship.from);
        const to = entities.find(e => e.name === relationship.to);
        if (!from || !to) return;

        const fromPK = from.attributes.find(a => a.primaryKey);
        const toPK = to.attributes.find(a => a.primaryKey);
        if (!fromPK || !toPK) return;

        const type = relationship.type;

        if (type === "M:N") {
            const tableName = sanitizeSQLName(relationship.name && relationship.name.trim() ? relationship.name : "relates");
            const fromColumn = `${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)}`;
            const toColumn = `${sanitizeSQLName(to.name)}_${sanitizeSQLName(toPK.name)}`;

            sql += `CREATE TABLE ${tableName} (\n`;
            sql += `    ${fromColumn} INTEGER,\n`;
            sql += `    ${toColumn} INTEGER,\n`;
            sql += `    PRIMARY KEY (${fromColumn}, ${toColumn}),\n`;
            sql += `    FOREIGN KEY (${fromColumn}) REFERENCES ${sanitizeSQLName(from.name)}(${sanitizeSQLName(fromPK.name)}),\n`;
            sql += `    FOREIGN KEY (${toColumn}) REFERENCES ${sanitizeSQLName(to.name)}(${sanitizeSQLName(toPK.name)})\n`;
            sql += `);\n\n`;
            return;
        }

        if (type === "1:N") {
            sql += `-- Relationship: ${relationship.name}\n`;
            sql += `ALTER TABLE ${sanitizeSQLName(to.name)}\n`;
            sql += `ADD COLUMN ${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)} INTEGER;\n\n`;
            return;
        }

        if (type === "N:1") {
            sql += `-- Relationship: ${relationship.name}\n`;
            sql += `ALTER TABLE ${sanitizeSQLName(from.name)}\n`;
            sql += `ADD COLUMN ${sanitizeSQLName(to.name)}_${sanitizeSQLName(toPK.name)} INTEGER;\n\n`;
            return;
        }

        if (type === "1:1") {
            sql += `-- Relationship: ${relationship.name}\n`;
            sql += `ALTER TABLE ${sanitizeSQLName(to.name)}\n`;
            sql += `ADD COLUMN ${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)} INTEGER UNIQUE;\n\n`;
        }
    });

    sqlOutput.textContent = sql.trim();
    sqlGenerated = true;
    updateProgress();

    showValidation("success", "SQL generated successfully from the ER model.");
});

/* =========================================================
   COPY SQL
========================================================= */

copyBtn.addEventListener("click", async () => {
    const sql = sqlOutput.textContent;

    if (!sql || sql === "-- Generated SQL will appear here.") {
        return showValidation("error", "Generate SQL first.");
    }

    try {
        await navigator.clipboard.writeText(sql);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy SQL"; }, 1500);
    } catch {
        showValidation("error", "Unable to copy SQL.");
    }
});

/* =========================================================
   THEME
========================================================= */

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeBtn.textContent = document.body.classList.contains("light") ? "☀" : "☾";
    if (entities.length) redrawConnections();
});

/* =========================================================
   INITIALIZATION
========================================================= */

updateRelationshipSelectors();
renderEntities();
renderRelationshipList();
updateProgress();
