let entities=[],relationships=[];

const $=id=>document.getElementById(id);
const entityNameInput=$("entityName"),attributesInput=$("attributes");
const addEntityBtn=$("addEntityBtn"),generateBtn=$("generateBtn");
const entityList=$("entityList"),diagramArea=$("diagramArea");
const sqlOutput=$("sqlOutput"),validationBox=$("validationBox");
const copyBtn=$("copyBtn"),themeBtn=$("themeBtn");

function typeOf(n){
 n=n.toLowerCase();
 if(n==="id"||n.endsWith("_id"))return"INTEGER";
 if(/age|count|quantity|credit|mark|score|year|number|total/.test(n))return"INTEGER";
 if(/price|salary|amount|cost|rate|percentage/.test(n))return"DECIMAL";
 if(/date|dob|birth|created|updated/.test(n))return"DATE";
 if(/is_|has_|active|enabled/.test(n))return"BOOLEAN";
 return"VARCHAR";
}
function isPK(n){n=n.toLowerCase();return n==="id"||n.endsWith("_id");}
function esc(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function sqlName(s){return s.trim().replace(/[^a-zA-Z0-9_]/g,"_");}
function msg(type,text){
 validationBox.innerHTML=`<strong>${type==="error"?"Validation Error":"Validation"}</strong><p>${esc(text)}</p>`;
}

addEntityBtn.onclick=()=>{
 const name=entityNameInput.value.trim(),text=attributesInput.value.trim();
 if(!name)return msg("error","Enter an entity name.");
 if(!text)return msg("error","Enter at least one attribute.");
 if(entities.some(e=>e.name.toLowerCase()===name.toLowerCase()))return msg("error","This entity already exists.");

 const attributes=text.split(",").map(x=>x.trim()).filter(Boolean).map(name=>({
  name,type:typeOf(name),primaryKey:isPK(name)
 }));
 if(!attributes.some(a=>a.primaryKey))return msg("error","Add an ID attribute such as student_id or id.");

 entities.push({name,attributes});
 entityNameInput.value="";attributesInput.value="";
 renderEntities();renderDiagram();
 msg("success",`${name} added successfully.`);
};

function renderEntities(){
 if(!entities.length){
  entityList.innerHTML=`<div class="empty-state">No entities added yet.</div>`;
  return;
 }
 entityList.innerHTML=entities.map((e,i)=>`
  <div class="entity-item">
   <button class="delete-btn" onclick="deleteEntity(${i})">×</button>
   <strong>${esc(e.name)}</strong>
   <span>${e.attributes.map(a=>`${esc(a.name)} (${a.type})${a.primaryKey?" 🔑":""}`).join(", ")}</span>
  </div>`).join("");
}

function deleteEntity(i){
 const name=entities[i].name;
 entities.splice(i,1);
 relationships=relationships.filter(r=>r.from!==name&&r.to!==name);
 renderEntities();renderDiagram();
 msg("success",`${name} removed.`);
}

/* RELATIONSHIPS */
function addRelationship(){
 const from=$("relFrom").value,to=$("relTo").value;
 const name=$("relName").value.trim(),card=$("cardinality").value;
 if(!from||!to||!name)return msg("error","Complete all relationship fields.");
 if(from===to)return msg("error","Choose two different entities.");
 if(relationships.some(r=>r.from===from&&r.to===to&&r.name.toLowerCase()===name.toLowerCase()))
  return msg("error","This relationship already exists.");
 relationships.push({from,to,name,card});
 renderDiagram();renderRelationships();
 msg("success",`${name} relationship added.`);
}

function renderRelationships(){
 const box=$("relationshipList");
 if(!box)return;
 box.innerHTML=relationships.length?relationships.map((r,i)=>`
  <div class="entity-item">
   <button class="delete-btn" onclick="deleteRelationship(${i})">×</button>
   <strong>${esc(r.from)} — ${esc(r.name)} — ${esc(r.to)}</strong>
   <span>Cardinality: ${r.card}</span>
  </div>`).join(""):`<div class="empty-state">No relationships added yet.</div>`;
}

function deleteRelationship(i){
 relationships.splice(i,1);renderRelationships();renderDiagram();
}

/* DIAGRAM */
function renderDiagram(){
 if(!entities.length){
  diagramArea.innerHTML=`<div class="diagram-placeholder"><div class="placeholder-icon">◇</div><h3>Your ER diagram will appear here</h3><p>Add an entity to begin building your database model.</p></div>`;
  return;
 }

 const w=Math.max(800,entities.length*320),h=560;
 let svg=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;

 /* relationship lines first */
 relationships.forEach(r=>{
  const a=entities.findIndex(e=>e.name===r.from),b=entities.findIndex(e=>e.name===r.to);
  if(a<0||b<0)return;
  const x1=160+a*320,x2=160+b*320,y=280,mx=(x1+x2)/2;
  svg+=`
   <line x1="${x1+85}" y1="${y}" x2="${mx-45}" y2="${y}" stroke="#8c99af" stroke-width="2"/>
   <line x1="${mx+45}" y1="${y}" x2="${x2-85}" y2="${y}" stroke="#8c99af" stroke-width="2"/>
   <polygon points="${mx},${y-38} ${mx+45},${y} ${mx},${y+38} ${mx-45},${y}" fill="#11182b" stroke="#e0a84b" stroke-width="2"/>
   <text x="${mx}" y="${y+5}" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${esc(r.name)}</text>
   <text x="${x1+105}" y="${y-12}" fill="#38d39f" font-size="14" font-weight="bold">${r.card.split(":")[0]}</text>
   <text x="${x2-115}" y="${y-12}" fill="#38d39f" font-size="14" font-weight="bold">${r.card.split(":")[1]}</text>`;
 });

 entities.forEach((e,i)=>{
  const x=160+i*320,y=280;
  svg+=`
   <rect x="${x-85}" y="${y-35}" width="170" height="70" rx="4" fill="#11182b" stroke="#6c8cff" stroke-width="3"/>
   <text x="${x}" y="${y+6}" text-anchor="middle" fill="white" font-size="18" font-weight="bold">${esc(e.name.toUpperCase())}</text>`;

  const pos=[
   [x,y-135,x,y-100],
   [x+180,y,x+100,y],
   [x,y+135,x,y+100],
   [x-180,y,x-100,y]
  ];

  e.attributes.forEach((a,j)=>{
   const p=pos[j%4],vertical=p[0]===p[2];
   svg+=`
    <line x1="${p[2]}" y1="${p[3]}" x2="${p[0]}" y2="${p[1]}" stroke="#8c99af" stroke-width="2"/>
    <ellipse cx="${p[0]}" cy="${p[1]}" rx="75" ry="32" fill="#11182b" stroke="${a.primaryKey?"#38d39f":"#aeb9cc"}" stroke-width="2"/>
    <text x="${p[0]}" y="${p[1]-2}" text-anchor="middle" fill="white" font-size="12">${a.primaryKey?`<tspan text-decoration="underline">${esc(a.name)}</tspan>`:esc(a.name)}</text>
    <text x="${p[0]}" y="${p[1]+13}" text-anchor="middle" fill="#9ba8bd" font-size="9">${a.type}</text>`;
  });
 });
 svg+="</svg>";
 diagramArea.innerHTML=`<div style="width:100%;height:100%;overflow:auto;display:flex;justify-content:center;align-items:center">${svg}</div>`;
}

/* SQL */
generateBtn.onclick=()=>{
 if(!entities.length)return msg("error","Add an entity before generating SQL.");
 let sql="";
 entities.forEach(e=>{
  sql+=`CREATE TABLE ${sqlName(e.name)} (\n`;
  e.attributes.forEach((a,i)=>{
   let t=a.type==="VARCHAR"?"VARCHAR(100)":a.type;
   sql+=`    ${sqlName(a.name)} ${t}${a.primaryKey?" PRIMARY KEY":""}${i<e.attributes.length-1?",":""}\n`;
  });
  sql+=");\n\n";
 });

 relationships.forEach(r=>{
  if(r.card==="M:N"){
   const a=entities.find(e=>e.name===r.from),b=entities.find(e=>e.name===r.to);
   const pkA=a.attributes.find(x=>x.primaryKey),pkB=b.attributes.find(x=>x.primaryKey);
   sql+=`CREATE TABLE ${sqlName(r.name)} (\n    ${sqlName(pkA.name)} INTEGER,\n    ${sqlName(pkB.name)} INTEGER,\n    PRIMARY KEY (${sqlName(pkA.name)}, ${sqlName(pkB.name)})\n);\n\n`;
  }
 });

 sqlOutput.textContent=sql.trim();
 msg("success","SQL generated successfully from the ER model.");
};

copyBtn.onclick=async()=>{
 const sql=sqlOutput.textContent;
 if(!sql||sql.startsWith("--"))return msg("error","Generate SQL first.");
 try{await navigator.clipboard.writeText(sql);copyBtn.textContent="Copied!";setTimeout(()=>copyBtn.textContent="Copy SQL",1500);}
 catch{msg("error","Unable to copy SQL.");}
};

themeBtn.onclick=()=>{
 document.body.classList.toggle("light");
 themeBtn.textContent=document.body.classList.contains("light")?"☀":"☾";
};

renderEntities();renderDiagram();
