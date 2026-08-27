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
        relFrom.appendChild(option1);

        const option2=document.createElement("option");
        option2.value=e.name;
        option2.textContent=e.name;
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

        relationships.push({from,to,type});

        renderRelationshipList();
        renderDiagram();

        sqlGenerated=false;
        updateProgress();

        showValidation("success",`${from} ${type} ${to} relationship added.`);
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
            <span>${escapeHTML(r.from)} → ${escapeHTML(r.to)} (${escapeHTML(r.type)})</span>
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

    const positions={};

    entities.forEach((entity,index)=>{
        const wrapper=document.createElement("div");
        wrapper.className="er-entity-wrapper";

        const angle=(index/entities.length)*Math.PI*2;
        const radius=entities.length===1?0:170;

        wrapper.style.position="absolute";
        wrapper.style.left=`calc(50% + ${Math.cos(angle)*radius}px - 95px)`;
        wrapper.style.top=`calc(50% + ${Math.sin(angle)*radius}px - 75px)`;

        positions[entity.name]=wrapper;

        const entityBox=document.createElement("div");
        entityBox.className="er-entity";
        entityBox.textContent=entity.name;
        wrapper.appendChild(entityBox);

        entity.attributes.forEach((attribute,index)=>{
            const attributeWrapper=document.createElement("div");
            attributeWrapper.className="er-attribute-wrapper";

            const positionsList=[
                "attribute-top",
                "attribute-right",
                "attribute-bottom",
                "attribute-left"
            ];

            attributeWrapper.classList.add(
                positionsList[index%positionsList.length]
            );

            const attributeOval=document.createElement("div");
            attributeOval.className="er-attribute";

            if(attribute.primaryKey){
                attributeOval.classList.add("primary-key");
            }

            attributeOval.innerHTML=`
                <span class="attribute-name">
                    ${attribute.primaryKey
                        ?`<u>${escapeHTML(attribute.name)}</u>`
                        :escapeHTML(attribute.name)}
                </span>
                <span class="attribute-type">
                    ${escapeHTML(attribute.type)}
                </span>
            `;

            const line=document.createElement("div");
            line.className="er-line";

            attributeWrapper.appendChild(attributeOval);
            attributeWrapper.appendChild(line);
            wrapper.appendChild(attributeWrapper);

            makeDraggable(attributeWrapper);
        });

        canvas.appendChild(wrapper);
        makeDraggable(wrapper);
    });

    relationships.forEach((relationship,index)=>{
        const relationshipBox=document.createElement("div");
        relationshipBox.className="er-relationship";

        relationshipBox.innerHTML=`
            <div class="relationship-diamond">
                <span>${escapeHTML(relationship.type)}</span>
            </div>
            <div class="relationship-label">
                ${escapeHTML(relationship.from)} ↔ ${escapeHTML(relationship.to)}
            </div>
        `;

        const x=50+(index%2===0?-18:18);
        const y=50+(Math.floor(index/2)*100);

        relationshipBox.style.position="absolute";
        relationshipBox.style.left=`calc(${x}% - 70px)`;
        relationshipBox.style.top=`calc(${y}% - 40px)`;

        canvas.appendChild(relationshipBox);
        makeDraggable(relationshipBox);
    });

    diagramArea.appendChild(canvas);
}

function makeDraggable(element){
    let dragging=false;
    let startX=0;
    let startY=0;
    let initialX=0;
    let initialY=0;

    element.style.cursor="grab";
    element.style.userSelect="none";

    element.addEventListener("mousedown",e=>{
        if(e.button!==0)return;

        dragging=true;
        startX=e.clientX;
        startY=e.clientY;

        const rect=element.getBoundingClientRect();
        const parentRect=element.parentElement.getBoundingClientRect();

        initialX=rect.left-parentRect.left;
        initialY=rect.top-parentRect.top;

        element.style.cursor="grabbing";
        element.style.zIndex="100";
        document.body.style.userSelect="none";

        e.preventDefault();
    });

    const moveHandler=e=>{
        if(!dragging)return;

        const dx=e.clientX-startX;
        const dy=e.clientY-startY;

        element.style.left=`${initialX+dx}px`;
        element.style.top=`${initialY+dy}px`;
        element.style.transform="none";
    };

    const upHandler=()=>{
        if(!dragging)return;

        dragging=false;
        element.style.cursor="grab";
        document.body.style.userSelect="";
    };

    document.addEventListener("mousemove",moveHandler);
    document.addEventListener("mouseup",upHandler);
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

    relationships.forEach(r=>{
        const fromEntity=entities.find(e=>e.name===r.from);
        const toEntity=entities.find(e=>e.name===r.to);

        if(!fromEntity||!toEntity)return;

        const fromPK=fromEntity.attributes.find(a=>a.primaryKey);
        const toPK=toEntity.attributes.find(a=>a.primaryKey);

        if(!fromPK||!toPK)return;

        if(r.type==="M : N"){
            sql+=`CREATE TABLE ${sanitizeSQLName(r.from+"_"+r.to)} (\n`;
            sql+=`    ${sanitizeSQLName(fromPK.name)} INTEGER,\n`;
            sql+=`    ${sanitizeSQLName(toPK.name)} INTEGER,\n`;
            sql+=`    PRIMARY KEY (${sanitizeSQLName(fromPK.name)}, ${sanitizeSQLName(toPK.name)})\n`;
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

        themeBtn.textContent=
            document.body.classList.contains("light")
            ?"☀"
            :"☾";
    });
}

updateRelationshipSelectors();
renderEntities();
renderRelationshipList();
renderDiagram();
updateProgress();
