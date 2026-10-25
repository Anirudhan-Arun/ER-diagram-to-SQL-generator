/* =========================================================
   DIAGRAM CAPTURE  (additive - does not modify anything else)

   Exposes:  window.captureERDiagramPNG()
   Returns:  Promise<{ dataUrl, width, height }>  or  null

   How it works
   - Reads the position/size of every entity, attribute and
     relationship straight from the live DOM (read-only).
   - Divides by the current CSS zoom, so it works at ANY zoom
     level and never changes zoom, scroll or layout.
   - Finds the bounding box of the real content and crops to
     it (+ padding), so the 4x blank canvas is ignored.
   - Redraws everything onto an off-screen <canvas> with
     print-friendly colours, and overlays the connector lines
     (cloned from your existing SVG layer, handles removed).
   ========================================================= */

(function () {

    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";

    const COLORS = {
        entityFill: "#eef2ff",
        entityStroke: "#3b4cca",
        attrFill: "#ffffff",
        attrStroke: "#2f3b52",
        relFill: "#ecfdf5",
        relStroke: "#0f9d74",
        text: "#111827",
        subText: "#6b7280",
        line: "#475569",
        label: "#047857"
    };

    const PADDING = 30;      // blank margin kept around the diagram
    const MAX_SIDE = 4000;   // max output size in pixels
    const MAX_SCALE = 2;     // output sharpness


    function loadImage(src) {

        return new Promise((resolve, reject) => {

            const img = new Image();

            img.onload = () => resolve(img);

            img.onerror = () =>
                reject(new Error("SVG overlay could not be loaded."));

            img.src = src;

        });

    }


    function resolveCssVars(text) {

        const cs = getComputedStyle(document.body);

        return text.replace(/var\((--[\w-]+)\)/g, (m, name) => {

            return cs.getPropertyValue(name).trim() || COLORS.text;

        });

    }


    async function captureERDiagramPNG() {

        const area = document.getElementById("diagramArea");

        if (!area) return null;

        const canvasEl = area.querySelector(".er-canvas");

        if (!canvasEl) return null;

        /* ---------- zoom factor (read-only) ---------- */

        const baseWidth = parseFloat(canvasEl.style.minWidth);

        const canvasRect = canvasEl.getBoundingClientRect();

        // 0 width => dashboard tab is hidden / not rendered
        if (!baseWidth || !canvasRect.width) return null;

        const k = canvasRect.width / baseWidth;

        function toLocal(rect) {

            return {
                x: (rect.left - canvasRect.left) / k,
                y: (rect.top - canvasRect.top) / k,
                w: rect.width / k,
                h: rect.height / k
            };

        }

        function textOf(parent, selector) {

            const node = parent.querySelector(selector);

            return node ? node.textContent.trim() : "";

        }


        /* ---------- collect shapes ---------- */

        const entities = [];
        const attributes = [];
        const relationships = [];

        canvasEl.querySelectorAll(".er-entity").forEach(el => {

            entities.push({
                box: toLocal(el.getBoundingClientRect()),
                name: el.textContent.trim()
            });

        });

        canvasEl.querySelectorAll(".er-attribute").forEach(el => {

            attributes.push({
                box: toLocal(el.getBoundingClientRect()),
                name: textOf(el, ".attribute-name"),
                type: textOf(el, ".attribute-type"),
                primaryKey: el.classList.contains("primary-key"),
                relAttr: el.classList.contains("relationship-attribute")
            });

        });

        canvasEl.querySelectorAll(".er-relationship-wrapper").forEach(wrapper => {

            const diamond = wrapper.querySelector(".relationship-diamond");

            if (!diamond) return;

            // bounding rect of the rotated square = the diamond's extent
            relationships.push({
                box: toLocal(diamond.getBoundingClientRect()),
                name: textOf(wrapper, ".relationship-name")
            });

        });

        if (!entities.length) return null;


        /* ---------- bounding box of real content ---------- */

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        function extend(x, y, w, h) {

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);

        }

        entities.concat(attributes, relationships).forEach(item => {

            extend(item.box.x, item.box.y, item.box.w, item.box.h);

        });

        const svg = canvasEl.querySelector("svg.relationship-svg");

        if (svg) {

            try {

                const bb = svg.getBBox();

                if (bb.width > 0 || bb.height > 0) {
                    extend(bb.x, bb.y, bb.width, bb.height);
                }

            } catch (e) { /* ignore */ }

        }

        minX -= PADDING;
        minY -= PADDING;
        maxX += PADDING;
        maxY += PADDING;

        const W = maxX - minX;
        const H = maxY - minY;

        const scale = Math.min(MAX_SCALE, MAX_SIDE / Math.max(W, H));


        /* ---------- off-screen canvas ---------- */

        const out = document.createElement("canvas");

        out.width = Math.ceil(W * scale);
        out.height = Math.ceil(H * scale);

        const ctx = out.getContext("2d");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);

        ctx.setTransform(scale, 0, 0, scale, -minX * scale, -minY * scale);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";


        /* ---------- entities (rectangles) ---------- */

        entities.forEach(e => {

            ctx.fillStyle = COLORS.entityFill;
            ctx.strokeStyle = COLORS.entityStroke;
            ctx.lineWidth = 2;

            ctx.fillRect(e.box.x, e.box.y, e.box.w, e.box.h);
            ctx.strokeRect(e.box.x, e.box.y, e.box.w, e.box.h);

            ctx.fillStyle = COLORS.text;
            ctx.font = "700 15px Arial, sans-serif";

            ctx.fillText(
                e.name,
                e.box.x + e.box.w / 2,
                e.box.y + e.box.h / 2,
                e.box.w - 10
            );

        });


        /* ---------- attributes (ellipses) ---------- */

        attributes.forEach(a => {

            const cx = a.box.x + a.box.w / 2;
            const cy = a.box.y + a.box.h / 2;

            ctx.beginPath();

            ctx.ellipse(cx, cy, a.box.w / 2, a.box.h / 2, 0, 0, Math.PI * 2);

            ctx.fillStyle = COLORS.attrFill;
            ctx.strokeStyle = a.relAttr ? COLORS.relStroke : COLORS.attrStroke;
            ctx.lineWidth = 1.5;

            ctx.fill();
            ctx.stroke();

            const nameY = cy - 5;
            const maxTextW = a.box.w * 0.82;

            ctx.fillStyle = COLORS.text;
            ctx.font = "600 12px Arial, sans-serif";

            ctx.fillText(a.name, cx, nameY, maxTextW);

            if (a.primaryKey) {

                // underline the key attribute
                const tw = Math.min(ctx.measureText(a.name).width, maxTextW);

                ctx.beginPath();
                ctx.moveTo(cx - tw / 2, nameY + 8);
                ctx.lineTo(cx + tw / 2, nameY + 8);
                ctx.lineWidth = 1.2;
                ctx.strokeStyle = COLORS.text;
                ctx.stroke();

            }

            ctx.fillStyle = COLORS.subText;
            ctx.font = "400 9px Arial, sans-serif";

            ctx.fillText(a.type, cx, cy + 9, maxTextW);

        });


        /* ---------- relationships (diamonds) ---------- */

        relationships.forEach(r => {

            const cx = r.box.x + r.box.w / 2;
            const cy = r.box.y + r.box.h / 2;

            ctx.beginPath();
            ctx.moveTo(cx, r.box.y);
            ctx.lineTo(r.box.x + r.box.w, cy);
            ctx.lineTo(cx, r.box.y + r.box.h);
            ctx.lineTo(r.box.x, cy);
            ctx.closePath();

            ctx.fillStyle = COLORS.relFill;
            ctx.strokeStyle = COLORS.relStroke;
            ctx.lineWidth = 2;

            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = COLORS.text;
            ctx.font = "700 11px Arial, sans-serif";

            ctx.fillText(r.name || "RELATES", cx, cy, r.box.w * 0.8);

        });


        /* ---------- connector lines + cardinality labels ----------
           Cloned from the existing SVG layer; the clone is cropped
           with a viewBox. The live SVG is never modified.          */

        if (svg) {

            const clone = svg.cloneNode(true);

            // remove drag handles (circles)
            clone.querySelectorAll("circle").forEach(n => n.remove());

            // the original positions itself with inline style - drop it
            clone.removeAttribute("style");
            clone.removeAttribute("class");

            clone.setAttribute("xmlns", SVG_NS);
            clone.setAttribute("viewBox", minX + " " + minY + " " + W + " " + H);
            clone.setAttribute("width", W);
            clone.setAttribute("height", H);

            clone.querySelectorAll("text").forEach(t => {

                t.style.fill = COLORS.label;

                if (!t.style.fontFamily) {
                    t.style.fontFamily = "Arial, sans-serif";
                }

            });

            let xml = new XMLSerializer().serializeToString(clone);

            xml = resolveCssVars(xml).replace(/#8c99af/gi, COLORS.line);

            const img = await loadImage(
                "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml)
            );

            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.drawImage(img, 0, 0, out.width, out.height);

        }

        return {
            dataUrl: out.toDataURL("image/png"),
            width: out.width,
            height: out.height
        };

    }

    window.captureERDiagramPNG = captureERDiagramPNG;

})();
