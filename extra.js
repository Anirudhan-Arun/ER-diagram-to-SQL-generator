/* =========================================================
   NAVIGATION
   ========================================================= */

(function () {

    const navButtons = document.querySelectorAll(".nav-btn");
    const views = document.querySelectorAll(".view");

    navButtons.forEach(button => {

        button.addEventListener("click", () => {

            const target = button.getAttribute("data-view");

            navButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            views.forEach(view => {
                view.classList.remove("active-view");
            });

            const targetView = document.getElementById(target);

            if (targetView) {
                targetView.classList.add("active-view");
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    });

})();


/* =========================================================
   ER DIAGRAM ZOOM
   ========================================================= */

(function () {

    let zoom = 1;

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 2;
    const STEP = 0.1;

    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const zoomResetBtn = document.getElementById("zoomResetBtn");
    const zoomLevel = document.getElementById("zoomLevel");
    const diagramArea = document.getElementById("diagramArea");

    if (!diagramArea) {
        return;
    }

    function updateZoomLabel() {

        if (zoomLevel) {
            zoomLevel.textContent =
                Math.round(zoom * 100) + "%";
        }

    }

    function applyZoom() {

        const canvas =
            diagramArea.querySelector(".er-canvas");

        if (!canvas) {
            updateZoomLabel();
            return;
        }

        canvas.style.zoom = zoom;

        updateZoomLabel();

    }

    function setZoom(value) {

        zoom = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, value)
        );

        applyZoom();

    }

    if (zoomInBtn) {

        zoomInBtn.addEventListener("click", () => {
            setZoom(zoom + STEP);
        });

    }

    if (zoomOutBtn) {

        zoomOutBtn.addEventListener("click", () => {
            setZoom(zoom - STEP);
        });

    }

    if (zoomResetBtn) {

        zoomResetBtn.addEventListener("click", () => {
            setZoom(1);
        });

    }

    /*
     * The existing script recreates .er-canvas whenever
     * the diagram changes. This observer reapplies the
     * selected zoom automatically.
     */

    const observer = new MutationObserver(() => {
        applyZoom();
    });

    observer.observe(diagramArea, {
        childList: true,
        subtree: true
    });

    updateZoomLabel();

})();


/* =========================================================
   DOWNLOAD REPORT
   ========================================================= */

(function () {

    const downloadBtn =
        document.getElementById("downloadBtn");

    if (!downloadBtn) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.className =
        "download-overlay";

    overlay.innerHTML = `
        <div class="download-modal">

            <h3>Download Report</h3>

            <p>
                Download a report containing your ER model,
                processing information, intermediate results
                and generated SQL.
            </p>

            <div class="download-options">

                <button
                    id="downloadPdfBtn"
                    class="primary-btn">
                    Download as PDF
                </button>

                <button
                    id="downloadTxtBtn"
                    class="secondary-btn">
                    Download as Text (.txt)
                </button>

            </div>

            <button
                id="downloadCancelBtn"
                class="download-cancel">
                Cancel
            </button>

        </div>
    `;

    document.body.appendChild(overlay);


    downloadBtn.addEventListener("click", () => {

        overlay.classList.add("open");

    });


    overlay.addEventListener("click", event => {

        if (event.target === overlay) {
            overlay.classList.remove("open");
        }

    });


    document
        .getElementById("downloadCancelBtn")
        .addEventListener("click", () => {

            overlay.classList.remove("open");

        });


    function getData() {

        if (typeof window.getERGeneratorData === "function") {
            return window.getERGeneratorData();
        }

        return {
            entities: [],
            relationships: [],
            sqlGenerated: false
        };

    }


    function buildReportText() {

        const data = getData();

        const entities =
            data.entities || [];

        const relationships =
            data.relationships || [];

        const sqlElement =
            document.getElementById("sqlOutput");

        const sql =
            sqlElement
                ? sqlElement.textContent.trim()
                : "";

        const lines = [];


        lines.push(
            "ER → SQL GENERATOR"
        );

        lines.push(
            "EXECUTION REPORT"
        );

        lines.push(
            "Generated: " +
            new Date().toLocaleString()
        );

        lines.push(
            "=".repeat(70)
        );

        lines.push("");


        /* =================================================
           USER INPUT
           ================================================= */

        lines.push(
            "1. USER INPUT"
        );

        lines.push(
            "-".repeat(70)
        );

        lines.push(
            "Entities entered: " +
            entities.length
        );

        lines.push(
            "Relationships entered: " +
            relationships.length
        );

        lines.push("");


        if (entities.length === 0) {

            lines.push(
                "No entities were entered."
            );

        } else {

            entities.forEach((entity, index) => {

                lines.push(
                    "Entity " +
                    (index + 1) +
                    ": " +
                    entity.name
                );

                if (
                    entity.attributes &&
                    entity.attributes.length
                ) {

                    entity.attributes.forEach(attribute => {

                        let attributeLine =
                            "  - " +
                            attribute.name +
                            " (" +
                            attribute.type +
                            ")";

                        if (attribute.primaryKey) {
                            attributeLine +=
                                " [PRIMARY KEY]";
                        }

                        lines.push(attributeLine);

                    });

                }

                lines.push("");

            });

        }


        /* =================================================
           RELATIONSHIPS
           ================================================= */

        lines.push(
            "2. RELATIONSHIPS"
        );

        lines.push(
            "-".repeat(70)
        );


        if (relationships.length === 0) {

            lines.push(
                "No relationships were entered."
            );

        } else {

            relationships.forEach((relationship, index) => {

                lines.push(
                    "Relationship " +
                    (index + 1) +
                    ": " +
                    relationship.from +
                    " -- " +
                    relationship.name +
                    " -- " +
                    relationship.to
                );

                lines.push(
                    "Cardinality: " +
                    relationship.type
                );

                if (
                    relationship.attributes &&
                    relationship.attributes.length
                ) {

                    lines.push(
                        "Relationship attributes: " +
                        relationship.attributes
                            .map(attribute => attribute.name)
                            .join(", ")
                    );

                }

                lines.push("");

            });

        }


        /* =================================================
           PROCESSING
           ================================================= */

        lines.push(
            "3. PROCESSING STEPS"
        );

        lines.push(
            "-".repeat(70)
        );

        lines.push(
            "Step 1: User-defined entities and attributes were validated."
        );

        lines.push(
            "Step 2: Attributes were assigned inferred SQL data types."
        );

        lines.push(
            "Step 3: Primary-key attributes were identified."
        );

        lines.push(
            "Step 4: Relationships and their cardinalities were processed."
        );

        lines.push(
            "Step 5: The ER model was converted into relational tables."
        );

        lines.push(
            "Step 6: Foreign keys or relationship tables were generated according to the relationship type."
        );

        lines.push(
            "Step 7: SQL CREATE TABLE statements were generated."
        );

        lines.push("");


        /* =================================================
           INTERMEDIATE RESULT
           ================================================= */

        lines.push(
            "4. INTERMEDIATE RESULT"
        );

        lines.push(
            "-".repeat(70)
        );

        lines.push(
            "Relational model summary:"
        );

        lines.push("");

        entities.forEach(entity => {

            lines.push(
                entity.name +
                " (" +
                (entity.attributes || [])
                    .map(attribute =>
                        attribute.name
                    )
                    .join(", ") +
                ")"
            );

        });

        lines.push("");


        /* =================================================
           FINAL OUTPUT
           ================================================= */

        lines.push(
            "5. FINAL OUTPUT"
        );

        lines.push(
            "-".repeat(70)
        );

        if (sql) {

            lines.push(sql);

        } else {

            lines.push(
                "-- SQL has not been generated yet."
            );

        }

        lines.push("");

        lines.push(
            "=".repeat(70)
        );

        lines.push(
            "End of Report"
        );


        return lines.join("\n");

    }


    /* =================================================
       TEXT DOWNLOAD
       ================================================= */

    document
        .getElementById("downloadTxtBtn")
        .addEventListener("click", () => {

            const text =
                buildReportText();

            const blob =
                new Blob(
                    [text],
                    { type: "text/plain" }
                );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                "er-sql-execution-report.txt";

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            overlay.classList.remove("open");

        });


    /* =================================================
       PDF DOWNLOAD
       ================================================= */

    document
        .getElementById("downloadPdfBtn")
        .addEventListener("click", () => {

            if (!window.jspdf) {

                alert(
                    "PDF library could not be loaded. Please check your internet connection."
                );

                return;

            }

            const {
                jsPDF
            } = window.jspdf;


            const doc =
                new jsPDF({
                    unit: "pt",
                    format: "a4"
                });


            const text =
                buildReportText();


            const marginLeft = 40;

            let y = 50;

            const lineHeight = 13;

            const pageHeight =
                doc.internal.pageSize.height;


            doc.setFont(
                "courier",
                "normal"
            );

            doc.setFontSize(9);


            const wrapped =
                doc.splitTextToSize(
                    text,
                    515
                );


            wrapped.forEach(line => {

                if (
                    y >
                    pageHeight - 40
                ) {

                    doc.addPage();

                    y = 50;

                }

                doc.text(
                    line,
                    marginLeft,
                    y
                );

                y += lineHeight;

            });


            doc.save(
                "er-sql-execution-report.pdf"
            );


            overlay.classList.remove("open");

        });

})();
