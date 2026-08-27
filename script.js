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
    if(!validationBox)return;

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
        attributes,
        x:undefined,
        y:undefined
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

/* ================================
   ER DIAGRAM
================================ */

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

    const entityElements={};

    entities.forEach((entity,index)=>{
        const wrapper=document.createElement("div");

        wrapper.className="er-entity-wrapper";

        if(entity.x===undefined){
            entity.x=80+(index%2)*430;
            entity.y=100+Math.floor(index/2)*300;
        }

        wrapper.style.left=entity.x+"px";
        wrapper.style.top=entity.y+"px";

        const entityBox=document.createElement("div");

        entityBox.className="er-entity";
        entityBox.textContent=entity.name;

        wrapper.appendChild(entityBox);

        entity.attributes.forEach((attribute,attrIndex)=>{
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

            const positions=[
                "attribute-top",
                "attribute-right",
                "attribute-bottom",
                "attribute-left"
            ];

            attributeWrapper.classList.add(
                positions[attrIndex%positions.length]
            );

            wrapper.appendChild(attributeWrapper);
        });

        makeEntityDraggable(wrapper,entity);

        canvas.appendChild(wrapper);

        entityElements[entity.name]=wrapper;
    });

    requestAnimationFrame(()=>{
        renderRelationshipLines(svg,entityElements,canvas);
    });

    diagramArea.appendChild(canvas);
}

function makeEntityDraggable(wrapper,entity){
    let dragging=false;
    let startX=0;
    let startY=0;
    let originalX=0;
    let originalY=0;

    wrapper.addEventListener("pointerdown",e=>{
        if(
            e.target.classList.contains("er-attribute")||
            e.target.classList.contains("er-line")
        )return;

        dragging=true;

        wrapper.setPointerCapture(e.pointerId);

        startX=e.clientX;
        startY=e.clientY;

        originalX=entity.x;
        originalY=entity.y;

        wrapper.classList.add("dragging");

        e.preventDefault();
    });

    wrapper.addEventListener("pointermove",e=>{
        if(!dragging)return;

        const dx=e.clientX-startX;
        const dy=e.clientY-startY;

        entity.x=originalX+dx;
        entity.y=originalY+dy;

        wrapper.style.left=entity.x+"px";
        wrapper.style.top=entity.y+"px";

        updateAllRelationshipLines();
    });

    wrapper.addEventListener("pointerup",e=>{
        dragging=false;
        wrapper.classList.remove("dragging");
    });

    wrapper.addEventListener("pointercancel",()=>{
        dragging=false;
        wrapper.classList.remove("dragging");
    });
}

/* ================================
   RELATIONSHIP LINES
================================ */

function renderRelationshipLines(svg,entityElements,canvas){
    svg.innerHTML="";

    relationships.forEach((relationship,index)=>{
        const fromEl=entityElements[relationship.from];
        const toEl=entityElements[relationship.to];

        if(!fromEl||!toEl)return;

        const lineGroup=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        lineGroup.classList.add("relationship-group");

        lineGroup.dataset.relationship=index;

        const line=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.classList.add("relationship-line");

        const cardinalityFrom=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        cardinalityFrom.classList.add("cardinality-label");

        const cardinalityTo=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        cardinalityTo.classList.add("cardinality-label");

        const diamond=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );

        diamond.classList.add("relationship-diamond");

        const relationshipText=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        relationshipText.classList.add("relationship-name");

        relationshipText.textContent=relationship.type;

        lineGroup.appendChild(line);
        lineGroup.appendChild(diamond);
        lineGroup.appendChild(cardinalityFrom);
        lineGroup.appendChild(cardinalityTo);
        lineGroup.appendChild(relationshipText);

        svg.appendChild(lineGroup);

        makeRelationshipDraggable(
            lineGroup,
            relationship
        );
    });

    updateRelationshipLines(svg,entityElements);
}

function updateRelationshipLines(svg,entityElements){
    relationships.forEach((relationship,index)=>{
        const group=svg.querySelector(
            `[data-relationship="${index}"]`
        );

        const fromEl=entityElements[relationship.from];
        const toEl=entityElements[relationship.to];

        if(!group||!fromEl||!toEl)return;

        const line=group.querySelector(".relationship-line");
        const diamond=group.querySelector(".relationship-diamond");
        const labels=group.querySelectorAll(".cardinality-label");
        const name=group.querySelector(".relationship-name");

        const fromX=fromEl.offsetLeft+fromEl.offsetWidth/2;
        const fromY=fromEl.offsetTop+fromEl.offsetHeight/2;

        const toX=toEl.offsetLeft+toEl.offsetWidth/2;
        const toY=toEl.offsetTop+toEl.offsetHeight/2;

        const dx=toX-fromX;
        const dy=toY-fromY;

        const distance=Math.sqrt(dx*dx+dy*dy);

        if(distance===0)return;

        const unitX=dx/distance;
        const unitY=dy/distance;

        const startX=fromX+unitX*90;
        const startY=fromY+unitY*45;

        const endX=toX-unitX*90;
        const endY=toY-unitY*45;

        const middleX=(startX+endX)/2;
        const middleY=(startY+endY)/2;

        line.setAttribute("x1",startX);
        line.setAttribute("y1",startY);
        line.setAttribute("x2",endX);
        line.setAttribute("y2",endY);

        const diamondSize=22;

        const px=-unitY;
        const py=unitX;

        const points=[
            `${middleX+unitX*diamondSize},${middleY+unitY*diamondSize}`,
            `${middleX+px*diamondSize},${middleY+py*diamondSize}`,
            `${middleX-unitX*diamondSize},${middleY-unitY*diamondSize}`,
            `${middleX-px*diamondSize},${middleY-py*diamondSize}`
        ].join(" ");

        diamond.setAttribute("points",points);

        const card=getCardinalities(relationship.type);

        labels[0].textContent=card.from;
        labels[1].textContent=card.to;

        const labelOffset=25;

        labels[0].setAttribute(
            "x",
            startX+unitX*labelOffset
        );

        labels[0].setAttribute(
            "y",
            startY+unitY*labelOffset-8
        );

        labels[1].setAttribute(
            "x",
            endX-unitX*labelOffset
        );

        labels[1].setAttribute(
            "y",
            endY-unitY*labelOffset-8
        );

        name.setAttribute("x",middleX);
        name.setAttribute("y",middleY+4);
        name.setAttribute("text-anchor","middle");
    });
}

function getCardinalities(type){
    if(type==="1 : 1"){
        return{
            from:"1",
            to:"1"
        };
    }

    if(type==="1 : N"){
        return{
            from:"1",
            to:"N"
        };
    }

    if(type==="N : 1"){
        return{
            from:"N",
            to:"1"
        };
    }

    if(type==="M : N"){
        return{
            from:"M",
            to:"N"
        };
    }

    return{
        from:"1",
        to:"N"
    };
}

function updateAllRelationshipLines(){
    const svg=diagramArea.querySelector(".relationship-svg");

    if(!svg)return;

    const entityElements={};

    entities.forEach(entity=>{
        const wrappers=[
            ...diagramArea.querySelectorAll(".er-entity-wrapper")
        ];

        wrappers.forEach(wrapper=>{
            const box=wrapper.querySelector(".er-entity");

            if(
                box&&
                box.textContent===entity.name
            ){
                entityElements[entity.name]=wrapper;
            }
        });
    });

    updateRelationshipLines(svg,entityElements);
}

function makeRelationshipDraggable(group,relationship){
    let dragging=false;
    let startX=0;
    let startY=0;

    group.addEventListener("pointerdown",e=>{
        if(
            e.target.classList.contains("relationship-diamond")||
            e.target.classList.contains("relationship-name")
        ){
            dragging=true;
            startX=e.clientX;
            startY=e.clientY;

            group.setPointerCapture(e.pointerId);

            e.preventDefault();
        }
    });

    group.addEventListener("pointermove",e=>{
        if(!dragging)return;

        const dx=e.clientX-startX;
        const dy=e.clientY-startY;

        relationship.offsetX=(relationship.offsetX||0)+dx;
        relationship.offsetY=(relationship.offsetY||0)+dy;

        startX=e.clientX;
        startY=e.clientY;

        updateAllRelationshipLines();
    });

    group.addEventListener("pointerup",()=>{
        dragging=false;
    });

    group.addEventListener("pointercancel",()=>{
        dragging=false;
    });
}

/* ================================
   SQL GENERATION
================================ */

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

    /* RELATIONSHIP SQL */

    relationships.forEach((relationship,index)=>{
        const fromEntity=entities.find(
            e=>e.name===relationship.from
        );

        const toEntity=entities.find(
            e=>e.name===relationship.to
        );

        if(!fromEntity||!toEntity)return;

        const fromPK=fromEntity.attributes.find(
            a=>a.primaryKey
        );

        const toPK=toEntity.attributes.find(
            a=>a.primaryKey
        );

        if(!fromPK||!toPK)return;

        const relationName=sanitizeSQLName(
            relationship.type
                .toLowerCase()
                .replace(/\s+/g,"_")
        );

        const fromTable=sanitizeSQLName(
            relationship.from
        );

        const toTable=sanitizeSQLName(
            relationship.to
        );

        /*
           M:N needs a separate relationship table.
        */

        if(relationship.type==="M : N"){

            sql+=`CREATE TABLE ${relationName}_relation (\n`;
            sql+=`    ${fromTable}_${sanitizeSQLName(fromPK.name)} INTEGER,\n`;
            sql+=`    ${toTable}_${sanitizeSQLName(toPK.name)} INTEGER,\n`;
            sql+=`    PRIMARY KEY (${fromTable}_${sanitizeSQLName(fromPK.name)}, ${toTable}_${sanitizeSQLName(toPK.name)}),\n`;
            sql+=`    FOREIGN KEY (${fromTable}_${sanitizeSQLName(fromPK.name)}) REFERENCES ${fromTable}(${sanitizeSQLName(fromPK.name)}),\n`;
            sql+=`    FOREIGN KEY (${toTable}_${sanitizeSQLName(toPK.name)}) REFERENCES ${toTable}(${sanitizeSQLName(toPK.name)})\n`;
            sql+=`);\n\n`;
        }

        /*
           1:N means the N-side gets the foreign key.
        */

        else if(relationship.type==="1 : N"){

            sql+=`ALTER TABLE ${toTable}\n`;
            sql+=`ADD FOREIGN KEY (${sanitizeSQLName(fromPK.name)}) REFERENCES ${fromTable}(${sanitizeSQLName(fromPK.name)});\n\n`;
        }

        /*
           N:1 means the N-side is the FROM entity.
        */

        else if(relationship.type==="N : 1"){

            sql+=`ALTER TABLE ${fromTable}\n`;
            sql+=`ADD FOREIGN KEY (${sanitizeSQLName(toPK.name)}) REFERENCES ${toTable}(${sanitizeSQLName(toPK.name)});\n\n`;
        }

        /*
           1:1 uses a foreign key from the second entity.
        */

        else if(relationship.type==="1 : 1"){

            sql+=`ALTER TABLE ${toTable}\n`;
            sql+=`ADD FOREIGN KEY (${sanitizeSQLName(fromPK.name)}) REFERENCES ${fromTable}(${sanitizeSQLName(fromPK.name)});\n\n`;
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

/* ================================
   COPY
================================ */

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

/* ================================
   THEME
================================ */

if(themeBtn){
    themeBtn.addEventListener("click",()=>{
        document.body.classList.toggle("light");

        themeBtn.textContent=
            document.body.classList.contains("light")
            ?"☀"
            :"☾";
    });
}

/* ================================
   INITIAL STATE
================================ */

updateRelationshipSelectors();
renderEntities();
renderRelationshipList();
renderDiagram();
updateProgress();
