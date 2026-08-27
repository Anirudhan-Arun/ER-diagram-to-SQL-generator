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
let positions={};

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

    if(name==="id"||name.endsWith("_id"))return "INTEGER";

    if(["age","count","quantity","credits","credit","marks","score","year","number","total"].some(x=>name.includes(x)))return "INTEGER";

    if(["price","salary","amount","cost","rate","percentage"].some(x=>name.includes(x)))return "DECIMAL";

    if(["date","dob","birth","created","updated"].some(x=>name.includes(x)))return "DATE";

    if(["is_","has_","active","enabled"].some(x=>name.includes(x)))return "BOOLEAN";

    return "VARCHAR";
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
        showValidation("error","Add an attribute such as student_id or id to identify the entity.");
        return;
    }

    entities.push({name,attributes});

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

    delete positions[removed.name];

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

        if(relationships.some(r=>
            (r.from===from&&r.to===to)||
            (r.from===to&&r.to===from)
        )){
            showValidation("error","This relationship already exists.");
            return;
        }

        relationships.push({
            from:from,
            to:to,
            type:type,
            name:"teaches"
        });

        renderRelationshipList();
        renderDiagram();

        sqlGenerated=false;
        updateProgress();

        showValidation("success",`${from} → ${to} relationship added.`);
    });
}

function renderRelationshipList(){
    if(!relationshipList)return;

    if(!relationships.length){
        relationshipList.innerHTML='<div class="empty-state">No relationships added yet.</div>';
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
    canvas.style.position="relative";
    canvas.style.minWidth="900px";
    canvas.style.minHeight="650px";

    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.classList.add("relationship-layer");
    svg.style.position="absolute";
    svg.style.left="0";
    svg.style.top="0";
    svg.style.width="100%";
    svg.style.height="100%";
    svg.style.pointerEvents="none";
    svg.style.overflow="visible";

    canvas.appendChild(svg);

    const entityElements={};

    entities.forEach((entity,index)=>{
        if(!positions[entity.name]){
            positions[entity.name]={
                x:100+(index%2)*400,
                y:120+Math.floor(index/2)*280
            };
        }

        const wrapper=document.createElement("div");
        wrapper.className="er-entity-wrapper";
        wrapper.style.position="absolute";
        wrapper.style.left=positions[entity.name].x+"px";
        wrapper.style.top=positions[entity.name].y+"px";
        wrapper.style.width="190px";
        wrapper.style.height="160px";

        const entityBox=document.createElement("div");
        entityBox.className="er-entity";
        entityBox.textContent=entity.name;

        wrapper.appendChild(entityBox);

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
                    ${attribute.primaryKey
                        ? `<u>${escapeHTML(attribute.name)}</u>`
                        : escapeHTML(attribute.name)}
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
                positionsList[index%positionsList.length]
            );

            wrapper.appendChild(attributeWrapper);
        });

        makeDraggable(wrapper,entity.name,canvas,()=>{
            drawRelationships(svg,canvas,entityElements);
        });

        canvas.appendChild(wrapper);
        entityElements[entity.name]=wrapper;
    });

    diagramArea.appendChild(canvas);

    requestAnimationFrame(()=>{
        drawRelationships(svg,canvas,entityElements);
    });
}

function makeDraggable(element,name,canvas,onMove){
    let dragging=false;
    let startX=0;
    let startY=0;
    let originalX=0;
    let originalY=0;

    element.addEventListener("mousedown",e=>{
        if(e.target.closest(".er-attribute-wrapper"))return;

        dragging=true;

        startX=e.clientX;
        startY=e.clientY;

        originalX=positions[name].x;
        originalY=positions[name].y;

        element.style.cursor="grabbing";

        e.preventDefault();
    });

    document.addEventListener("mousemove",e=>{
        if(!dragging)return;

        const rect=canvas.getBoundingClientRect();

        let newX=originalX+(e.clientX-startX);
        let newY=originalY+(e.clientY-startY);

        newX=Math.max(20,newX);
        newY=Math.max(20,newY);

        positions[name].x=newX;
        positions[name].y=newY;

        element.style.left=newX+"px";
        element.style.top=newY+"px";

        onMove();
    });

    document.addEventListener("mouseup",()=>{
        if(!dragging)return;

        dragging=false;
        element.style.cursor="grab";
    });

    element.style.cursor="grab";
}

function drawRelationships(svg,canvas,entityElements){
    while(svg.firstChild){
        svg.removeChild(svg.firstChild);
    }

    relationships.forEach((relationship,index)=>{
        const fromEl=entityElements[relationship.from];
        const toEl=entityElements[relationship.to];

        if(!fromEl||!toEl)return;

        const fromX=positions[relationship.from].x;
        const fromY=positions[relationship.from].y;

        const toX=positions[relationship.to].x;
        const toY=positions[relationship.to].y;

        const entityWidth=190;
        const entityHeight=160;

        const x1=fromX+entityWidth/2;
        const y1=fromY+entityHeight/2;

        const x2=toX+entityWidth/2;
        const y2=toY+entityHeight/2;

        const dx=x2-x1;
        const dy=y2-y1;

        const distance=Math.sqrt(dx*dx+dy*dy);

        if(distance<1)return;

        const ux=dx/distance;
        const uy=dy/distance;

        const startX=x1+ux*95;
        const startY=y1+uy*80;

        const endX=x2-ux*95;
        const endY=y2-uy*80;

        const midX=(startX+endX)/2;
        const midY=(startY+endY)/2;

        const ns="http://www.w3.org/2000/svg";

        const line1=document.createElementNS(ns,"line");
        line1.setAttribute("x1",startX);
        line1.setAttribute("y1",startY);
        line1.setAttribute("x2",midX-ux*28);
        line1.setAttribute("y2",midY-uy*28);
        line1.setAttribute("stroke","#8c99af");
        line1.setAttribute("stroke-width","2");

        const line2=document.createElementNS(ns,"line");
        line2.setAttribute("x1",midX+ux*28);
        line2.setAttribute("y1",midY+uy*28);
        line2.setAttribute("x2",endX);
        line2.setAttribute("y2",endY);
        line2.setAttribute("stroke","#8c99af");
        line2.setAttribute("stroke-width","2");

        svg.appendChild(line1);
        svg.appendChild(line2);

        const diamond=document.createElementNS(ns,"polygon");

        const size=25;

        const px=-uy;
        const py=ux;

        const points=[
            `${midX},${midY-size}`,
            `${midX+size},${midY}`,
            `${midX},${midY+size}`,
            `${midX-size},${midY}`
        ].join(" ");

        diamond.setAttribute("points",points);
        diamond.setAttribute("fill","#11182b");
        diamond.setAttribute("stroke","#38d39f");
        diamond.setAttribute("stroke-width","2");

        svg.appendChild(diamond);

        const relationText=document.createElementNS(ns,"text");

        relationText.setAttribute("x",midX);
        relationText.setAttribute("y",midY+4);
        relationText.setAttribute("text-anchor","middle");
        relationText.setAttribute("fill","#f4f7fb");
        relationText.setAttribute("font-size","11");
        relationText.setAttribute("font-weight","600");
        relationText.textContent=relationship.name||"relates";

        svg.appendChild(relationText);

        const cardFrom=document.createElementNS(ns,"text");

        cardFrom.setAttribute("x",startX+ux*20+px*12);
        cardFrom.setAttribute("y",startY+uy*20+py*12);
        cardFrom.setAttribute("text-anchor","middle");
        cardFrom.setAttribute("fill","#f4f7fb");
        cardFrom.setAttribute("font-size","13");
        cardFrom.setAttribute("font-weight","700");
        cardFrom.textContent=getFromCardinality(relationship.type);

        svg.appendChild(cardFrom);

        const cardTo=document.createElementNS(ns,"text");

        cardTo.setAttribute("x",endX-ux*20+px*12);
        cardTo.setAttribute("y",endY-uy*20+py*12);
        cardTo.setAttribute("text-anchor","middle");
        cardTo.setAttribute("fill","#f4f7fb");
        cardTo.setAttribute("font-size","13");
        cardTo.setAttribute("font-weight","700");
        cardTo.textContent=getToCardinality(relationship.type);

        svg.appendChild(cardTo);
    });
}

function getFromCardinality(type){
    if(type==="1 : 1")return "1";
    if(type==="1 : N")return "1";
    if(type==="N : 1")return "N";
    if(type==="M : N")return "M";
    return "";
}

function getToCardinality(type){
    if(type==="1 : 1")return "1";
    if(type==="1 : N")return "N";
    if(type==="N : 1")return "1";
    if(type==="M : N")return "N";
    return "";
}

generateBtn.addEventListener("click",()=>{
    if(!entities.length){
        showValidation("error","Add an entity before generating SQL.");
        return;
    }

    let sql="";

    entities.forEach(entity=>{
        sql+=`CREATE TABLE ${sanitizeSQLName(entity.name)} (\n`;

        entity.attributes.forEach((attribute,index)=>{
            let type=attribute.type;

            if(type==="VARCHAR")type="VARCHAR(100)";

            let line=`    ${sanitizeSQLName(attribute.name)} ${type}`;

            if(attribute.primaryKey)line+=" PRIMARY KEY";

            if(index<entity.attributes.length-1)line+=",";

            sql+=line+"\n";
        });

        sql+=");\n\n";
    });

    if(relationships.length){
        relationships.forEach(r=>{
            const from=entities.find(e=>e.name===r.from);
            const to=entities.find(e=>e.name===r.to);

            if(!from||!to)return;

            const fromPK=from.attributes.find(a=>a.primaryKey);
            const toPK=to.attributes.find(a=>a.primaryKey);

            if(!fromPK||!toPK)return;

            if(r.type==="1 : N"){
                sql+=`-- Relationship: ${r.name||"relates"} (${r.from} 1 : N ${r.to})\n`;
                sql+=`ALTER TABLE ${sanitizeSQLName(r.to)} ADD COLUMN ${sanitizeSQLName(r.from)}_${sanitizeSQLName(fromPK.name)} INTEGER;\n\n`;
            }

            else if(r.type==="N : 1"){
                sql+=`-- Relationship: ${r.name||"relates"} (${r.from} N : 1 ${r.to})\n`;
                sql+=`ALTER TABLE ${sanitizeSQLName(r.from)} ADD COLUMN ${sanitizeSQLName(r.to)}_${sanitizeSQLName(toPK.name)} INTEGER;\n\n`;
            }

            else if(r.type==="1 : 1"){
                sql+=`-- Relationship: ${r.name||"relates"} (${r.from} 1 : 1 ${r.to})\n`;
                sql+=`ALTER TABLE ${sanitizeSQLName(r.to)} ADD COLUMN ${sanitizeSQLName(r.from)}_${sanitizeSQLName(fromPK.name)} INTEGER;\n\n`;
            }

            else if(r.type==="M : N"){
                const tableName=`${sanitizeSQLName(r.from)}_${sanitizeSQLName(r.to)}`;

                sql+=`CREATE TABLE ${tableName} (\n`;
                sql+=`    ${sanitizeSQLName(fromPK.name)} INTEGER,\n`;
                sql+=`    ${sanitizeSQLName(toPK.name)} INTEGER,\n`;
                sql+=`    PRIMARY KEY (${sanitizeSQLName(fromPK.name)}, ${sanitizeSQLName(toPK.name)})\n`;
                sql+=`);\n\n`;
            }
        });
    }

    sqlOutput.textContent=sql.trim();

    sqlGenerated=true;
    updateProgress();

    showValidation(
        "success",
        relationships.length
            ? "SQL generated successfully including the relationships."
            : "SQL generated successfully from the ER model."
    );
});

copyBtn.addEventListener("click",async()=>{
    const sql=sqlOutput.textContent;

    if(!sql||sql==="-- Generated SQL will appear here."){
        showValidation("error","Generate SQL first.");
        return;
    }

    try{
        await navigator.clipboard.writeText(sql);
        copyBtn.textContent="Copied!";

        setTimeout(()=>{
            copyBtn.textContent="Copy SQL";
        },1500);
    }catch{
        showValidation("error","Unable to copy SQL.");
    }
});

if(themeBtn){
    themeBtn.addEventListener("click",()=>{
        document.body.classList.toggle("light");

        themeBtn.textContent=document.body.classList.contains("light")
            ?"☀"
            :"☾";
    });
}

updateRelationshipSelectors();
updateProgress();
renderEntities();
renderRelationshipList();
