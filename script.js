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

function detectPrimaryKey(name){
    name=name.toLowerCase().trim();
    return name==="id"||name.endsWith("_id");
}

function inferDataType(name){
    name=name.toLowerCase().trim();

    if(name==="id"||name.endsWith("_id")) return "INTEGER";

    if(["age","count","quantity","credits","credit","marks","score","year","number","total"].some(x=>name.includes(x))) return "INTEGER";

    if(["price","salary","amount","cost","rate","percentage"].some(x=>name.includes(x))) return "DECIMAL";

    if(["date","dob","birth","created","updated"].some(x=>name.includes(x))) return "DATE";

    if(["is_","has_","active","enabled"].some(x=>name.includes(x))) return "BOOLEAN";

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

    showValidation("success",`${removed.name} removed.`);
}

function updateRelationshipSelectors(){
    if(!relFrom||!relTo)return;

    const oldFrom=relFrom.value;
    const oldTo=relTo.value;

    relFrom.innerHTML='<option value="">Select entity</option>';
    relTo.innerHTML='<option value="">Select entity</option>';

    entities.forEach(e=>{
        relFrom.innerHTML+=`<option value="${escapeHTML(e.name)}">${escapeHTML(e.name)}</option>`;
        relTo.innerHTML+=`<option value="${escapeHTML(e.name)}">${escapeHTML(e.name)}</option>`;
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

        relationships.push({from,to,type});

        renderRelationshipList();
        renderDiagram();

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
        wrapper.dataset.entity=entity.name;

        const entityBox=document.createElement("div");
        entityBox.className="er-entity";
        entityBox.textContent=entity.name;

        wrapper.appendChild(entityBox);

        entity.attributes.forEach((attribute,i)=>{
            const aw=document.createElement("div");
            aw.className="er-attribute-wrapper";

            const oval=document.createElement("div");
            oval.className="er-attribute";

            if(attribute.primaryKey)oval.classList.add("primary-key");

            oval.innerHTML=`
                <span class="attribute-name">
                    ${attribute.primaryKey
                        ? `<u>${escapeHTML(attribute.name)}</u>`
                        : escapeHTML(attribute.name)}
                </span>
                <span class="attribute-type">${escapeHTML(attribute.type)}</span>
            `;

            const line=document.createElement("div");
            line.className="er-line";

            aw.appendChild(oval);
            aw.appendChild(line);

            const position=i%4;

            if(position===0)aw.classList.add("attribute-top");
            if(position===1)aw.classList.add("attribute-right");
            if(position===2)aw.classList.add("attribute-bottom");
            if(position===3)aw.classList.add("attribute-left");

            wrapper.appendChild(aw);
        });

        canvas.appendChild(wrapper);
        positions[entity.name]=wrapper;
    });

    diagramArea.appendChild(canvas);

    requestAnimationFrame(()=>{
        drawRelationships(canvas,positions);
    });
}

function drawRelationships(canvas,positions){
    canvas.querySelectorAll(".er-relationship").forEach(x=>x.remove());

    relationships.forEach((r,index)=>{
        const a=positions[r.from];
        const b=positions[r.to];

        if(!a||!b)return;

        const aRect=a.getBoundingClientRect();
        const bRect=b.getBoundingClientRect();
        const cRect=canvas.getBoundingClientRect();

        const ax=aRect.left+aRect.width/2-cRect.left;
        const ay=aRect.top+aRect.height/2-cRect.top;
        const bx=bRect.left+bRect.width/2-cRect.left;
        const by=bRect.top+bRect.height/2-cRect.top;

        const x=(ax+bx)/2;
        const y=(ay+by)/2;

        const relationship=document.createElement("div");
        relationship.className="er-relationship";
        relationship.style.left=`${x-55}px`;
        relationship.style.top=`${y-55}px`;

        const diamond=document.createElement("div");
        diamond.className="relationship-diamond";

        diamond.innerHTML=`
            <span class="relationship-name">${escapeHTML(r.type)}</span>
        `;

        relationship.appendChild(diamond);

        const c1=document.createElement("span");
        c1.className="cardinality left";
        c1.textContent=getCardinality(r.type,"from");

        const c2=document.createElement("span");
        c2.className="cardinality right";
        c2.textContent=getCardinality(r.type,"to");

        relationship.appendChild(c1);
        relationship.appendChild(c2);

        const line1=document.createElement("div");
        line1.className="relationship-line";
        line1.style.width=`${Math.max(50,Math.abs(bx-ax)/2-50)}px`;

        const line2=document.createElement("div");
        line2.className="relationship-line";
        line2.style.width=`${Math.max(50,Math.abs(bx-ax)/2-50)}px`;

        relationship.appendChild(line1);
        relationship.appendChild(line2);

        canvas.appendChild(relationship);
    });
}

function getCardinality(type,side){
    if(type==="1 : 1")return "1";
    if(type==="1 : N")return side==="from"?"1":"N";
    if(type==="N : 1")return side==="from"?"N":"1";
    if(type==="M : N")return "M";
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

        entity.attributes.forEach((a,i)=>{
            let type=a.type==="VARCHAR"?"VARCHAR(100)":a.type;

            let line=`    ${sanitizeSQLName(a.name)} ${type}`;

            if(a.primaryKey)line+=" PRIMARY KEY";

            if(i<entity.attributes.length-1)line+=",";

            sql+=line+"\n";
        });

        sql+=");\n\n";
    });

    relationships.forEach(r=>{
        const from=entities.find(e=>e.name===r.from);
        const to=entities.find(e=>e.name===r.to);

        if(r.type==="M : N"){
            const fromPK=from.attributes.find(a=>a.primaryKey);
            const toPK=to.attributes.find(a=>a.primaryKey);

            if(fromPK&&toPK){
                const table=`${r.from}_${r.to}`;

                sql+=`CREATE TABLE ${sanitizeSQLName(table)} (\n`;
                sql+=`    ${sanitizeSQLName(fromPK.name)} INTEGER,\n`;
                sql+=`    ${sanitizeSQLName(toPK.name)} INTEGER,\n`;
                sql+=`    PRIMARY KEY (${sanitizeSQLName(fromPK.name)}, ${sanitizeSQLName(toPK.name)})\n`;
                sql+=");\n\n";
            }
        }
    });

    sqlOutput.textContent=sql.trim();

    showValidation("success","SQL generated successfully from the ER model.");
});

copyBtn.addEventListener("click",async()=>{
    const sql=sqlOutput.textContent;

    if(!sql||sql.startsWith("--")){
        showValidation("error","Generate SQL first.");
        return;
    }

    try{
        await navigator.clipboard.writeText(sql);
        copyBtn.textContent="Copied!";
        setTimeout(()=>copyBtn.textContent="Copy SQL",1500);
    }catch{
        showValidation("error","Unable to copy SQL.");
    }
});

themeBtn.addEventListener("click",()=>{
    document.body.classList.toggle("light");
    themeBtn.textContent=document.body.classList.contains("light")?"☀":"☾";
});

updateRelationshipSelectors();
renderRelationshipList();
renderDiagram();
