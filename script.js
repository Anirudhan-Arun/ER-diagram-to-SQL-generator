let entities = [];


/* =========================
   ELEMENTS
========================= */

const entityNameInput =
    document.getElementById("entityName");

const attributesInput =
    document.getElementById("attributes");

const addEntityBtn =
    document.getElementById("addEntityBtn");

const generateBtn =
    document.getElementById("generateBtn");

const entityList =
    document.getElementById("entityList");

const diagramArea =
    document.getElementById("diagramArea");

const sqlOutput =
    document.getElementById("sqlOutput");

const validationBox =
    document.getElementById("validationBox");

const copyBtn =
    document.getElementById("copyBtn");

const themeBtn =
    document.getElementById("themeBtn");


/* =========================
   ADD ENTITY
========================= */

addEntityBtn.addEventListener("click", function () {

    const entityName =
        entityNameInput.value.trim();

    const attributeText =
        attributesInput.value.trim();


    if (entityName === "") {

        showValidation(
            "error",
            "Please enter an entity name."
        );

        return;
    }


    if (attributeText === "") {

        showValidation(
            "error",
            "Please enter at least one attribute."
        );

        return;
    }


    /* Duplicate entity validation */

    const duplicate =
        entities.some(
            entity =>
                entity.name.toLowerCase() ===
                entityName.toLowerCase()
        );


    if (duplicate) {

        showValidation(
            "error",
            "An entity with this name already exists."
        );

        return;
    }


    /* Convert text into attributes */

    const attributeNames =
        attributeText
            .split(",")
            .map(attribute => attribute.trim())
            .filter(attribute => attribute !== "");


    if (attributeNames.length === 0) {

        showValidation(
            "error",
            "Please enter valid attributes."
        );

        return;
    }


    /* Create attribute objects */

    const attributes =
        attributeNames.map(
            attributeName => {

                return {

                    name: attributeName,

                    type:
                        inferDataType(
                            attributeName
                        ),

                    primaryKey:
                        detectPrimaryKey(
                            attributeName
                        )

                };

            }
        );


    /* Add entity */

    entities.push({

        name: entityName,

        attributes: attributes

    });


    /* Clear input */

    entityNameInput.value = "";
    attributesInput.value = "";


    /* Update interface */

    renderEntities();

    renderDiagram();


    showValidation(
        "success",
        `${entityName} added successfully. Data types and primary key were inferred automatically.`
    );

});


/* =========================
   PRIMARY KEY DETECTION
========================= */

function detectPrimaryKey(attributeName) {

    const name =
        attributeName
            .toLowerCase()
            .trim();


    /*
       Examples detected:

       student_id
       course_id
       employee_id
       id
    */

    return (
        name === "id" ||
        name.endsWith("_id") ||
        name.endsWith("id")
    );
}


/* =========================
   DATA TYPE INFERENCE
========================= */

function inferDataType(attributeName) {

    const name =
        attributeName
            .toLowerCase()
            .trim();


    /* IDs */

    if (
        name === "id" ||
        name.endsWith("_id") ||
        name.endsWith("id")
    ) {

        return "INTEGER";

    }


    /* Integer-like attributes */

    const integerWords = [

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

    ];


    if (
        integerWords.some(
            word =>
                name === word ||
                name.includes(word)
        )
    ) {

        return "INTEGER";

    }


    /* Decimal-like attributes */

    const decimalWords = [

        "price",
        "salary",
        "amount",
        "cost",
        "rate",
        "percentage"

    ];


    if (
        decimalWords.some(
            word =>
                name.includes(word)
        )
    ) {

        return "DECIMAL";

    }


    /* Date-like attributes */

    const dateWords = [

        "date",
        "dob",
        "birth",
        "created",
        "updated"

    ];


    if (
        dateWords.some(
            word =>
                name.includes(word)
        )
    ) {

        return "DATE";

    }


    /* Boolean-like attributes */

    const booleanWords = [

        "is_",
        "has_",
        "active",
        "enabled"

    ];


    if (
        booleanWords.some(
            word =>
                name.includes(word)
        )
    ) {

        return "BOOLEAN";

    }


    /* Default */

    return "VARCHAR";
}


/* =========================
   DISPLAY ENTITIES
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


    entities.forEach(
        (entity, index) => {

            const item =
                document.createElement("div");

            item.className =
                "entity-item";


            const attributeText =
                entity.attributes
                    .map(
                        attribute => {

                            return `${attribute.name} (${attribute.type})${
                                attribute.primaryKey
                                    ? " 🔑"
                                    : ""
                            }`;

                        }
                    )
                    .join(", ");


            item.innerHTML = `

                <button
                    class="delete-btn"
                    onclick="deleteEntity(${index})"
                >
                    ×
                </button>

                <strong>
                    ${escapeHTML(entity.name)}
                </strong>

                <span>
                    ${escapeHTML(attributeText)}
                </span>

            `;


            entityList.appendChild(item);

        }
    );
}


/* =========================
   DELETE ENTITY
========================= */

function deleteEntity(index) {

    const removedEntity =
        entities[index];


    entities.splice(index, 1);


    renderEntities();

    renderDiagram();


    showValidation(
        "success",
        `${removedEntity.name} was removed.`
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

                <h3>
                    Your ER diagram will appear here
                </h3>

                <p>
                    Add entities from the input panel
                    to begin building your database model.
                </p>

            </div>

        `;

        return;
    }


    const container =
        document.createElement("div");

    container.className =
        "diagram-container";


    entities.forEach(
        entity => {

            const entityBox =
                document.createElement("div");

            entityBox.className =
                "diagram-entity";


            let attributesHTML = "";


            entity.attributes.forEach(
                attribute => {

                    attributesHTML += `

                        <div class="diagram-attribute ${
                            attribute.primaryKey
                                ? "pk"
                                : ""
                        }">

                            ${
                                attribute.primaryKey
                                    ? "🔑 "
                                    : ""
                            }

                            ${escapeHTML(attribute.name)}

                            <span style="opacity:0.6">
                                ${escapeHTML(attribute.type)}
                            </span>

                        </div>

                    `;

                }
            );


            entityBox.innerHTML = `

                <div class="diagram-entity-title">
                    ${escapeHTML(entity.name)}
                </div>

                ${attributesHTML}

            `;


            container.appendChild(entityBox);

        }
    );


    diagramArea.innerHTML = "";

    diagramArea.appendChild(container);
}


/* =========================
   GENERATE SQL
========================= */

generateBtn.addEventListener(
    "click",
    function () {

        if (entities.length === 0) {

            showValidation(
                "error",
                "Add at least one entity before generating SQL."
            );

            return;
        }


        let sql = "";


        entities.forEach(
            entity => {

                sql +=
                    `CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;


                entity.attributes.forEach(
                    (attribute, index) => {

                        let sqlType =
                            attribute.type;


                        if (
                            sqlType === "VARCHAR"
                        ) {

                            sqlType =
                                "VARCHAR(100)";

                        }


                        let line =
                            `    ${sanitizeSQLName(attribute.name)} ${sqlType}`;


                        if (
                            attribute.primaryKey
                        ) {

                            line +=
                                " PRIMARY KEY";

                        }


                        if (
                            index <
                            entity.attributes.length - 1
                        ) {

                            line += ",";

                        }


                        sql +=
                            line + "\n";

                    }
                );


                sql +=
                    ");\n\n";

            }
        );


        sqlOutput.textContent =
            sql.trim();


        showValidation(
            "success",
            "SQL generated successfully from the ER model."
        );

    }
);


/* =========================
   COPY SQL
========================= */

copyBtn.addEventListener(
    "click",
    async function () {

        const sql =
            sqlOutput.textContent;


        if (
            !sql ||
            sql ===
            "-- Generated SQL will appear here."
        ) {

            showValidation(
                "error",
                "Generate SQL before copying it."
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


        } catch (error) {

            showValidation(
                "error",
                "Unable to copy SQL automatically."
            );

        }

    }
);


/* =========================
   VALIDATION
========================= */

function showValidation(
    type,
    message
) {

    if (type === "error") {

        validationBox.style.background =
            "rgba(255, 107, 122, 0.08)";

        validationBox.style.borderColor =
            "rgba(255, 107, 122, 0.25)";


        validationBox.innerHTML = `

            <strong style="color: var(--danger)">
                Validation Error
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

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

            <p>
                ${escapeHTML(message)}
            </p>

        `;

    }

}


/* =========================
   THEME
========================= */

themeBtn.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "light"
        );


        if (
            document.body.classList.contains(
                "light"
            )
        ) {

            themeBtn.textContent =
                "☀";

        } else {

            themeBtn.textContent =
                "☾";

        }

    }
);


/* =========================
   SECURITY
========================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================
   SQL NAME CLEANING
========================= */

function sanitizeSQLName(value) {

    return value
        .trim()
        .replace(
            /[^a-zA-Z0-9_]/g,
            "_"
        );
}
