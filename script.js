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

    const stepNumber = sqlGenerated
        ? 3
        : (hasRelationships ? 2 : 1);

    if (stepBadge) {
        stepBadge.textContent = `Step ${stepNumber}`;
    }

    if (flowEntities) {
        flowEntities.classList.toggle("active", hasEntities);
    }

    if (flowRelations) {
        flowRelations.classList.toggle("active", hasRelationships);
    }

    if (flowSql) {
        flowSql.classList.toggle("active", sqlGenerated);
    }
}


/* =========================================================
   HELPERS
========================================================= */

function detectPrimaryKey(name) {
    name = name.toLowerCase().trim();

    return name === "id" || name.endsWith("_id");
}


function inferDataType(name) {
    name = name.toLowerCase().trim();

    if (name === "id" || name.endsWith("_id")) {
        return "INTEGER";
    }

    if (
        [
            "age",
            "count",
            "quantity",
            "credits",
            "credit",
            "marks",
            "score",
            "year",
            "number",
            "total"
        ].some(x => name.includes(x))
    ) {
        return "INTEGER";
    }

    if (
        [
            "price",
            "salary",
            "amount",
            "cost",
            "rate",
            "percentage"
        ].some(x => name.includes(x))
    ) {
        return "DECIMAL";
    }

    if (
        [
            "date",
            "dob",
            "birth",
            "created",
            "updated"
        ].some(x => name.includes(x))
    ) {
        return "DATE";
    }

    if (
        [
            "is_",
            "has_",
            "active",
            "enabled"
        ].some(x => name.includes(x))
    ) {
        return "BOOLEAN";
    }

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
    return value
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_");
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
        <strong style="color:${type === "error"
            ? "var(--danger)"
            : "var(--text)"}">
            ${type === "error"
                ? "Validation Error"
                : "Validation"}
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

    if (!name) {
        showValidation(
            "error",
            "Please enter an entity name."
        );
        return;
    }

    if (!text) {
        showValidation(
            "error",
            "Please enter at least one attribute."
        );
        return;
    }

    if (
        entities.some(
            e => e.name.toLowerCase() === name.toLowerCase()
        )
    ) {
        showValidation(
            "error",
            "This entity already exists."
        );
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

    showValidation(
        "success",
        `${name} added successfully.`
    );
});


/* =========================================================
   ENTITY LIST
========================================================= */

function renderEntities() {

    if (!entities.length) {
        entityList.innerHTML =
            `<div class="empty-state">
                No entities added yet.
            </div>`;

        return;
    }

    entityList.innerHTML = "";

    entities.forEach((entity, index) => {

        const item = document.createElement("div");

        item.className = "entity-item";

        const attrs = entity.attributes
            .map(a =>
                `${a.name} (${a.type})${a.primaryKey ? " 🔑" : ""}`
            )
            .join(", ");

        item.innerHTML = `
            <button
                class="delete-btn"
                onclick="deleteEntity(${index})">
                ×
            </button>

            <strong>
                ${escapeHTML(entity.name)}
            </strong>

            <span>
                ${escapeHTML(attrs)}
            </span>
        `;

        entityList.appendChild(item);
    });
}


function deleteEntity(index) {

    const removed = entities[index];

    relationships = relationships.filter(
        r =>
            r.from !== removed.name &&
            r.to !== removed.name
    );

    entities.splice(index, 1);

    renderEntities();
    updateRelationshipSelectors();
    renderRelationshipList();
    renderDiagram();

    sqlGenerated = false;
    updateProgress();

    showValidation(
        "success",
        `${removed.name} removed.`
    );
}


/* =========================================================
   RELATIONSHIP SELECTORS
========================================================= */

function updateRelationshipSelectors() {

    if (!relFrom || !relTo) {
        return;
    }

    const oldFrom = relFrom.value;
    const oldTo = relTo.value;

    relFrom.innerHTML =
        '<option value="">Select entity</option>';

    relTo.innerHTML =
        '<option value="">Select entity</option>';

    entities.forEach(entity => {

        const option1 =
            document.createElement("option");

        option1.value = entity.name;
        option1.textContent = entity.name;

        const option2 =
            document.createElement("option");

        option2.value = entity.name;
        option2.textContent = entity.name;

        relFrom.appendChild(option1);
        relTo.appendChild(option2);
    });

    if (
        entities.some(e => e.name === oldFrom)
    ) {
        relFrom.value = oldFrom;
    }

    if (
        entities.some(e => e.name === oldTo)
    ) {
        relTo.value = oldTo;
    }
}


/* =========================================================
   ADD RELATIONSHIP
========================================================= */

if (addRelBtn) {

    addRelBtn.addEventListener("click", () => {

        const from = relFrom.value;
        const to = relTo.value;
        const type = relType.value;

        /*
         * IMPORTANT:
         * Your HTML already has relName.
         * We now actually read it.
         */

        const name = relName
            ? relName.value.trim()
            : "";

        if (!from || !to) {
            showValidation(
                "error",
                "Select both entities first."
            );
            return;
        }

        if (!name) {
            showValidation(
                "error",
                "Enter a relationship name such as teaches."
            );
            return;
        }

        if (from === to) {
            showValidation(
                "error",
                "Choose two different entities."
            );
            return;
        }

        if (
            relationships.some(
                r =>
                    r.from === from &&
                    r.to === to
            )
        ) {
            showValidation(
                "error",
                "This relationship already exists."
            );
            return;
        }

        relationships.push({

            from,
            to,

            /*
             * Relationship name is now stored.
             */
            name,

            type,

            /*
             * Used when dragging the diamond.
             */
            offsetX: 0,
            offsetY: 0
        });

        if (relName) {
            relName.value = "";
        }

        renderRelationshipList();
        renderDiagram();

        sqlGenerated = false;
        updateProgress();

        showValidation(
            "success",
            `${name} relationship added between ${from} and ${to}.`
        );
    });
}


/* =========================================================
   RELATIONSHIP LIST
========================================================= */

function renderRelationshipList() {

    if (!relationshipList) {
        return;
    }

    if (!relationships.length) {

        relationshipList.innerHTML =
            `<div class="empty-state">
                No relationships added yet.
            </div>`;

        return;
    }

    relationshipList.innerHTML = "";

    relationships.forEach((r, i) => {

        const item =
            document.createElement("div");

        item.className =
            "relationship-item";

        item.innerHTML = `
            <span>
                ${escapeHTML(r.from)}
                →
                ${escapeHTML(r.name)}
                →
                ${escapeHTML(r.to)}
                (${escapeHTML(r.type)})
            </span>

            <button
                onclick="deleteRelationship(${i})">
                ×
            </button>
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
   GENERIC DRAGGING
========================================================= */

function makeDraggable(element, onMove) {

    let dragging = false;

    let startX = 0;
    let startY = 0;

    let originalX = 0;
    let originalY = 0;

    element.addEventListener("pointerdown", e => {

        if (e.target.closest("button")) {
            return;
        }

        dragging = true;

        element.setPointerCapture(e.pointerId);

        startX = e.clientX;
        startY = e.clientY;

        originalX =
            parseFloat(element.dataset.x || 0);

        originalY =
            parseFloat(element.dataset.y || 0);

        element.style.cursor = "grabbing";

        e.preventDefault();
    });

    element.addEventListener("pointermove", e => {

        if (!dragging) {
            return;
        }

        const dx =
            e.clientX - startX;

        const dy =
            e.clientY - startY;

        const x =
            originalX + dx;

        const y =
            originalY + dy;

        element.dataset.x = x;
        element.dataset.y = y;

        element.style.transform =
            `translate(${x}px, ${y}px)`;

        if (onMove) {
            onMove();
        }
    });

    element.addEventListener("pointerup", () => {

        dragging = false;
        element.style.cursor = "grab";
    });

    element.addEventListener("pointercancel", () => {

        dragging = false;
        element.style.cursor = "grab";
    });
}


/* =========================================================
   ER DIAGRAM
========================================================= */

function renderDiagram() {

    if (!entities.length) {

        diagramArea.innerHTML = `
            <div class="diagram-placeholder">

                <div class="placeholder-icon">
                    ◇
                </div>

                <h3>
                    Your ER diagram will appear here
                </h3>

                <p>
                    Add an entity to begin building
                    your database model.
                </p>

            </div>
        `;

        return;
    }

    diagramArea.innerHTML = "";

    const canvas =
        document.createElement("div");

    canvas.className = "er-canvas";

    /*
     * SVG is used only for relationships.
     */
    const svg =
        document.createElementNS(
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
    svg.style.overflow = "visible";

    canvas.appendChild(svg);

    const positions = {};


    /* =====================================================
       ENTITIES
    ===================================================== */

    entities.forEach((entity, index) => {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "er-entity-wrapper";

        const defaultX =
            index % 2 === 0
                ? 100
                : 600;

        const defaultY =
            Math.floor(index / 2) * 250 + 100;

        wrapper.dataset.x = defaultX;
        wrapper.dataset.y = defaultY;

        wrapper.style.position = "absolute";

        wrapper.style.transform =
            `translate(${defaultX}px, ${defaultY}px)`;

        wrapper.style.cursor = "grab";


        /* ENTITY RECTANGLE */

        const entityBox =
            document.createElement("div");

        entityBox.className = "er-entity";

        entityBox.textContent =
            entity.name;

        wrapper.appendChild(entityBox);


        /* =================================================
           ATTRIBUTES
        ================================================= */

        entity.attributes.forEach(
            (attribute, attributeIndex) => {

                const attributeWrapper =
                    document.createElement("div");

                attributeWrapper.className =
                    "er-attribute-wrapper";

                const attributeOval =
                    document.createElement("div");

                attributeOval.className =
                    "er-attribute";

                if (attribute.primaryKey) {
                    attributeOval.classList.add(
                        "primary-key"
                    );
                }

                attributeOval.innerHTML = `
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


                attributeWrapper.appendChild(
                    attributeOval
                );

                attributeWrapper.appendChild(line);


                const positionsList = [
                    "attribute-top",
                    "attribute-right",
                    "attribute-bottom",
                    "attribute-left"
                ];

                attributeWrapper.classList.add(
                    positionsList[
                        attributeIndex % 4
                    ]
                );


                /*
                 * Attribute dragging remains intact.
                 */
                attributeWrapper.dataset.x = 0;
                attributeWrapper.dataset.y = 0;

                makeDraggable(
                    attributeWrapper,
                    () => {

                        /*
                         * Keep the attribute attached
                         * visually to its entity.
                         */
                        line.style.display = "block";
                    }
                );


                wrapper.appendChild(
                    attributeWrapper
                );
            }
        );


        canvas.appendChild(wrapper);


        positions[entity.name] = {

            element: wrapper,

            x: defaultX,
            y: defaultY
        };


        /*
         * Entity dragging.
         *
         * This is preserved.
         */
        makeDraggable(
            wrapper,
            () => {
                drawAllRelationships();
            }
        );
    });


    /* =====================================================
       RELATIONSHIP DRAWING
    ===================================================== */

    function drawAllRelationships() {

        /*
         * Remove old SVG objects.
         */
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        relationships.forEach(
            (relationship, index) => {

                drawRelationship(
                    relationship,
                    index
                );
            }
        );
    }


    function createSVGElement(type) {

        return document.createElementNS(
            "http://www.w3.org/2000/svg",
            type
        );
    }


    function drawRelationship(
        relationship,
        index
    ) {

        const fromPosition =
            positions[relationship.from];

        const toPosition =
            positions[relationship.to];

        if (!fromPosition || !toPosition) {
            return;
        }


        const fromEl =
            fromPosition.element;

        const toEl =
            toPosition.element;


        /*
         * Entity center positions.
         *
         * Dataset coordinates are used because
         * the entities are absolutely positioned.
         */

        const fromX =
            fromEl.offsetLeft +
            fromEl.offsetWidth / 2 +
            parseFloat(fromEl.dataset.x || 0);

        const fromY =
            fromEl.offsetTop +
            fromEl.offsetHeight / 2 +
            parseFloat(fromEl.dataset.y || 0);


        const toX =
            toEl.offsetLeft +
            toEl.offsetWidth / 2 +
            parseFloat(toEl.dataset.x || 0);

        const toY =
            toEl.offsetTop +
            toEl.offsetHeight / 2 +
            parseFloat(toEl.dataset.y || 0);


        const dx = toX - fromX;
        const dy = toY - fromY;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            ) || 1;


        const ux = dx / distance;
        const uy = dy / distance;


        /*
         * Start/end of relationship lines.
         */
        const entityDistance = 100;

        const startX =
            fromX +
            ux * entityDistance;

        const startY =
            fromY +
            uy * entityDistance;

        const endX =
            toX -
            ux * entityDistance;

        const endY =
            toY -
            uy * entityDistance;


        /*
         * Base midpoint.
         */
        let middleX =
            (startX + endX) / 2;

        let middleY =
            (startY + endY) / 2;


        /*
         * IMPORTANT FIX:
         *
         * Actually use the offset created
         * when the relationship is dragged.
         */
        middleX +=
            relationship.offsetX || 0;

        middleY +=
            relationship.offsetY || 0;


        /*
         * Diamond dimensions.
         */
        const diamondHalf = 38;

        /*
         * Diamond is rotated 45 degrees,
         * so these four points make a proper diamond.
         */
        const p1 =
            `${middleX},${middleY - diamondHalf}`;

        const p2 =
            `${middleX + diamondHalf},${middleY}`;

        const p3 =
            `${middleX},${middleY + diamondHalf}`;

        const p4 =
            `${middleX - diamondHalf},${middleY}`;


        /* =================================================
           LINE 1
        ================================================= */

        const line1 =
            createSVGElement("line");

        line1.setAttribute(
            "x1",
            startX
        );

        line1.setAttribute(
            "y1",
            startY
        );

        line1.setAttribute(
            "x2",
            middleX - diamondHalf
        );

        line1.setAttribute(
            "y2",
            middleY
        );

        line1.setAttribute(
            "stroke",
            "#8c99af"
        );

        line1.setAttribute(
            "stroke-width",
            "2"
        );

        svg.appendChild(line1);


        /* =================================================
           LINE 2
        ================================================= */

        const line2 =
            createSVGElement("line");

        line2.setAttribute(
            "x1",
            middleX + diamondHalf
        );

        line2.setAttribute(
            "y1",
            middleY
        );

        line2.setAttribute(
            "x2",
            endX
        );

        line2.setAttribute(
            "y2",
            endY
        );

        line2.setAttribute(
            "stroke",
            "#8c99af"
        );

        line2.setAttribute(
            "stroke-width",
            "2"
        );

        svg.appendChild(line2);


        /* =================================================
           DIAMOND
        ================================================= */

        const diamond =
            createSVGElement("polygon");

        diamond.setAttribute(
            "points",
            `${p1} ${p2} ${p3} ${p4}`
        );

        diamond.setAttribute(
            "fill",
            document.body.classList.contains("light")
                ? "#ffffff"
                : "#11182b"
        );

        diamond.setAttribute(
            "stroke",
            "#38d39f"
        );

        diamond.setAttribute(
            "stroke-width",
            "2"
        );

        svg.appendChild(diamond);


        /* =================================================
           RELATIONSHIP NAME
        ================================================= */

        const relationshipText =
            createSVGElement("text");

        relationshipText.setAttribute(
            "x",
            middleX
        );

        relationshipText.setAttribute(
            "y",
            middleY + 4
        );

        relationshipText.setAttribute(
            "text-anchor",
            "middle"
        );

        relationshipText.setAttribute(
            "fill",
            document.body.classList.contains("light")
                ? "#172033"
                : "#f4f7fb"
        );

        relationshipText.setAttribute(
            "font-size",
            "11"
        );

        relationshipText.setAttribute(
            "font-weight",
            "700"
        );

        /*
         * Relationship name is INSIDE the diamond.
         */
        relationshipText.textContent =
            getRelationshipName(
                relationship
            );

        svg.appendChild(
            relationshipText
        );


        /* =================================================
           CARDINALITY
        ================================================= */

        const cardinalities =
            getCardinalities(
                relationship.type
            );


        /*
         * Direction vector of first line.
         */
        const line1dx =
            middleX -
            diamondHalf -
            startX;

        const line1dy =
            middleY -
            startY;

        const line1distance =
            Math.sqrt(
                line1dx * line1dx +
                line1dy * line1dy
            ) || 1;


        /*
         * Direction vector of second line.
         */
        const line2dx =
            endX -
            (middleX + diamondHalf);

        const line2dy =
            endY -
            middleY;

        const line2distance =
            Math.sqrt(
                line2dx * line2dx +
                line2dy * line2dy
            ) || 1;


        /*
         * Perpendicular vector.
         *
         * This puts cardinality beside/above
         * the relationship line instead of
         * inside the diamond.
         */
        const normal1X =
            -line1dy / line1distance;

        const normal1Y =
            line1dx / line1distance;

        const normal2X =
            -line2dy / line2distance;

        const normal2Y =
            line2dx / line2distance;


        /*
         * Put labels close to their respective
         * entities, but above the lines.
         */
        const labelDistance = 18;

        const firstLabelX =
            startX +
            line1dx * 0.35 +
            normal1X * labelDistance;

        const firstLabelY =
            startY +
            line1dy * 0.35 +
            normal1Y * labelDistance;


        const secondLabelX =
            middleX +
            diamondHalf +
            line2dx * 0.35 +
            normal2X * labelDistance;

        const secondLabelY =
            middleY +
            line2dy * 0.35 +
            normal2Y * labelDistance;


        /* FROM CARDINALITY */

        const fromCardinality =
            createSVGElement("text");

        fromCardinality.setAttribute(
            "x",
            firstLabelX
        );

        fromCardinality.setAttribute(
            "y",
            firstLabelY
        );

        fromCardinality.setAttribute(
            "text-anchor",
            "middle"
        );

        fromCardinality.setAttribute(
            "fill",
            "#38d39f"
        );

        fromCardinality.setAttribute(
            "font-size",
            "14"
        );

        fromCardinality.setAttribute(
            "font-weight",
            "800"
        );

        fromCardinality.textContent =
            cardinalities.from;

        svg.appendChild(
            fromCardinality
        );


        /* TO CARDINALITY */

        const toCardinality =
            createSVGElement("text");

        toCardinality.setAttribute(
            "x",
            secondLabelX
        );

        toCardinality.setAttribute(
            "y",
            secondLabelY
        );

        toCardinality.setAttribute(
            "text-anchor",
            "middle"
        );

        toCardinality.setAttribute(
            "fill",
            "#38d39f"
        );

        toCardinality.setAttribute(
            "font-size",
            "14"
        );

        toCardinality.setAttribute(
            "font-weight",
            "800"
        );

        toCardinality.textContent =
            cardinalities.to;

        svg.appendChild(
            toCardinality
        );


        /* =================================================
           RELATIONSHIP DRAG HIT AREA
        ================================================= */

        const hitArea =
            createSVGElement("circle");

        hitArea.setAttribute(
            "cx",
            middleX
        );

        hitArea.setAttribute(
            "cy",
            middleY
        );

        hitArea.setAttribute(
            "r",
            "42"
        );

        hitArea.setAttribute(
            "fill",
            "transparent"
        );

        /*
         * This is the ONLY SVG object that
         * receives pointer events.
         */
        hitArea.style.pointerEvents = "all";
        hitArea.style.cursor = "grab";

        svg.appendChild(hitArea);


        /*
         * Relationship remains draggable.
         */
        makeRelationshipDraggable(
            hitArea,
            relationship
        );
    }


    /* =====================================================
       RELATIONSHIP DRAGGING
    ===================================================== */

    function makeRelationshipDraggable(
        element,
        relationship
    ) {

        let dragging = false;

        let startX = 0;
        let startY = 0;


        element.addEventListener(
            "pointerdown",
            e => {

                dragging = true;

                startX = e.clientX;
                startY = e.clientY;

                element.setPointerCapture(
                    e.pointerId
                );

                element.style.cursor =
                    "grabbing";

                e.preventDefault();
                e.stopPropagation();
            }
        );


        element.addEventListener(
            "pointermove",
            e => {

                if (!dragging) {
                    return;
                }

                const dx =
                    e.clientX - startX;

                const dy =
                    e.clientY - startY;


                /*
                 * Store the movement.
                 */
                relationship.offsetX =
                    (relationship.offsetX || 0) +
                    dx;

                relationship.offsetY =
                    (relationship.offsetY || 0) +
                    dy;


                startX = e.clientX;
                startY = e.clientY;


                /*
                 * Redraw everything using
                 * the updated offset.
                 */
                drawAllRelationships();
            }
        );


        element.addEventListener(
            "pointerup",
            () => {

                dragging = false;

                element.style.cursor =
                    "grab";
            }
        );


        element.addEventListener(
            "pointercancel",
            () => {

                dragging = false;

                element.style.cursor =
                    "grab";
            }
        );
    }


    /*
     * Initial relationship drawing.
     */
    setTimeout(() => {
        drawAllRelationships();
    }, 50);


    diagramArea.appendChild(canvas);
}


/* =========================================================
   RELATIONSHIP NAME
========================================================= */

function getRelationshipName(
    relationship
) {

    if (
        relationship.name &&
        relationship.name.trim()
    ) {
        return relationship.name.trim();
    }

    return "RELATES";
}


/* =========================================================
   CARDINALITY
========================================================= */

function getCardinalities(type) {

    if (type === "1:1") {

        return {
            from: "1",
            to: "1"
        };
    }

    if (type === "1:N") {

        return {
            from: "1",
            to: "N"
        };
    }

    if (type === "N:1") {

        return {
            from: "N",
            to: "1"
        };
    }

    if (type === "M:N") {

        return {
            from: "M",
            to: "N"
        };
    }

    return {
        from: "",
        to: ""
    };
}


/* =========================================================
   GENERATE SQL
========================================================= */

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


        /* =================================================
           ENTITY TABLES
        ================================================= */

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
                        line += " PRIMARY KEY";
                    }


                    /*
                     * Add comma unless this is
                     * the last attribute and no
                     * additional constraints follow.
                     */

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


        /* =================================================
           RELATIONSHIPS
        ================================================= */

        relationships.forEach(
            relationship => {

                const from =
                    entities.find(
                        e =>
                            e.name ===
                            relationship.from
                    );

                const to =
                    entities.find(
                        e =>
                            e.name ===
                            relationship.to
                    );


                if (!from || !to) {
                    return;
                }


                const fromPK =
                    from.attributes.find(
                        a => a.primaryKey
                    );

                const toPK =
                    to.attributes.find(
                        a => a.primaryKey
                    );


                if (!fromPK || !toPK) {
                    return;
                }


                const type =
                    relationship.type;


                /* =========================================
                   MANY TO MANY
                   ========================================= */

                if (type === "M:N") {

                    const tableName =
                        sanitizeSQLName(
                            getRelationshipName(
                                relationship
                            )
                        );


                    const fromColumn =
                        `${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)}`;

                    const toColumn =
                        `${sanitizeSQLName(to.name)}_${sanitizeSQLName(toPK.name)}`;


                    sql +=
                        `CREATE TABLE ${tableName} (\n`;

                    sql +=
                        `    ${fromColumn} INTEGER,\n`;

                    sql +=
                        `    ${toColumn} INTEGER,\n`;

                    sql +=
                        `    PRIMARY KEY (${fromColumn}, ${toColumn}),\n`;

                    sql +=
                        `    FOREIGN KEY (${fromColumn}) REFERENCES ${sanitizeSQLName(from.name)}(${sanitizeSQLName(fromPK.name)}),\n`;

                    sql +=
                        `    FOREIGN KEY (${toColumn}) REFERENCES ${sanitizeSQLName(to.name)}(${sanitizeSQLName(toPK.name)})\n`;

                    sql +=
                        `);\n\n`;

                    return;
                }


                /* =========================================
                   ONE TO MANY
                   ========================================= */

                if (type === "1:N") {

                    sql +=
                        `-- Relationship: ${getRelationshipName(relationship)}\n`;

                    sql +=
                        `ALTER TABLE ${sanitizeSQLName(to.name)}\n`;

                    sql +=
                        `ADD COLUMN ${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)} INTEGER;\n\n`;

                    return;
                }


                /* =========================================
                   MANY TO ONE
                   ========================================= */

                if (type === "N:1") {

                    sql +=
                        `-- Relationship: ${getRelationshipName(relationship)}\n`;

                    sql +=
                        `ALTER TABLE ${sanitizeSQLName(from.name)}\n`;

                    sql +=
                        `ADD COLUMN ${sanitizeSQLName(to.name)}_${sanitizeSQLName(toPK.name)} INTEGER;\n\n`;

                    return;
                }


                /* =========================================
                   ONE TO ONE
                   ========================================= */

                if (type === "1:1") {

                    sql +=
                        `-- Relationship: ${getRelationshipName(relationship)}\n`;

                    sql +=
                        `ALTER TABLE ${sanitizeSQLName(to.name)}\n`;

                    sql +=
                        `ADD COLUMN ${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)} INTEGER UNIQUE;\n\n`;
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


/* =========================================================
   COPY SQL
========================================================= */

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

            await navigator.clipboard.writeText(
                sql
            );

            copyBtn.textContent =
                "Copied!";


            setTimeout(() => {

                copyBtn.textContent =
                    "Copy SQL";

            }, 1500);

        } catch {

            showValidation(
                "error",
                "Unable to copy SQL."
            );
        }
    }
);


/* =========================================================
   THEME
========================================================= */

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


        /*
         * Redraw SVG so the diamond/text
         * uses the correct light/dark colors.
         */
        if (entities.length) {
            renderDiagram();
        }
    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

updateRelationshipSelectors();
renderEntities();
renderRelationshipList();
updateProgress();
