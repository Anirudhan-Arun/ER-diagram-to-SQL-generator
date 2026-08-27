let entities=[];
let relationships=[];

const entityNameInput=document.getElementById("entityName");
const attributesInput=document.getElementById("attributes");
const addEntityBtn=document.getElementById("addEntityBtn");
const generateBtn=document.getElementById("generateBtn");
const entityList=document.getElementById("entityList");
const diagramArea=document.getElementById("diagramArea");
const sqlOutput=document.getElementById("sqlOutput");
const validationBox=document.getElementById("validationBox");
const copyBtn=document.getElementById("copyBtn");
const themeBtn=document.getElementById("themeBtn");

const relFrom=document.getElementById("relFrom");
const relTo=document.getElementById("relTo");
const relType=document.getElementById("cardinality");
const addRelBtn=document.getElementById("addRelBtn");
const relationshipList=document.getElementById("relationshipList");

const stepBadge=document.getElementById("stepBadge");
const flowEntities=document.getElementById("flowEntities");
const flowRelations=document.getElementById("flowRelations");
const flowSql=document.getElementById("flowSql");

let sqlGenerated=false;

function updateProgress(){
    const hasEntities=entities.length>0;
    const hasRelationships=relationships.length>0;
    const stepNumber=sqlGenerated?3:(hasRelationships?2:1);

    if(stepBadge)stepBadge.textContent=`Step ${stepNumber}`;
    if(flowEntities)flowEntities.classList.toggle("active",hasEntities);
    if(flowRelations)flowRelations.classList.toggle("active",hasRelationships);
    if(flowSql)flowSql.classList.toggle("active",sqlGenerated);
}

function detectPrimaryKey(name){
    name=name.toLowerCase().trim();
    return name==="id"||name.endsWith("_id");
}

function inferDataType(name){
    name=name.toLowerCase().trim();

    if(name==="id"||name.endsWith("_id"))return"INTEGER";

    if(["age","count","quantity","credits","credit","marks","score","year","number","total"].some(x=>name.includes(x)))return"INTEGER";

    if(["price","salary","amount","cost","rate","percentage"].some(x=>name.includes(x)))return"DECIMAL";

    if(["date","dob","birth","created","updated"].some(x=>name.includes(x)))return"DATE";

    if(["is_","has_","active","enabled"].some(x=>name.includes(x)))return"BOOLEAN";

    return"VARCHAR";
}

function escapeHTML(value){
    return String(value)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function sanitizeSQLName(value){
    return value.trim().replace(/[^a-zA-Z0-9_]/g,"_");
}

function showValidation(type,message){
    validationBox.style.background=type==="error"
        ?"rgba(255,107,122,.08)"
        :"rgba(56,211,159,.08)";

    validationBox.style.borderColor=type==="error"
        ?"rgba(255,107,122,.3)"
        :"rgba(56,211,159,.3)";

    validationBox.innerHTML=`
        <strong style="color:${type==="error"?"var(--danger)":"var(--text)"}">
            ${type==="error"?"Validation Error":"Validation"}
        </strong>
        <p>${escapeHTML(message)}</p>
    `;
}

/* =========================
   ADD ENTITY
========================= */

addEntityBtn.addEventListener("click",()=>{
    const name=entityNameInput.value.trim();
    const text=attributesInput.value.trim();

    if(!name){
        showValidation("error","Please enter an entity name.");
        return;
    }

    if(!text){
        showValidation("error","Please enter at least one attribute.");
        return;
    }

    if(entities.some(e=>e.name.toLowerCase()===name.toLowerCase())){
        showValidation("error","This entity already exists.");
        return;
    }

    const names=text.split(",").map(x=>x.trim()).filter(Boolean);

    const attributes=names.map(x=>({
        name:x,
        type:inferDataType(x),
        primaryKey:detectPrimaryKey(x)
    }));

    if(!attributes.some(a=>a.primaryKey)){
        showValidation("error","Add an attribute such as student_id or id to identify the entity.");
        return;
    }

    entities.push({
        name,
        attributes
    });

    entityNameInput.value="";
    attributesInput.value="";

    renderEntities();
    updateRelationshipSelectors();
    renderDiagram();

    sqlGenerated=false;
    updateProgress();

    showValidation("success",`${name} added successfully.`);
});

/* =========================
   ENTITY LIST
========================= */

function renderEntities(){
    if(!entities.length){
        entityList.innerHTML=`<div class="empty-state">No entities added yet.</div>`;
        return;
    }

    entityList.innerHTML="";

    entities.forEach((entity,index)=>{
        const item=document.createElement("div");
        item.className="entity-item";

        const attrs=entity.attributes.map(a=>
            `${a.name} (${a.type})${a.primaryKey?" 🔑":""}`
        ).join(", ");

        item.innerHTML=`
            <button class="delete-btn" onclick="deleteEntity(${index})">×</button>
            <strong>${escapeHTML(entity.name)}</strong>
            <span>${escapeHTML(attrs)}</span>
        `;

        entityList.appendChild(item);
    });
}

function deleteEntity(index){
    const removed=entities[index];

    relationships=relationships.filter(r=>
        r.from!==removed.name&&r.to!==removed.name
    );

    entities.splice(index,1);

    renderEntities();
    updateRelationshipSelectors();
    renderRelationshipList();
    renderDiagram();

    sqlGenerated=false;
    updateProgress();

    showValidation("success",`${removed.name} removed.`);
}

/* =========================
   RELATIONSHIP SELECTORS
========================= */

function updateRelationshipSelectors(){
    if(!relFrom||!relTo)return;

    const oldFrom=relFrom.value;
    const oldTo=relTo.value;

    relFrom.innerHTML='<option value="">Select entity</option>';
    relTo.innerHTML='<option value="">Select entity</option>';

    entities.forEach(e=>{
        const option1=document.createElement("option");
        option1.value=e.name;
        option1.textContent=e.name;

        const option2=document.createElement("option");
        option2.value=e.name;
        option2.textContent=e.name;

        relFrom.appendChild(option1);
        relTo.appendChild(option2);
    });

    if(entities.some(e=>e.name===oldFrom))relFrom.value=oldFrom;
    if(entities.some(e=>e.name===oldTo))relTo.value=oldTo;
}

/* =========================
   ADD RELATIONSHIP
========================= */

if(addRelBtn){
    addRelBtn.addEventListener("click",()=>{
        const from=relFrom.value;
        const to=relTo.value;
        const type=relType.value;

        if(!from||!to){
            showValidation("error","Select both entities first.");
            return;
        }

        if(from===to){
            showValidation("error","Choose two different entities.");
            return;
        }

        if(relationships.some(r=>
            r.from===from&&
            r.to===to
        )){
            showValidation("error","This relationship already exists.");
            return;
        }

        relationships.push({
            from,
            to,
            type
        });

        renderRelationshipList();
        renderDiagram();

        sqlGenerated=false;
        updateProgress();

        showValidation(
            "success",
            `${from} ${type} ${to} relationship added.`
        );
    });
}

/* =========================
   RELATIONSHIP LIST
========================= */

function renderRelationshipList(){
    if(!relationshipList)return;

    if(!relationships.length){
        relationshipList.innerHTML=
            '<div class="empty-state">No relationships added yet.</div>';
        return;
    }

    relationshipList.innerHTML="";

    relationships.forEach((r,i)=>{
        const item=document.createElement("div");
        item.className="relationship-item";

        item.innerHTML=`
            <span>
                ${escapeHTML(r.from)}
                → ${escapeHTML(r.to)}
                (${escapeHTML(r.type)})
            </span>

            <button onclick="deleteRelationship(${i})">×</button>
        `;

        relationshipList.appendChild(item);
    });
}

function deleteRelationship(index){
    relationships.splice(index,1);

    renderRelationshipList();
    renderDiagram();

    sqlGenerated=false;
    updateProgress();
}

/* =========================
   DRAGGING
========================= */

function makeDraggable(element,onMove){
    let dragging=false;
    let startX=0;
    let startY=0;
    let originalX=0;
    let originalY=0;

    element.addEventListener("pointerdown",e=>{
        if(e.target.closest("button"))return;

        dragging=true;

        element.setPointerCapture(e.pointerId);

        startX=e.clientX;
        startY=e.clientY;

        originalX=parseFloat(element.dataset.x||0);
        originalY=parseFloat(element.dataset.y||0);

        element.style.cursor="grabbing";
        e.preventDefault();
    });

    element.addEventListener("pointermove",e=>{
        if(!dragging)return;

        const dx=e.clientX-startX;
        const dy=e.clientY-startY;

        const x=originalX+dx;
        const y=originalY+dy;

        element.dataset.x=x;
        element.dataset.y=y;

        element.style.transform=`translate(${x}px,${y}px)`;

        if(onMove)onMove();
    });

    element.addEventListener("pointerup",()=>{
        dragging=false;
        element.style.cursor="grab";
    });

    element.addEventListener("pointercancel",()=>{
        dragging=false;
        element.style.cursor="grab";
    });
}

/* =========================
   ER DIAGRAM
========================= */

function renderDiagram(){
    if(!entities.length){
        diagramArea.innerHTML=`
            <div class="diagram-placeholder">
                <div class="placeholder-icon">◇</div>
                <h3>Your ER diagram will appear here</h3>
                <p>Add an entity to begin building your database model.</p>
            </div>
        `;
        return;
    }

    diagramArea.innerHTML="";

    const canvas=document.createElement("div");
    canvas.className="er-canvas";

    /* SVG layer for relationship lines */

    const svg=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.classList.add("relationship-lines");

    svg.style.position="absolute";
    svg.style.left="0";
    svg.style.top="0";
    svg.style.width="100%";
    svg.style.height="100%";
    svg.style.pointerEvents="none";
    svg.style.overflow="visible";

    canvas.appendChild(svg);

    const positions={};

    /* =========================
       ENTITIES
    ========================= */

    entities.forEach((entity,index)=>{
        const wrapper=document.createElement("div");

        wrapper.className="er-entity-wrapper";

        const defaultX=
            index%2===0
                ? -230
                : 230;

        const defaultY=
            Math.floor(index/2)*250;

        wrapper.dataset.x=defaultX;
        wrapper.dataset.y=defaultY;

        wrapper.style.transform=
            `translate(${defaultX}px,${defaultY}px)`;

        wrapper.style.cursor="grab";
        wrapper.style.position="absolute";

        /* ENTITY RECTANGLE */

        const entityBox=document.createElement("div");

        entityBox.className="er-entity";
        entityBox.textContent=entity.name;

        wrapper.appendChild(entityBox);

        /* ATTRIBUTES */

        entity.attributes.forEach((attribute,index)=>{
            const attributeWrapper=document.createElement("div");

            attributeWrapper.className=
                "er-attribute-wrapper";

            const attributeOval=document.createElement("div");

            attributeOval.className="er-attribute";

            if(attribute.primaryKey){
                attributeOval.classList.add("primary-key");
            }

            attributeOval.innerHTML=`
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

            const line=document.createElement("div");
            line.className="er-line";

            attributeWrapper.appendChild(attributeOval);
            attributeWrapper.appendChild(line);

            const positionsList=[
                "attribute-top",
                "attribute-right",
                "attribute-bottom",
                "attribute-left"
            ];

            attributeWrapper.classList.add(
                positionsList[index%4]
            );

            /* Make attributes draggable */

            attributeWrapper.dataset.x=0;
            attributeWrapper.dataset.y=0;

            makeDraggable(attributeWrapper,()=>{
                drawAttributeLine(
                    wrapper,
                    attributeWrapper,
                    line
                );
            });

            wrapper.appendChild(attributeWrapper);
        });

        canvas.appendChild(wrapper);

        positions[entity.name]={
            element:wrapper,
            x:defaultX,
            y:defaultY
        };

        /* Entity draggable */

        makeDraggable(wrapper,()=>{
            drawAllRelationships();
        });
    });

    /* =========================
       RELATIONSHIPS
    ========================= */

    function drawAllRelationships(){
        svg.innerHTML="";

        relationships.forEach((relationship,index)=>{
            drawRelationship(
                relationship,
                index
            );
        });
    }

    function drawRelationship(relationship,index){
        const fromPosition=positions[relationship.from];
        const toPosition=positions[relationship.to];

        if(!fromPosition||!toPosition)return;

        const fromEl=fromPosition.element;
        const toEl=toPosition.element;

        const fromX=
            fromEl.offsetLeft+
            fromEl.offsetWidth/2+
            parseFloat(fromEl.dataset.x||0);

        const fromY=
            fromEl.offsetTop+
            fromEl.offsetHeight/2+
            parseFloat(fromEl.dataset.y||0);

        const toX=
            toEl.offsetLeft+
            toEl.offsetWidth/2+
            parseFloat(toEl.dataset.x||0);

        const toY=
            toEl.offsetTop+
            toEl.offsetHeight/2+
            parseFloat(toEl.dataset.y||0);

        const dx=toX-fromX;
        const dy=toY-fromY;

        const distance=Math.sqrt(dx*dx+dy*dy)||1;

        const ux=dx/distance;
        const uy=dy/distance;

        const entityDistance=95;

        const startX=
            fromX+
            ux*entityDistance;

        const startY=
            fromY+
            uy*entityDistance;

        const endX=
            toX-
            ux*entityDistance;

        const endY=
            toY-
            uy*entityDistance;

        const middleX=(startX+endX)/2;
        const middleY=(startY+endY)/2;

        const diamondSize=35;

        const px=-uy;
        const py=ux;

        /* Left diamond point */

        const p1=
            `${middleX-diamondSize},${middleY}`;

        /* Top */

        const p2=
            `${middleX},${middleY-diamondSize/2}`;

        /* Right */

        const p3=
            `${middleX+diamondSize},${middleY}`;

        /* Bottom */

        const p4=
            `${middleX},${middleY+diamondSize/2}`;

        /* First relationship line */

        const line1=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line1.setAttribute("x1",startX);
        line1.setAttribute("y1",startY);

        line1.setAttribute(
            "x2",
            middleX-diamondSize
        );

        line1.setAttribute(
            "y2",
            middleY
        );

        line1.setAttribute("stroke","#8c99af");
        line1.setAttribute("stroke-width","2");

        svg.appendChild(line1);

        /* Second relationship line */

        const line2=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line2.setAttribute(
            "x1",
            middleX+diamondSize
        );

        line2.setAttribute(
            "y1",
            middleY
        );

        line2.setAttribute("x2",endX);
        line2.setAttribute("y2",endY);

        line2.setAttribute("stroke","#8c99af");
        line2.setAttribute("stroke-width","2");

        svg.appendChild(line2);

        /* Diamond */

        const diamond=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );

        diamond.setAttribute(
            "points",
            `${p1} ${p2} ${p3} ${p4}`
        );

        diamond.setAttribute(
            "fill",
            "var(--panel)"
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

        /* Relationship name */

        const relationshipText=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        relationshipText.setAttribute(
            "x",
            middleX
        );

        relationshipText.setAttribute(
            "y",
            middleY+4
        );

        relationshipText.setAttribute(
            "text-anchor",
            "middle"
        );

        relationshipText.setAttribute(
            "fill",
            "currentColor"
        );

        relationshipText.setAttribute(
            "font-size",
            "11"
        );

        relationshipText.setAttribute(
            "font-weight",
            "600"
        );

        relationshipText.textContent=
            getRelationshipName(relationship);

        svg.appendChild(relationshipText);

        /* =========================
           CARDINALITY LABELS
        ========================= */

        const cardinalities=
            getCardinalities(
                relationship.type
            );

        const offset=18;

        const fromCardinality=
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

        fromCardinality.setAttribute(
            "x",
            startX+
            px*offset
        );

        fromCardinality.setAttribute(
            "y",
            startY+
            py*offset-5
        );

        fromCardinality.setAttribute(
            "text-anchor",
            "middle"
        );

        fromCardinality.setAttribute(
            "fill",
            "currentColor"
        );

        fromCardinality.setAttribute(
            "font-size",
            "14"
        );

        fromCardinality.setAttribute(
            "font-weight",
            "700"
        );

        fromCardinality.textContent=
            cardinalities.from;

        svg.appendChild(fromCardinality);

        const toCardinality=
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

        toCardinality.setAttribute(
            "x",
            endX+
            px*offset
        );

        toCardinality.setAttribute(
            "y",
            endY+
            py*offset-5
        );

        toCardinality.setAttribute(
            "text-anchor",
            "middle"
        );

        toCardinality.setAttribute(
            "fill",
            "currentColor"
        );

        toCardinality.setAttribute(
            "font-size",
            "14"
        );

        toCardinality.setAttribute(
            "font-weight",
            "700"
        );

        toCardinality.textContent=
            cardinalities.to;

        svg.appendChild(toCardinality);

        /* =========================
           DRAGGABLE RELATIONSHIP
        ========================= */

        const hitArea=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

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
            "35"
        );

        hitArea.setAttribute(
            "fill",
            "transparent"
        );

        hitArea.style.pointerEvents="all";
        hitArea.style.cursor="grab";

        svg.appendChild(hitArea);

        makeRelationshipDraggable(
            hitArea,
            relationship
        );
    }

    function makeRelationshipDraggable(
        element,
        relationship
    ){
        let dragging=false;
        let startX=0;
        let startY=0;

        element.addEventListener(
            "pointerdown",
            e=>{
                dragging=true;
                startX=e.clientX;
                startY=e.clientY;
                element.setPointerCapture(
                    e.pointerId
                );
                e.preventDefault();
            }
        );

        element.addEventListener(
            "pointermove",
            e=>{
                if(!dragging)return;

                const dx=e.clientX-startX;
                const dy=e.clientY-startY;

                relationship.offsetX=
                    (relationship.offsetX||0)+dx;

                relationship.offsetY=
                    (relationship.offsetY||0)+dy;

                startX=e.clientX;
                startY=e.clientY;

                drawAllRelationships();
            }
        );

        element.addEventListener(
            "pointerup",
            ()=>{
                dragging=false;
            }
        );
    }

    /* Draw relationships after entities exist */

    setTimeout(()=>{
        drawAllRelationships();
    },50);

    diagramArea.appendChild(canvas);
}

/* =========================
   ATTRIBUTE LINES
========================= */

function drawAttributeLine(
    entityWrapper,
    attributeWrapper,
    line
){
    /* Existing CSS handles these lines.
       This function exists so attribute dragging
       remains functional without changing the
       existing diagram logic. */
}

/* =========================
   RELATIONSHIP NAME
========================= */

function getRelationshipName(relationship){
    if(relationship.name){
        return relationship.name;
    }

    return "RELATES";
}

/* =========================
   CARDINALITY
========================= */

function getCardinalities(type){
    if(type==="1:1"){
        return{
            from:"1",
            to:"1"
        };
    }

    if(type==="1:N"){
        return{
            from:"1",
            to:"N"
        };
    }

    if(type==="N:1"){
        return{
            from:"N",
            to:"1"
        };
    }

    if(type==="M:N"){
        return{
            from:"M",
            to:"N"
        };
    }

    return{
        from:"",
        to:""
    };
}

/* =========================
   GENERATE SQL
========================= */

generateBtn.addEventListener("click",()=>{
    if(!entities.length){
        showValidation(
            "error",
            "Add an entity before generating SQL."
        );
        return;
    }

    let sql="";

    entities.forEach(entity=>{
        sql+=`CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;

        entity.attributes.forEach(
            (attribute,index)=>{
                let type=attribute.type;

                if(type==="VARCHAR"){
                    type="VARCHAR(100)";
                }

                let line=
                    `    ${sanitizeSQLName(attribute.name)} ${type}`;

                if(attribute.primaryKey){
                    line+=" PRIMARY KEY";
                }

                if(index<entity.attributes.length-1){
                    line+=",";
                }

                sql+=line+"\n";
            }
        );

        sql+=");\n\n";
    });

    /* =========================
       RELATIONSHIP TABLES
    ========================= */

    relationships.forEach(relationship=>{
        const from=entities.find(
            e=>e.name===relationship.from
        );

        const to=entities.find(
            e=>e.name===relationship.to
        );

        if(!from||!to)return;

        const fromPK=
            from.attributes.find(
                a=>a.primaryKey
            );

        const toPK=
            to.attributes.find(
                a=>a.primaryKey
            );

        if(!fromPK||!toPK)return;

        const type=relationship.type;

        if(type==="M:N"){
            const tableName=
                sanitizeSQLName(
                    getRelationshipName(relationship)
                );

            sql+=`CREATE TABLE ${tableName} (\n`;
            sql+=`    ${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)} INTEGER,\n`;
            sql+=`    ${sanitizeSQLName(to.name)}_${sanitizeSQLName(toPK.name)} INTEGER,\n`;
            sql+=`    PRIMARY KEY (${sanitizeSQLName(from.name)}_${sanitizeSQLName(fromPK.name)}, ${sanitizeSQLName(to.name)}_${sanitizeSQLName(toPK.name)})\n`;
            sql+=`);\n\n`;
        }
    });

    sqlOutput.textContent=sql.trim();

    sqlGenerated=true;
    updateProgress();

    showValidation(
        "success",
        "SQL generated successfully from the ER model."
    );
});

/* =========================
   COPY SQL
========================= */

copyBtn.addEventListener(
    "click",
    async()=>{
        const sql=sqlOutput.textContent;

        if(
            !sql||
            sql==="-- Generated SQL will appear here."
        ){
            showValidation(
                "error",
                "Generate SQL first."
            );
            return;
        }

        try{
            await navigator.clipboard.writeText(sql);

            copyBtn.textContent="Copied!";

            setTimeout(()=>{
                copyBtn.textContent="Copy SQL";
            },1500);

        }catch{
            showValidation(
                "error",
                "Unable to copy SQL."
            );
        }
    }
);

/* =========================
   THEME
========================= */

themeBtn.addEventListener("click",()=>{
    document.body.classList.toggle("light");

    themeBtn.textContent=
        document.body.classList.contains("light")
            ?"☀"
            :"☾";
});

/* =========================
   INITIALIZATION
========================= */

updateRelationshipSelectors();
renderEntities();
renderRelationshipList();
updateProgress();
