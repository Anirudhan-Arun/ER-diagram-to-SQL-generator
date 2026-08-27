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
        entityList.innerHTML=
            `<div class="empty-state">No entities added yet.</div>`;
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
            <button class="delete-btn"
                onclick="deleteEntity(${index})">×</button>
            <strong>${escapeHTML(entity.name)}</strong>
            <span>${escapeHTML(attrs)}</span>
        `;

        entityList.appendChild(item);
    });
}


/* =========================
   DELETE ENTITY
========================= */

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

        if(relationships.some(r=>r.from===from&&r.to===to)){
            showValidation("error","This relationship already exists.");
            return;
        }

        /*
           Relationship name:
           If your HTML has a relationship-name input,
           use it. Otherwise use the cardinality as a
           temporary fallback.
        */

        const relNameInput=document.getElementById("relationshipName");

        const relationName=relNameInput&&relNameInput.value.trim()
            ?relNameInput.value.trim()
            :"Relationship";

        relationships.push({
            from,
            to,
            type,
            name:relationName
        });

        if(relNameInput)relNameInput.value="";

        renderRelationshipList();
        renderDiagram();

        sqlGenerated=false;
        updateProgress();

        showValidation(
            "success",
            `${relationName} relationship added.`
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
                ${escapeHTML(r.name||"Relationship")} :
                ${escapeHTML(r.from)}
                → 
                ${escapeHTML(r.to)}
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


/* =====================================================
   ER DIAGRAM
===================================================== */

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

    const svg=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.classList.add("relationship-svg");

    canvas.appendChild(svg);

    const positions={};

    /*
       Give every entity a starting position.
       These positions can then be dragged.
    */

    entities.forEach((entity,index)=>{
        const wrapper=document.createElement("div");

        wrapper.className="er-entity-wrapper";

        const col=index%2;
        const row=Math.floor(index/2);

        wrapper.style.left=`${80+col*390}px`;
        wrapper.style.top=`${80+row*300}px`;

        wrapper.dataset.entity=entity.name;

        const entityBox=document.createElement("div");

        entityBox.className="er-entity";
        entityBox.textContent=entity.name;

        wrapper.appendChild(entityBox);

        /*
           Attributes
        */

        entity.attributes.forEach((attribute,index)=>{
            const attributeWrapper=document.createElement("div");

            attributeWrapper.className="er-attribute-wrapper";

            const attributeOval=document.createElement("div");

            attributeOval.className="er-attribute";

            if(attribute.primaryKey){
                attributeOval.classList.add("primary-key");
            }

            attributeOval.innerHTML=`
                <span class="attribute-name">
                    ${
                        attribute.primaryKey
                        ?`<u>${escapeHTML(attribute.name)}</u>`
                        :escapeHTML(attribute.name)
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

            const positions=[
                "attribute-top",
                "attribute-right",
                "attribute-bottom",
                "attribute-left"
            ];

            attributeWrapper.classList.add(
                positions[index%positions.length]
            );

            wrapper.appendChild(attributeWrapper);
        });

        canvas.appendChild(wrapper);

        positions[entity.name]=wrapper;
    });

    /*
       Draw relationships after all entities exist.
    */

    relationships.forEach((relationship,index)=>{
        drawRelationship(
            svg,
            relationship,
            positions,
            index
        );
    });

    diagramArea.appendChild(canvas);

    /*
       Make entities draggable.
       The relationship SVG is redrawn while dragging.
    */

    entities.forEach(entity=>{
        const wrapper=positions[entity.name];

        makeDraggable(
            wrapper,
            canvas,
            svg,
            positions
        );
    });
}


/* =====================================================
   DRAW RELATIONSHIP
===================================================== */

function drawRelationship(svg,relationship,positions,index){

    const fromEl=positions[relationship.from];
    const toEl=positions[relationship.to];

    if(!fromEl||!toEl)return;

    const fromX=fromEl.offsetLeft+fromEl.offsetWidth/2;
    const fromY=fromEl.offsetTop+fromEl.offsetHeight/2;

    const toX=toEl.offsetLeft+toEl.offsetWidth/2;
    const toY=toEl.offsetTop+toEl.offsetHeight/2;

    const dx=toX-fromX;
    const dy=toY-fromY;

    const distance=Math.sqrt(dx*dx+dy*dy)||1;

    const unitX=dx/distance;
    const unitY=dy/distance;

    const diamondDistance=75;

    const diamondX=
        (fromX+toX)/2;

    const diamondY=
        (fromY+toY)/2;

    const lineGap=45;

    const firstEndX=
        diamondX-unitX*lineGap;

    const firstEndY=
        diamondY-unitY*lineGap;

    const secondStartX=
        diamondX+unitX*lineGap;

    const secondStartY=
        diamondY+unitY*lineGap;

    /*
       LINE FROM ENTITY TO DIAMOND
    */

    const line1=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    line1.setAttribute("x1",fromX);
    line1.setAttribute("y1",fromY);
    line1.setAttribute("x2",firstEndX);
    line1.setAttribute("y2",firstEndY);

    line1.classList.add("relationship-line");

    svg.appendChild(line1);


    /*
       LINE FROM DIAMOND TO ENTITY
    */

    const line2=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    line2.setAttribute("x1",secondStartX);
    line2.setAttribute("y1",secondStartY);
    line2.setAttribute("x2",toX);
    line2.setAttribute("y2",toY);

    line2.classList.add("relationship-line");

    svg.appendChild(line2);


    /*
       DIAMOND
    */

    const diamond=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon"
    );

    const size=42;

    diamond.setAttribute(
        "points",
        `
        ${diamondX},${diamondY-size}
        ${diamondX+size},${diamondY}
        ${diamondX},${diamondY+size}
        ${diamondX-size},${diamondY}
        `
    );

    diamond.classList.add("relationship-diamond");

    svg.appendChild(diamond);


    /*
       RELATIONSHIP NAME
    */

    const relationText=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    relationText.setAttribute("x",diamondX);
    relationText.setAttribute("y",diamondY+5);
    relationText.setAttribute("text-anchor","middle");

    relationText.classList.add("relationship-name");

    relationText.textContent=
        relationship.name||"Relationship";

    svg.appendChild(relationText);


    /*
       CARDINALITY
    */

    let leftCardinality="1";
    let rightCardinality="1";

    if(relationship.type==="1:N"){
        leftCardinality="1";
        rightCardinality="N";
    }

    else if(relationship.type==="N:1"){
        leftCardinality="N";
        rightCardinality="1";
    }

    else if(relationship.type==="M:N"){
        leftCardinality="M";
        rightCardinality="N";
    }

    else if(relationship.type==="1:1"){
        leftCardinality="1";
        rightCardinality="1";
    }


    /*
       Put cardinalities above their
       respective relationship lines.
    */

    const leftText=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    leftText.setAttribute(
        "x",
        fromX+(firstEndX-fromX)*0.55
    );

    leftText.setAttribute(
        "y",
        fromY+(firstEndY-fromY)*0.55-10
    );

    leftText.setAttribute(
        "text-anchor",
        "middle"
    );

    leftText.classList.add("cardinality-text");

    leftText.textContent=leftCardinality;

    svg.appendChild(leftText);


    const rightText=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    rightText.setAttribute(
        "x",
        secondStartX+(toX-secondStartX)*0.55
    );

    rightText.setAttribute(
        "y",
        secondStartY+(toY-secondStartY)*0.55-10
    );

    rightText.setAttribute(
        "text-anchor",
        "middle"
    );

    rightText.classList.add("cardinality-text");

    rightText.textContent=rightCardinality;

    svg.appendChild(rightText);
}


/* =====================================================
   DRAGGING
===================================================== */

function makeDraggable(wrapper,canvas,svg,positions){

    let dragging=false;
    let offsetX=0;
    let offsetY=0;

    wrapper.addEventListener("mousedown",e=>{
        if(e.target.closest(".er-attribute"))return;

        dragging=true;

        const rect=canvas.getBoundingClientRect();

        offsetX=
            e.clientX-
            rect.left-
            wrapper.offsetLeft;

        offsetY=
            e.clientY-
            rect.top-
            wrapper.offsetTop;

        wrapper.classList.add("dragging");

        e.preventDefault();
    });

    document.addEventListener("mousemove",e=>{
        if(!dragging)return;

        const rect=canvas.getBoundingClientRect();

        let x=
            e.clientX-
            rect.left-
            offsetX;

        let y=
            e.clientY-
            rect.top-
            offsetY;

        x=Math.max(20,x);
        y=Math.max(20,y);

        wrapper.style.left=`${x}px`;
        wrapper.style.top=`${y}px`;

        /*
           Remove old relationship SVG
           and redraw everything.
        */

        svg.innerHTML="";

        relationships.forEach((relationship,index)=>{
            drawRelationship(
                svg,
                relationship,
                positions,
                index
            );
        });
    });

    document.addEventListener("mouseup",()=>{
        if(!dragging)return;

        dragging=false;
        wrapper.classList.remove("dragging");
    });
}


/* =====================================================
   GENERATE SQL
===================================================== */

generateBtn.addEventListener("click",()=>{

    if(!entities.length){
        showValidation(
            "error",
            "Add an entity before generating SQL."
        );
        return;
    }

    let sql="";

    /*
       ENTITY TABLES
    */

    entities.forEach(entity=>{

        sql+=
            `CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;

        entity.attributes.forEach((attribute,index)=>{

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
        });

        sql+=");\n\n";
    });


    /*
       RELATIONSHIP SQL
    */

    relationships.forEach(relationship=>{

        const fromEntity=entities.find(
            e=>e.name===relationship.from
        );

        const toEntity=entities.find(
            e=>e.name===relationship.to
        );

        if(!fromEntity||!toEntity)return;

        /*
           M:N requires a junction table.
        */

        if(relationship.type==="M:N"){

            const tableName=
                sanitizeSQLName(
                    relationship.name||`${relationship.from}_${relationship.to}`
                );

            const fromPK=
                fromEntity.attributes.find(
                    a=>a.primaryKey
                );

            const toPK=
                toEntity.attributes.find(
                    a=>a.primaryKey
                );

            if(!fromPK||!toPK)return;

            sql+=
`CREATE TABLE ${tableName} (
    ${sanitizeSQLName(relationship.from)}_${sanitizeSQLName(fromPK.name)} INTEGER,
    ${sanitizeSQLName(relationship.to)}_${sanitizeSQLName(toPK.name)} INTEGER,
    PRIMARY KEY (${sanitizeSQLName(relationship.from)}_${sanitizeSQLName(fromPK.name)}, ${sanitizeSQLName(relationship.to)}_${sanitizeSQLName(toPK.name)}),
    FOREIGN KEY (${sanitizeSQLName(relationship.from)}_${sanitizeSQLName(fromPK.name)}) REFERENCES ${sanitizeSQLName(relationship.from)}(${sanitizeSQLName(fromPK.name)}),
    FOREIGN KEY (${sanitizeSQLName(relationship.to)}_${sanitizeSQLName(toPK.name)}) REFERENCES ${sanitizeSQLName(relationship.to)}(${sanitizeSQLName(toPK.name)})
);

`;

        }

        /*
           1:N
           Foreign key goes on the N-side.
        */

        else if(relationship.type==="1:N"){

            const pk=fromEntity.attributes.find(
                a=>a.primaryKey
            );

            if(!pk)return;

            sql+=
`ALTER TABLE ${sanitizeSQLName(toEntity.name)}
ADD ${sanitizeSQLName(fromEntity.name)}_${sanitizeSQLName(pk.name)} INTEGER,
ADD FOREIGN KEY (${sanitizeSQLName(fromEntity.name)}_${sanitizeSQLName(pk.name)})
REFERENCES ${sanitizeSQLName(fromEntity.name)}(${sanitizeSQLName(pk.name)});

`;
        }

        /*
           N:1
           Foreign key goes on the N-side,
           which is the FROM entity.
        */

        else if(relationship.type==="N:1"){

            const pk=toEntity.attributes.find(
                a=>a.primaryKey
            );

            if(!pk)return;

            sql+=
`ALTER TABLE ${sanitizeSQLName(fromEntity.name)}
ADD ${sanitizeSQLName(toEntity.name)}_${sanitizeSQLName(pk.name)} INTEGER,
ADD FOREIGN KEY (${sanitizeSQLName(toEntity.name)}_${sanitizeSQLName(pk.name)})
REFERENCES ${sanitizeSQLName(toEntity.name)}(${sanitizeSQLName(pk.name)});

`;
        }

        /*
           1:1
        */

        else if(relationship.type==="1:1"){

            const pk=toEntity.attributes.find(
                a=>a.primaryKey
            );

            if(!pk)return;

            sql+=
`ALTER TABLE ${sanitizeSQLName(fromEntity.name)}
ADD ${sanitizeSQLName(toEntity.name)}_${sanitizeSQLName(pk.name)} INTEGER UNIQUE,
ADD FOREIGN KEY (${sanitizeSQLName(toEntity.name)}_${sanitizeSQLName(pk.name)})
REFERENCES ${sanitizeSQLName(toEntity.name)}(${sanitizeSQLName(pk.name)});

`;
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


/* =====================================================
   COPY SQL
===================================================== */

copyBtn.addEventListener("click",async()=>{

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
});


/* =====================================================
   THEME
===================================================== */

if(themeBtn){

    themeBtn.addEventListener("click",()=>{

        document.body.classList.toggle("light");

        themeBtn.textContent=
            document.body.classList.contains("light")
            ?"☀"
            :"☾";
    });
}


/* =====================================================
   INITIALIZE
===================================================== */

updateRelationshipSelectors();
renderEntities();
renderRelationshipList();
updateProgress();
