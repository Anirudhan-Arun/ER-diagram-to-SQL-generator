let entities = [];


/* =========================================
   ELEMENTS
========================================= */

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


/* =========================================
   ADD ENTITY
========================================= */

addEntityBtn.addEventListener(
    "click",
    function () {

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


        /* Duplicate check */

        const duplicate =
            entities.some(
                entity =>
                    entity.name.toLowerCase() ===
                    entityName.toLowerCase()
            );


        if (duplicate) {

            showValidation(
                "error",
                "This entity already exists."
            );

            return;
        }


        /* Read attributes */

        const attributeNames =
            attributeText
                .split(",")
                .map(
                    attribute =>
                        attribute.trim()
                )
                .filter(
                    attribute =>
                        attribute !== ""
                );


        if (attributeNames.length === 0) {

            showValidation(
                "error",
                "Please enter valid attributes."
            );

            return;
        }


        /* Create attributes */

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


        /* Ensure a primary key */

        const hasPrimaryKey =
            attributes.some(
                attribute =>
                    attribute.primaryKey
            );


        if (!hasPrimaryKey) {

            showValidation(
                "error",
                "No primary key was detected. Add an attribute such as student_id or id."
            );

            return;
        }


        /* Save */

        entities.push({

            name: entityName,

            attributes: attributes

        });


        /* Clear fields */

        entityNameInput.value = "";

        attributesInput.value = "";


        /* Update UI */

        renderEntities();

        renderDiagram();


        showValidation(
            "success",
            `${entityName} added successfully.`
        );

    }
);


/* =========================================
   PRIMARY KEY DETECTION
========================================= */

function detectPrimaryKey(attributeName) {

    const name =
        attributeName
            .toLowerCase()
            .trim();


    return (
        name === "id" ||
        name.endsWith("_id")
    );
}


/* =========================================
   DATA TYPE DETECTION
========================================= */

function inferDataType(attributeName) {

    const name =
        attributeName
            .toLowerCase()
            .trim();


    /* ID */

    if (
        name === "id" ||
        name.endsWith("_id")
    ) {

        return "INTEGER";

    }


    /* Integer */

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


    /* Decimal */

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


    /* Date */

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


    /* Boolean */

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


/* =========================================
   ENTITY LIST
========================================= */

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


            const attributes =
                entity.attributes
                    .map(
                        attribute => {

                            return `${
                                attribute.name
                            } (${
                                attribute.type
                            })${
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
                    ${escapeHTML(attributes)}
                </span>

            `;


            entityList.appendChild(item);

        }
    );
}


/* =========================================
   DELETE ENTITY
========================================= */

function deleteEntity(index) {

    const removed =
        entities[index];


    entities.splice(index, 1);


    renderEntities();

    renderDiagram();


    showValidation(
        "success",
        `${removed.name} removed.`
    );
}


/* =========================================
   ER DIAGRAM
========================================= */

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

    canvas.className =
        "er-canvas";


    entities.forEach(
        entity => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "er-entity-wrapper";


            /* ENTITY RECTANGLE */

            const entityBox =
                document.createElement("div");

            entityBox.className =
                "er-entity";

            entityBox.textContent =
                entity.name;


            wrapper.appendChild(
                entityBox
            );


            /* ATTRIBUTES */

            entity.attributes.forEach(
                (attribute, index) => {

                    const attributeWrapper =
                        document.createElement("div");

                    attributeWrapper.className =
                        "er-attribute-wrapper";


                    const attributeOval =
                        document.createElement("div");

                    attributeOval.className =
                        "er-attribute";


                    if (
                        attribute.primaryKey
                    ) {

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

                    line.className =
                        "er-line";


                    attributeWrapper.appendChild(
                        attributeOval
                    );

                    attributeWrapper.appendChild(
                        line
                    );


                    const positions = [

                        "attribute-top",

                        "attribute-right",

                        "attribute-bottom",

                        "attribute-left"

                    ];


                    attributeWrapper.classList.add(

                        positions[
                            index %
                            positions.length
                        ]

                    );


                    wrapper.appendChild(
                        attributeWrapper
                    );

                }
            );


            canvas.appendChild(
                wrapper
            );

        }
    );


    diagramArea.appendChild(
        canvas
    );
}


/* =========================================
   GENERATE SQL
========================================= */

generateBtn.addEventListener(
    "click",
    function () {

        if (entities.length === 0) {

            showValidation(
                "error",
                "Add an entity before generating SQL."
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

                        let type =
                            attribute.type;


                        if (
                            type === "VARCHAR"
                        ) {

                            type =
                                "VARCHAR(100)";

                        }


                        let line =
                            `    ${sanitizeSQLName(attribute.name)} ${type}`;


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


/* =========================================
   COPY SQL
========================================= */

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


/* =========================================
   VALIDATION
========================================= */

function showValidation(
    type,
    message
) {

    if (type === "error") {

        validationBox.style.background =
            "rgba(255, 107, 122, 0.08)";

        validationBox.style.borderColor =
            "rgba(255, 107, 122, 0.3)";


        validationBox.innerHTML = `

            <strong
                style="color: var(--danger)"
            >
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
            "rgba(56, 211, 159, 0.3)";


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


/* =========================================
   THEME
========================================= */

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


/* =========================================
   HTML ESCAPING
========================================= */

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


/* =========================================
   SQL NAME CLEANING
========================================= */

function sanitizeSQLName(value) {

    return value
        .trim()
        .replace(
            /[^a-zA-Z0-9_]/g,
            "_"
        );
}
