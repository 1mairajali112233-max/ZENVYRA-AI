const SUPABASE_URL="https://djijtacuygdhqgxlpbif.supabase.co";
const SUPABASE_KEY="sb_publishable_Q9oFojJYkkUMnHIykKxCjQ_IeFAGXew";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const API_BASE="https://zenvyra-ai-production.up.railway.app";
const USER_PROFILE_KEY="zenvyra_user_profile",LOGGED_IN_KEY="zenvyra_logged_in",WELCOME_SEEN_KEY="zenvyra_welcome_seen",CHAT_SESSIONS_KEY="zenvyra_chat_sessions";
const THEME_KEY="zenvyra_theme",ACCENT_KEY="zenvyra_accent",PICTURE_KEY="zenvyra_profile_picture",DEFAULT_ACCENT="#78dfbc";
/* Clean default avatar (used when no profile picture is saved) */
const DEFAULT_PICTURE="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='#d9f3ec'/><circle cx='32' cy='25' r='11' fill='#2f8f83'/><path d='M10 56c3-13 14-19 22-19s19 6 22 19z' fill='#2f8f83'/></svg>");
/* Below this width the sidebar is an overlay drawer (must match style.css) */
const MOBILE_BP=900;
let selectedRole="",loginMode="signup",activeSession=null,currentTool=null,currentAnswers={},currentResult=null,generating=false,exporting=false;

/* Shared option lists (identical values to the original per-tool lists) */
const G12=Array.from({length:12},(_,i)=>`Grade ${i+1}`);
const G14=["Nursery","KG",...G12];
const S8=["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies","General Knowledge"];
const S7=["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies"];
const S6=["Mathematics","English","Science","Computer","Sindhi","Urdu"];

const STUDENT_TOOLS=[
{id:"quiz-generator",icon:"📝",title:"Quiz Generator",desc:"Create a tailored quiz with questions, difficulty and types.",steps:[["class","What class are you in?","Select your class.","select",G14],["subject","Which subject?","Choose the subject.","select",S8],["topic","What topic should the quiz cover?","Enter a chapter, lesson or topic.","text"],["count","How many questions?","Choose the number of questions.","select",["5","10","15","20"]],["type","Choose question type","Select the assessment format.","options",["MCQ","Short Answer","Long Answer","True-False","Mixed"]],["difficulty","Choose difficulty","Match the level to your learners.","options",["Easy","Medium","Hard","Mixed"]]],export:["pdf","docx"]},
{id:"notes-maker",icon:"🗒️",title:"Notes Maker",desc:"Turn a topic into clear, structured study notes.",steps:[["class","What class are you in?","Choose your level.","select",G12],["subject","Which subject?","Choose the subject.","select",S8],["topic","What topic should the notes cover?","Enter the topic.","text"],["format","How should the notes be organized?","Choose a structure.","options",["Quick Revision","Detailed Notes","Exam Notes","Key Points + Examples"]]],export:["pdf","docx"]},
{id:"lesson-explainer",icon:"📘",title:"Lesson Explainer",desc:"Get a clear, level-appropriate explanation of any lesson.",steps:[["class","What class are you in?","Choose your class.","select",G12],["subject","Which subject?","Choose the subject.","select",S8],["topic","Which lesson or topic?","Enter what you want explained.","text"],["style","How should Zenvyra explain it?","Choose the explanation style.","options",["Simple & Clear","Step by Step","With Examples","Exam Focused"]]],export:[]},
{id:"study-planner",icon:"📅",title:"Study Planner",desc:"Build a practical plan around your subjects and available time.",steps:[["subjects","Which subjects do you need to study?","List subjects separated by commas.","text"],["days","How many days?","Choose your planning window.","select",["3","5","7","14","30"]],["hours","How much time per day?","Approximate study time.","select",["30 minutes","1 hour","2 hours","3 hours","4+ hours"]],["priority","What is your priority?","Choose the main goal.","options",["Exam Preparation","Homework","Revision","Balanced Study"]]],export:["pdf","docx"]},
{id:"revision-mode",icon:"🔁",title:"Revision Mode",desc:"Turn a topic into an active revision session.",steps:[["class","Class","Choose your level.","select",G12],["subject","Subject","Choose a subject.","select",S7],["topic","Topic","What should we revise?","text"],["mode","Revision style","Choose how you want to practice.","options",["Quick Recall","Teach Me Then Test Me","Exam Drill","Mixed Practice"]]],export:[]},
{id:"writing-coach",icon:"✍️",title:"Writing & Grammar Coach",desc:"Improve writing, grammar, clarity and structure.",steps:[["task","What do you want to improve?","Choose the writing task.","options",["Grammar Correction","Essay","Paragraph","Email/Letter","Creative Writing"]],["text","Your writing","Paste or type your writing.","textarea"],["goal","Main goal","What should Zenvyra focus on?","options",["Grammar","Clarity","Vocabulary","Structure","Everything"]]],export:[]},
{id:"speaking-practice",icon:"🗣️",title:"English Speaking Practice",desc:"Practice realistic conversations and receive feedback.",steps:[["scenario","Scenario","Choose a conversation setting.","options",["Daily Conversation","Ordering Food","Job Interview","School Presentation","Travel"]],["level","Your level","Choose your speaking level.","options",["Beginner","Intermediate","Advanced"]],["response","Your response","Type what you would say, or use voice input.","textarea"]],export:[]},
{id:"mistake-analyzer",icon:"🔍",title:"Mistake Analyzer",desc:"Understand mistakes and learn the correct method.",steps:[["subject","Subject","Choose a subject.","select",S6],["question","Question","Enter the original question.","textarea"],["answer","Your answer","Enter your answer.","textarea"],["correct","Correct answer","If known, enter the correct answer.","textarea"]],export:["pdf","docx"]},
{id:"homework-reminders",icon:"⏰",title:"Homework & Exam Reminders",desc:"Turn tasks and dates into an organized action plan.",steps:[["tasks","Your tasks","List homework and exams with dates.","textarea"],["time","Available time","How much time can you use each day?","options",["30 minutes","1 hour","2 hours","3+ hours"]]],export:["pdf","docx"]},
{id:"presentation",icon:"📊",title:"Presentation Maker",desc:"Create a classroom-ready presentation with real PPTX export.",steps:[["class","Class","Choose the class.","select",G12],["subject","Subject","Choose the subject.","select",S8],["topic","Topic","What should the presentation teach?","text"],["slides","Number of slides","Choose the slide count.","select",["5","7","10","12","15"]],["style","Presentation style","Choose the visual/content approach.","options",["Clean Academic","Interactive Classroom","Exam Review","Storytelling"]]],export:["pptx"]}];

const TEACHER_TOOLS=[
{id:"question-paper",icon:"📋",title:"Question Paper Maker",desc:"Build a balanced exam with marks, duration and difficulty.",steps:[["class","Class","Choose the class.","select",G12],["subject","Subject","Choose the subject.","select",S8],["topic","Chapter / topic","What content should be assessed?","text"],["marks","Total marks","Set the total marks.","select",["20","30","40","50","75","100"]],["duration","Exam duration","Choose the exam time.","select",["30 minutes","45 minutes","60 minutes","90 minutes","120 minutes","180 minutes"]],["types","Question types","Select the mix.","options",["MCQ + Short","MCQ + Short + Long","Short + Long","Mixed"]],["difficulty","Difficulty","Choose the difficulty.","options",["Easy","Medium","Hard","Mixed"]]],export:["pdf","docx"]},
{id:"worksheet",icon:"📑",title:"Worksheet Maker",desc:"Create printable practice material for your class.",steps:[["class","Class","Choose the class.","select",G12],["subject","Subject","Choose the subject.","select",S7],["topic","Topic","Enter the topic.","text"],["difficulty","Difficulty","Choose the challenge level.","options",["Easy","Medium","Hard","Mixed"]],["count","Number of questions","Choose the number.","select",["5","10","15","20","25","30"]],["type","Question type","Choose the format.","options",["MCQ","Short Answer","Long Answer","True-False","Mixed"]]],export:["pdf","docx"]},
{id:"lesson-plan",icon:"🗂️",title:"Lesson Plan Generator",desc:"Plan objectives, instruction, activities and assessment.",steps:[["class","Class","Choose the class.","select",G14],["subject","Subject","Choose the subject.","select",S8],["topic","Topic","Enter the lesson topic.","text"],["duration","Duration","Choose the lesson duration.","select",["30 minutes","40 minutes","45 minutes","60 minutes","90 minutes"]],["objectives","Learning objectives","What should students be able to do?","textarea"],["approach","Teaching approach","Choose the teaching approach.","options",["Direct Instruction","Inquiry Based","Collaborative","Activity Based","Mixed"]]],export:["pdf","docx"]},
{id:"answer-checker",icon:"✅",title:"AI Answer Checker",desc:"Evaluate a student's answer and explain what to improve.",steps:[["question","Question","Enter the question.","textarea"],["correct","Expected answer","Enter the model/correct answer.","textarea"],["student","Student answer","Paste the student's answer.","textarea"]],export:[]},
{id:"class-performance",icon:"📊",title:"Class Performance Analyzer",desc:"Turn scores into class-level insights and priorities.",steps:[["scores","Class scores","Paste names and scores, one per line.","textarea"],["assessment","Assessment","What test or assessment was this?","text"],["goal","Analysis goal","Choose what you need.","options",["Identify Weak Areas","Plan Remediation","Compare Performance","Full Analysis"]]],export:["pdf","docx"]},
{id:"weak-topic-finder",icon:"🎯",title:"Weak Topic Finder",desc:"Identify topics students struggle with from evidence.",steps:[["subject","Subject","Choose the subject.","select",S7],["evidence","Evidence","Describe results, mistakes or common errors.","textarea"],["action","Next action","What should the AI prioritize?","options",["Topics Only","Topics + Reasons","Topics + Remediation"]]],export:["pdf","docx"]},
{id:"learning-objectives",icon:"🎓",title:"Learning Objectives",desc:"Create clear and measurable learning objectives for any lesson or topic.",optional:["instructions"],steps:[["subject","Subject","Choose the subject.","select",S8],["class","Grade / Class","Choose the class.","select",G14],["topic","Topic / Lesson","Enter the topic or lesson.","text"],["count","Number of objectives","How many objectives do you need?","select",["3","4","5","6","8","10"]],["instructions","Optional instructions","Anything specific to include or avoid? You can leave this blank.","textarea"]],export:["pdf","docx"]},
{id:"student-progress",icon:"📈",title:"Student Progress",desc:"Summarize one student's progress over time.",steps:[["name","Student name","Enter the student name.","text"],["class","Class","Choose the class.","select",G12],["notes","Progress evidence","Scores, observations, attendance, strengths and concerns.","textarea"],["focus","Focus","Choose the report focus.","options",["Academic Progress","Support Plan","Parent Summary","Full Progress Review"]]],export:["pdf","docx"]},
{id:"homework-creator",icon:"🏠",title:"Homework Creator",desc:"Create meaningful homework matched to class and topic.",steps:[["class","Class","Choose the class.","select",G12],["subject","Subject","Choose the subject.","select",S7],["topic","Topic","Enter the homework topic.","text"],["difficulty","Difficulty","Choose the challenge.","options",["Easy","Medium","Hard","Mixed"]],["count","Number of tasks","How many tasks?","select",["5","10","15","20"]]],export:["pdf","docx"]},
{id:"student-report",icon:"📄",title:"Student Report Generator",desc:"Create a formal, teacher-ready student report.",steps:[["name","Student name","Enter the student name.","text"],["class","Class","Choose the class.","select",G12],["details","Student details","Performance, attendance, behavior, strengths and weaknesses.","textarea"],["tone","Report style","Choose the tone.","options",["Formal","Supportive","Parent Friendly","Detailed"]]],export:["pdf","docx"]},
{id:"class-activity",icon:"🎨",title:"Class Activity Generator",desc:"Design an engaging activity with objectives and materials.",steps:[["class","Class","Choose the class.","select",G12],["subject","Subject","Choose the subject.","select",S7],["topic","Topic","Enter the topic.","text"],["duration","Duration","How long is the activity?","select",["10 minutes","20 minutes","30 minutes","45 minutes","60 minutes"]],["style","Activity style","Choose the format.","options",["Individual","Pairs","Groups","Whole Class","Mixed"]]],export:["pdf","docx"]}];

const PHOTO_TOOL={id:"photo-solver",icon:"📷",title:"Photo Solver",desc:"Upload a question or worksheet image and get a clear solution.",steps:[["photo","Upload a photo","Choose a PNG, JPG or WEBP image.","file"],["question","What should Zenvyra do?","Optional: tell Zenvyra what to focus on.","textarea"]],export:[]};

const FILE_TOOL={id:"file-solver",icon:"📎",title:"File Solver",desc:"Analyze a PDF, DOCX or TXT file with authenticated AI.",steps:[["file","Upload your file","Supported: PDF, DOCX or TXT.","file"],["question","What should Zenvyra do?","Ask a question or request a summary/solution.","textarea"]],export:[]};

function allTools(){return [...STUDENT_TOOLS,...TEACHER_TOOLS,PHOTO_TOOL,FILE_TOOL]}
function toolById(id){return allTools().find(t=>t.id===id)}
function $(id){return document.getElementById(id)}

async function authHeaders(){
    const {data}=await supabaseClient.auth.getSession();
    return data?.session?.access_token
        ? {Authorization:`Bearer ${data.session.access_token}`}
        : {};
}

function escapeHtml(s=""){
    return String(s).replace(/[&<>"']/g,c=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
    }[c]));
}

function renderMarkdown(text=""){
    /* Code fences are pulled out first so their line breaks are preserved */
    const blocks=[];
    let s=escapeHtml(text).replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g,(_,code)=>{
        blocks.push(code.replace(/\n$/,""));
        return `@@CODEBLOCK${blocks.length-1}@@`;
    });

    s=s
        .replace(/^### (.*)$/gm,"<h4>$1</h4>")
        .replace(/^## (.*)$/gm,"<h3>$1</h3>")
        .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
        .replace(/`([^`\n]+)`/g,"<code>$1</code>")
        .replace(/^\s*[-*]\s+(.*)$/gm,"<li>$1</li>")
        .replace(/(<\/(?:h3|h4|li)>)\n/g,"$1")
        .replace(/\n/g,"<br>");

    return s.replace(/@@CODEBLOCK(\d+)@@/g,(_,i)=>`<pre><code>${blocks[Number(i)]}</code></pre>`);
}

function profile(){
    try{return JSON.parse(localStorage.getItem(USER_PROFILE_KEY)||"null")}
    catch{return null}
}

function saveProfile(p){
    localStorage.setItem(USER_PROFILE_KEY,JSON.stringify(p));
}

function storedPicture(){
    try{return localStorage.getItem(PICTURE_KEY)||""}
    catch{return ""}
}

/* Single place that paints name + picture everywhere (top bar, sidebar, settings) */
function updateProfileUI(){
    const p=profile();
    const name=(p&&p.name)||"User";

    ["profileName","sidebarProfileName"].forEach(id=>{
        const el=$(id);
        if(el)el.textContent=name;
    });

    const roleEl=$("sidebarProfileRole");
    if(roleEl)roleEl.textContent=(p&&p.role)?p.role:"";

    const pic=storedPicture()||DEFAULT_PICTURE;

    ["profilePicture","settingsProfilePicture","sidebarProfilePicture"].forEach(id=>{
        const el=$(id);
        if(!el)return;
        el.onerror=()=>{el.onerror=null;el.src=DEFAULT_PICTURE};
        el.src=pic;
    });

    const nameInput=$("settingsName");
    if(nameInput&&document.activeElement!==nameInput)nameInput.value=name;
}

function setAuthMessage(msg,error=true){
    $("welcome-message").textContent=msg;
    $("welcome-message").className=error?"auth-message":"auth-message success";
}

function renderToolCards(){
    const make=(t)=>`<article class="tool-card"><div class="tool-icon">${t.icon}</div><h3>${t.title}</h3><p>${t.desc}</p><button type="button" data-open-tool="${t.id}">Open guided workflow →</button></article>`;

    $("studentToolsGrid").innerHTML=STUDENT_TOOLS.map(make).join("");
    $("teacherToolsGrid").innerHTML=TEACHER_TOOLS.map(make).join("");

    document.querySelectorAll("[data-open-tool]").forEach(b=>{
        b.onclick=()=>openWizard(b.dataset.openTool);
    });

    document.querySelectorAll("nav [data-tool]").forEach(b=>{
        b.onclick=()=>{
            openWizard(b.dataset.tool);
            if(isMobile())closeSidebar();
        };
    });
}

function showStudentTools(){
    $("studentCardsSection").hidden=false;
    $("teacherCardsSection").hidden=true;
    $("studentToolsBtn").classList.add("active");
    $("teacherToolsBtn").classList.remove("active");
}

function showTeacherTools(){
    $("studentCardsSection").hidden=true;
    $("teacherCardsSection").hidden=false;
    $("teacherToolsBtn").classList.add("active");
    $("studentToolsBtn").classList.remove("active");
}

let wizardIndex=0;

function openWizard(id,answers={}){
    const t=toolById(id);
    if(!t)return;

    currentTool=t;
    currentAnswers={...answers};
    wizardIndex=0;

    $("wizardTitle").textContent=t.title;
    $("wizardDescription").textContent=t.desc;
    $("wizardEyebrow").textContent=t.id.replaceAll("-"," ").toUpperCase();

    $("wizardModal").hidden=false;
    renderWizardStep();
}

function renderWizardStep(){
    const t=currentTool;
    const s=t.steps[wizardIndex];
    const key=s[0],q=s[1],help=s[2],type=s[3],opts=s[4]||[];

    $("wizardStepCount").textContent=`Step ${wizardIndex+1} of ${t.steps.length}`;
    $("wizardProgress").style.width=`${((wizardIndex+1)/t.steps.length)*100}%`;

    let control="";

    if(type==="select"){
        control=`<select id="wizardInput"><option value="">Select an option</option>${opts.map(o=>`<option>${escapeHtml(o)}</option>`).join("")}</select>`;
    }
    else if(type==="options"){
        control=`<div class="option-grid">${opts.map(o=>`<button type="button" class="option ${currentAnswers[key]===o?"selected":""}" data-option="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}</div>`;
    }
    else if(type==="textarea"){
        control=`<textarea id="wizardInput" rows="6" placeholder="Type your answer…"></textarea>`;
    }
    else if(type==="file"){
        control=`<input id="wizardInput" type="file" accept="${currentTool.id==="photo-solver"||currentTool.id==="report-card-picture"?"image/png,image/jpeg,image/webp":".pdf,.docx,.txt"}"><div id="fileMeta" class="file-meta"></div>`;
    }
    else{
        control=`<input id="wizardInput" type="text" placeholder="Type your answer…">`;
    }

    $("wizardBody").innerHTML=
        `<div class="wizard-question">${escapeHtml(q)}</div>
        <div class="wizard-help">${escapeHtml(help)}</div>
        <div class="wizard-field">${type==="options"?"":`<label>${escapeHtml(q)}</label>`}${control}</div>`;

    const input=$("wizardInput");

    if(input&&currentAnswers[key]&&type!=="file"){
        input.value=currentAnswers[key];
    }

    if(type==="file"&&currentAnswers[key]){
        $("fileMeta").textContent=`Selected: ${currentAnswers[key].name}`;
    }

    document.querySelectorAll("[data-option]").forEach(b=>{
        b.onclick=()=>{
            currentAnswers[key]=b.dataset.option;
            document.querySelectorAll("[data-option]").forEach(x=>{
                x.classList.toggle("selected",x===b);
            });
        };
    });

    $("wizardBack").disabled=wizardIndex===0;
    $("wizardNext").textContent=wizardIndex===t.steps.length-1?"Generate":"Continue →";

    $("wizardStatus").textContent="";
    $("wizardStatus").className="wizard-status";

    if(input&&type==="file"){
        input.onchange=()=>{
            currentAnswers[key]=input.files[0];
            $("fileMeta").textContent=input.files[0]
                ?`Selected: ${input.files[0].name}`
                :"";
        };
    }
}

function readCurrent(){
    const s=currentTool.steps[wizardIndex];
    const key=s[0],type=s[3];

    if(type==="options")return currentAnswers[key]||"";
    if(type==="file")return currentAnswers[key]||null;

    const input=$("wizardInput");
    return input?input.value.trim():"";
}

function validateStep(){
    const s=currentTool.steps[wizardIndex];
    const key=s[0];
    const value=readCurrent();

    if(!value&&!(currentTool.optional||[]).includes(key)){
        $("wizardStatus").textContent="Please complete this step before continuing.";
        $("wizardStatus").className="wizard-status error";
        return false;
    }

    currentAnswers[key]=value;
    return true;
}

$("wizardNext").onclick=async()=>{
    if(generating)return;
    if(!validateStep())return;

    if(wizardIndex<currentTool.steps.length-1){
        wizardIndex++;
        renderWizardStep();
    }else{
        await generateTool();
    }
};

$("wizardBack").onclick=()=>{
    if(generating)return;

    if(wizardIndex>0){
        wizardIndex--;
        renderWizardStep();
    }
};

$("wizardClose").onclick=()=>{
    if(!generating)$("wizardModal").hidden=true;
};

async function generateTool(){
    if(generating)return;

    generating=true;
    $("wizardNext").disabled=true;
    $("wizardBack").disabled=true;
    $("wizardStatus").textContent="Creating your content…";

    const answersForApi={...currentAnswers};
    delete answersForApi.photo;
    delete answersForApi.file;

    try{
        let result;

        if(currentTool.id==="report-card-picture"){
            const file=currentAnswers.photo;

            if(!file){
                throw Error("Please upload a report card image.");
            }

            const base64=await fileToBase64(file);
            const h=await authHeaders();

            const r=await fetch(`${API_BASE}/api/vision`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    ...h
                },
                body:JSON.stringify({
                    base64Data:base64,
                    mediaType:file.type,
                   prompt:`Read this student report card image and extract the information from it.

The uploaded image is ONLY for reading.
Do NOT write anything on the uploaded image.
Do NOT return coordinates.
Do NOT return x, y, width or height.

The report card can be from ANY school and can have ANY design or layout.

Return ONLY valid JSON:

{
  "studentName": "",
  "fatherName": "",
  "motherName": "",
  "schoolName": "",
  "class": "",
  "section": "",
  "rollNumber": "",
  "academicYear": "",
  "subjects": [],
  "totalMarks": "",
  "obtainedMarks": "",
  "percentage": "",
  "grade": "",
  "attendance": "",
  "remarks": ""
}

Rules:
- Read only information visible in the image.
- Do not invent information.
- If something is not visible, leave it empty.
- Read subject names and marks carefully.
- Support different schools and different report-card designs.
- Return ONLY JSON.`
                })
            });

            const d=await r.json();

            if(!d.success){
                throw Error(d.message||"Could not analyze the report card.");
            }

            let locations;

            try{
                locations=JSON.parse(
                    String(d.data.reply)
                        .replace(/```json/g,"")
                        .replace(/```/g,"")
                        .trim()
                );
            }catch(e){
                throw Error("Zenvyra could not detect the report card fields. Please use a clearer image.");
            }

            const imageResult=await createFilledReportCard(
                file,
                locations.fields||{},
                {
                    name:currentAnswers.name||"",
                    class:currentAnswers.class||"",
                    parentsName:currentAnswers.parentsName||"",
                    description:currentAnswers.description||""
                }
            );

            result={
                title:"Completed Report Card",
                subtitle:"Filled by Zenvyra AI",
                imageData:imageResult,
                sections:[]
            };
        }
        else if(currentTool.id==="photo-solver"){
            const file=currentAnswers.photo;
            if(!file)throw Error("Please upload a photo.");

            const base64=await fileToBase64(file);
            const h=await authHeaders();

            const r=await fetch(`${API_BASE}/api/vision`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    ...h
                },
                body:JSON.stringify({
                    base64Data:base64,
                    mediaType:file.type,
                    prompt:currentAnswers.question||"Analyze this educational image, solve any questions, and explain the solution clearly."
                })
            });

            const d=await r.json();

            if(!d.success)throw Error(d.message||"Photo analysis failed.");

            result={
                title:"Photo Solution",
                subtitle:file.name,
                sections:[{
                    heading:"Zenvyra's Analysis",
                    items:[d.data.reply]
                }]
            };
        }
        else if(currentTool.id==="file-solver"){
            const file=currentAnswers.file;
            if(!file)throw Error("Please upload a file.");

            const base64=await fileToBase64(file);
            const h=await authHeaders();

            const r=await fetch(`${API_BASE}/api/file`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    ...h
                },
                body:JSON.stringify({
                    base64Data:base64,
                    mediaType:file.type,
                    prompt:currentAnswers.question||"Read this educational file and explain its contents clearly. Solve questions if present."
                })
            });

            const d=await r.json();

            if(!d.success)throw Error(d.message||"File analysis failed.");

            result={
                title:"File Analysis",
                subtitle:file.name,
                sections:[{
                    heading:"Zenvyra's Analysis",
                    items:[d.data.reply]
                }]
            };
        }
        else if(currentTool.id==="learning-objectives"){
            const a=currentAnswers;
            const extra=(a.instructions||"").trim();
            const reply=await askChat(
`Create exactly ${a.count} clear, measurable learning objectives for this lesson.

Subject: ${a.subject}
Grade/Class: ${a.class}
Topic/Lesson: ${a.topic}
${extra?`Additional instructions from the teacher: ${extra}\n`:""}
Rules:
- Write exactly ${a.count} numbered objectives.
- Start each objective with "Students will be able to" followed by a measurable action verb (for example: define, explain, solve, compare, identify, calculate, describe, analyze, create).
- Do not use vague verbs such as "understand", "know", "learn" or "appreciate".
- Make every objective specific to the topic and suitable for the grade level.
- Vary the thinking level across the objectives where it makes sense (recall, understanding, application, analysis).
- Output only the numbered list. No introduction and no closing remarks.`
            );

            result={
                title:"Learning Objectives",
                subtitle:`${a.subject} • ${a.class} • ${a.topic}`,
                sections:[{
                    heading:"Learning Objectives",
                    items:[reply]
                }]
            };
        }
        else{
            const h=await authHeaders();

            const r=await fetch(`${API_BASE}/api/tools/generate`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    ...h
                },
                body:JSON.stringify({
                    toolId:currentTool.id,
                    toolTitle:currentTool.title,
                    answers:answersForApi
                })
            });

            const d=await r.json();

            if(!d.success)throw Error(d.message||"Generation failed.");

            result=d.data;
        }

        currentResult=result;
        $("wizardModal").hidden=true;
        showResult(result);

    }catch(e){
        console.error(e);
        $("wizardStatus").textContent=e.message||"Generation failed. Please try again.";
        $("wizardStatus").className="wizard-status error";
    }finally{
        generating=false;
        $("wizardNext").disabled=false;
        $("wizardBack").disabled=false;
    }
}

function showResult(result){
    const imageHtml = result.imageData
        ? `
            <section class="result-section report-card-result">
                <h4>Completed Report Card</h4>
                <img
                    src="${result.imageData}"
                    alt="Completed student report card"
                    style="display:block;width:100%;max-width:900px;height:auto;margin:20px auto;border-radius:12px;"
                >
                <a
                    href="${result.imageData}"
                    download="completed-report-card.png"
                    class="btn"
                    style="display:inline-block;margin-top:10px;text-decoration:none;"
                >
                    Download Report Card
                </a>
            </section>
        `
        : "";

    $("resultContent").innerHTML=
        `<div class="result-body">
        <span class="eyebrow">YOUR RESULT</span>
        <h2>${escapeHtml(result.title||currentTool.title)}</h2>
        <p class="subtitle">${escapeHtml(result.subtitle||"Generated by Zenvyra AI")}</p>

        ${imageHtml}

        ${(result.sections||[]).map(s=>
            `<section class="result-section">
            <h4>${escapeHtml(s.heading||"Section")}</h4>
            ${(s.items||[]).map(i=>
                `<div class="result-text">${renderMarkdown(i)}</div>`
            ).join("")}
            </section>`
        ).join("")}
        </div>`;

    $("resultModal").classList.add("show");
    $("resultModal").hidden=false;
    $("downloadMenu").hidden=true;
    $("exportStatus").textContent="";

    /* Export formats (same behaviour as before: PDF + DOCX) */
    const allowed=["pdf","docx"];

    document.querySelectorAll("#downloadMenu [data-format]").forEach(b=>{
        b.style.display=allowed.includes(b.dataset.format)?"block":"none";
    });

    $("downloadBtn").style.display=allowed.length?"inline-flex":"none";
}

$("resultClose").onclick=()=>{
    $("resultModal").hidden=true;
};

$("resultEdit").onclick=()=>{
    $("resultModal").hidden=true;
    $("wizardModal").hidden=false;
    renderWizardStep();
};

$("resultRegenerate").onclick=()=>{
    $("resultModal").hidden=true;
    $("wizardModal").hidden=false;
    renderWizardStep();
    generateTool();
};

$("downloadBtn").onclick=()=>{
    $("downloadMenu").hidden=!$("downloadMenu").hidden;
};

document.querySelectorAll("#downloadMenu [data-format]").forEach(b=>{
    b.onclick=()=>exportResult(b.dataset.format);
});

async function exportResult(format){
    if(exporting||!currentResult)return;

    exporting=true;
    $("downloadMenu").hidden=true;
    $("exportStatus").textContent=`Preparing ${format.toUpperCase()}…`;

    try{
        const h=await authHeaders();

        const r=await fetch(`${API_BASE}/api/tools/export`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                ...h
            },
            body:JSON.stringify({
                format,
                result:currentResult,
                toolId:currentTool.id
            })
        });

        if(!r.ok){
            const d=await r.json().catch(()=>({}));
            throw Error(d.message||"Download failed.");
        }

        const blob=await r.blob();
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");

        a.href=url;
        a.download=`${slug(currentResult.title||currentTool.title)}.${format}`;

        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(()=>URL.revokeObjectURL(url),1000);

        $("exportStatus").textContent=`✓ ${format.toUpperCase()} downloaded successfully.`;

    }catch(e){
        console.error(e);
        $("exportStatus").textContent=e.message||"Could not create the file.";
    }finally{
        exporting=false;
    }
}

function slug(s){
    return String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-|-$/g,"")
        .slice(0,70)||"zenvyra-output";
}

function fileToBase64(file){
    return new Promise((resolve,reject)=>{
        const r=new FileReader();

        r.onload=()=>{
            resolve(r.result.split(",")[1]);
        };

        r.onerror=reject;
        r.readAsDataURL(file);
    });
}

function createFilledReportCard(file, fields, values){
    return new Promise((resolve,reject)=>{
        const img=new Image();

        img.onload=()=>{
            try{
                const canvas=document.createElement("canvas");
                canvas.width=img.naturalWidth;
                canvas.height=img.naturalHeight;

                const ctx=canvas.getContext("2d");
                ctx.drawImage(img,0,0);

                const fieldNames=[
                    ["name","name"],
                    ["class","class"],
                    ["parentsName","parentsName"],
                    ["description","description"]
                ];

                ctx.fillStyle="#173f3a";
                ctx.textBaseline="top";

                fieldNames.forEach(([field,key])=>{
                    const box=fields[field];
                    const value=values[key];

                    if(!box || !value)return;

                    const x=Number(box.x)*canvas.width;
                    const y=Number(box.y)*canvas.height;
                    const width=Number(box.width)*canvas.width;
                    const height=Number(box.height)*canvas.height;

                    if(
                        !Number.isFinite(x) ||
                        !Number.isFinite(y) ||
                        !Number.isFinite(width) ||
                        !Number.isFinite(height) ||
                        width<=0 ||
                        height<=0
                    )return;

                    const fontSize=Math.max(
                        14,
                        Math.min(32,height*0.65)
                    );

                    ctx.font=`${fontSize}px Arial`;

                    let text=String(value);
                    const words=text.split(/\s+/);
                    const lines=[];
                    let line="";

                    words.forEach(word=>{
                        const test=line ? `${line} ${word}` : word;

                        if(ctx.measureText(test).width<=width){
                            line=test;
                        }else{
                            if(line)lines.push(line);
                            line=word;
                        }
                    });

                    if(line)lines.push(line);

                    const lineHeight=fontSize*1.2;

                    lines.forEach((lineText,index)=>{
                        if(index*lineHeight<height){
                            ctx.fillText(
                                lineText,
                                x,
                                y+(index*lineHeight)
                            );
                        }
                    });
                });

                const outputType=
                    file.type==="image/jpeg"
                    ? "image/jpeg"
                    : "image/png";

                resolve(canvas.toDataURL(outputType,0.95));

            }catch(err){
                reject(err);
            }
        };

        img.onerror=()=>{
            reject(new Error("Could not load the report card image."));
        };

        img.src=URL.createObjectURL(file);
    });
}
const ZENVYRA_SHORTCUTS = {
    "/sn": "School Notes",
    "/qs": "Quiz Generate",
    "/ex": "Topic Explain",
    "/ms": "Math Solve",
    "/sm": "Summarize",
    "/tr": "Translate",
    "/gr": "Grammar Fix",
    "/hw": "Homework Help",
    "/rp": "Revision Practice",
    "/sp": "Study Plan",
    "/fp": "Formula Practice",
    "/es": "English Speaking",
    "/ws": "Writing Support",
    "/sc": "Science Help",
    "/his": "History Notes",
    "/geo": "Geography Help",
    "/def": "Definition",
    "/eg": "Examples",
    "/ans": "Answer Checker",
    "/step": "Step-by-Step Solution"
};
function detectZenvyraShortcut(text) {
    const value = text.trim().toLowerCase();

    if (!value.startsWith("/")) return null;

    const shortcut = value.split(/\s+/)[0];

    if (ZENVYRA_SHORTCUTS[shortcut]) {
        return {
            shortcut: shortcut,
            name: ZENVYRA_SHORTCUTS[shortcut]
        };
    }

    return null;
}
async function askChat(message){
    const question = String(message || "").trim().toLowerCase();

    // Zenvyra identity protection
    if (
        question.includes("who created you") ||
        question.includes("who made you") ||
        question.includes("who is your creator") ||
        question.includes("who is your founder") ||
        question.includes("who built you") ||
        question.includes("who developed you") ||
        question.includes("who owns you")
    ) {
        return "I’m Zenvyra AI, created by Mairaj Ali — Founder & CEO of Zenvyra AI.\n\nI was built with one simple vision: to make learning smarter, simpler, and more enjoyable for everyone.";
    }

    const h = await authHeaders();

    const r = await fetch(`${API_BASE}/api/chat`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            ...h
        },
        credentials:"include",
        body:JSON.stringify({
            system:"You are Zenvyra AI, a professional education assistant. You are Zenvyra AI, not Gemini. Never claim that Google created Zenvyra AI.",
            message:message
        })
    });

    const contentType = r.headers.get("content-type") || "";
    const raw = await r.text();

    console.log("Zenvyra /api/chat status:", r.status);
    console.log("Zenvyra /api/chat response:", raw);

    if(!contentType.includes("application/json")){
        throw Error(
            `Server returned HTML instead of JSON (${r.status}). Check that Railway backend is running.`
        );
    }

    let d;

    try{
        d = JSON.parse(raw);
    }catch{
        throw Error("Server returned invalid JSON.");
    }

    if(!r.ok){
        throw Error(
            d?.message ||
            d?.error ||
            `AI request failed (${r.status}).`
        );
    }

    if(!d?.success){
        throw Error(
            d?.message ||
            d?.error ||
            "AI request failed."
        );
    }

    const reply = d?.data?.reply;

    if(typeof reply !== "string" || !reply.trim()){
        console.error("Unexpected /api/chat JSON:", d);
        throw Error("AI server returned no reply.");
    }

    return reply;
}

/* =========================
   CHAT HISTORY (storage + logic unchanged; markup restyled)
   ========================= */
function sessions(){
    try{
        return JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY)||"[]");
    }catch{
        return [];
    }
}

function saveSessions(x){
    localStorage.setItem(CHAT_SESSIONS_KEY,JSON.stringify(x));
}

function historyTime(id){
    const t=Number(id);
    if(!Number.isFinite(t)||t<=0)return "";
    const d=new Date(t);
    if(isNaN(d.getTime()))return "";
    const now=new Date();
    if(d.toDateString()===now.toDateString()){
        return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    }
    return d.toLocaleDateString([],{month:"short",day:"numeric"});
}

function renderHistory(){
    const list=$("leftSidebarHistory");

    if(!list)return;

    const ss=sessions();

    list.innerHTML=ss.map(s=>
        `<button type="button" class="sidebar-history-item ${activeSession?.id===s.id?"active":""}" data-session="${s.id}" title="${escapeHtml(s.title)}">
        <span class="history-title">${escapeHtml(s.title)}</span>
        <span class="history-time">${escapeHtml(historyTime(s.id))}</span>
        </button>`
    ).join("");

    const title=$("sidebarHistoryTitle");

    if(title){
        title.style.display=ss.length?"block":"none";
    }

    list.querySelectorAll("[data-session]").forEach(b=>{
        b.onclick=()=>{
            activeSession=ss.find(s=>s.id===b.dataset.session)||null;
            renderChat();
            if(isMobile())closeSidebar();
        };
    });
}

function renderChat(){
    const box=$("ai-response");
    const hist=$("chat-history");

    if(!box||!hist)return;

    /* The old single "last answer" box is no longer used; the whole
       conversation renders as bubbles inside #chat-history. */
    box.classList.remove("show");
    box.innerHTML="";

    if(!activeSession||!activeSession.messages.length){
        hist.innerHTML="";
        renderHistory();
        return;
    }

    hist.innerHTML=activeSession.messages.map(m=>
        `<div class="msg-row user"><div class="bubble user-bubble">${escapeHtml(m.q).replace(/\n/g,"<br>")}</div></div>
        <div class="msg-row ai"><div class="bubble ai-bubble">${renderMarkdown(m.a)}</div></div>`
    ).join("");

    renderHistory();

    requestAnimationFrame(()=>{
        const last=hist.lastElementChild;
        if(last)last.scrollIntoView({behavior:"smooth",block:"end"});
    });
}

$("chatSendBtn").onclick=sendChat;

$("ai-question").addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){
        e.preventDefault();
        sendChat();
    }
});

async function sendChat(){
    const input=$("ai-question");
    const q=input.value.trim();

    if(!q)return;

    if(!activeSession){
        activeSession={
            id:String(Date.now()),
            title:q.split(/\s+/).slice(0,6).join(" "),
            messages:[]
        };
    }

    activeSession.messages.push({
        q,
        a:"Thinking…"
    });

    input.value="";
    renderChat();

    try{
        activeSession.messages.at(-1).a=await askChat(q);
    }catch(e){
        activeSession.messages.at(-1).a=e.message||"Sorry, I couldn't connect right now.";
    }

    const ss=sessions();
    const i=ss.findIndex(s=>s.id===activeSession.id);

    if(i<0){
        ss.unshift(activeSession);
    }else{
        ss[i]=activeSession;
    }

    saveSessions(ss);
    renderChat();
}

$("newChatBtn").onclick=()=>{
    activeSession=null;
    renderChat();
    if(isMobile())closeSidebar();
};

/* Ask AI: jump to the open chat */
$("navAskAiBtn").onclick=()=>{
    if(isMobile())closeSidebar();
    $("chatPanel").scrollIntoView({behavior:"smooth",block:"start"});
    if(!isMobile()){
        setTimeout(()=>{$("ai-question").focus({preventScroll:true})},350);
    }
};

/* =========================
   SIDEBAR (single implementation)
   Desktop (>900px): docked; hamburger collapses/expands it and the
   layout (shell + search bar) follows via the --sidebar-w CSS variable.
   Mobile/tablet (<=900px): sidebar is an overlay drawer above the page
   (z-index above the search bar) with a backdrop.
   ========================= */
function isMobile(){return window.innerWidth<=MOBILE_BP}

function openSidebar(){
    $("sidebar").classList.add("open");

    if(isMobile()){
        $("sidebarOverlay").classList.add("show");
        document.body.classList.add("drawer-open");
    }else{
        document.body.classList.remove("sidebar-collapsed");
    }
}

function closeSidebar(){
    $("sidebar").classList.remove("open");
    $("sidebarOverlay").classList.remove("show");
    document.body.classList.remove("drawer-open");
}

function toggleSidebar(){
    if(isMobile()){
        if($("sidebar").classList.contains("open"))closeSidebar();
        else openSidebar();
    }else{
        document.body.classList.toggle("sidebar-collapsed");
    }
}

$("hamburgerBtn").onclick=toggleSidebar;
$("sidebarCloseBtn").onclick=closeSidebar;
$("sidebarOverlay").onclick=closeSidebar;

window.addEventListener("resize",()=>{
    if(!isMobile()){
        $("sidebarOverlay").classList.remove("show");
        document.body.classList.remove("drawer-open");
    }
});

$("historyToolBtn").onclick=()=>{
    renderHistory();
    openSidebar();

    const historyTitle=$("sidebarHistoryTitle");
    const historyList=$("leftSidebarHistory");

    if(historyTitle){
        historyTitle.style.display="block";
    }

    if(historyList){
        historyList.style.display="flex";

        setTimeout(()=>{
            historyList.scrollIntoView({
                behavior:"smooth",
                block:"nearest"
            });
        },100);
    }
};

$("chatAttachmentBtn").onclick=()=>{
    $("chatAttachmentInput").click();
};

$("chatAttachmentInput").onchange=async()=>{
    const f=$("chatAttachmentInput").files[0];

    if(!f)return;

    const id=f.type.startsWith("image/")
        ?"photo-solver"
        :"file-solver";

    openWizard(id,{
        [id==="photo-solver"?"photo":"file"]:f
    });

    $("chatAttachmentInput").value="";
};

function startVoice(){
    const R=window.SpeechRecognition||window.webkitSpeechRecognition;

    if(!R){
        $("voiceStatus").textContent="Voice recognition is not supported in this browser.";
        return;
    }

    const r=new R();

    r.lang="en-US";
    r.interimResults=false;

    r.onstart=()=>{
        $("voiceStatus").textContent="🎤 Listening…";
    };

    r.onresult=e=>{
        $("ai-question").value=e.results[0][0].transcript;
        $("voiceStatus").textContent="";
    };

    r.onerror=e=>{
        $("voiceStatus").textContent=`Microphone error: ${e.error}`;
    };

    r.onend=()=>{
        setTimeout(()=>{
            $("voiceStatus").textContent="";
        },1000);
    };

    r.start();
}

$("searchVoiceBtn").onclick=startVoice;

function setLoginMode(mode){
    loginMode=mode;

    const login=$("signupFields");
    const role=$("loginRoleSection");

    login.style.display=mode==="signup"?"block":"none";
    role.style.display=mode==="signup"?"block":"none";

    $("loginCardTitle").textContent=
        mode==="signup"
        ?"Welcome to Zenvyra AI"
        :"Welcome back";

    $("loginCardSubtitle").textContent=
        mode==="signup"
        ?"Create your account to get started."
        :"Log in to continue.";

    $("authSubmitBtn").textContent=
        mode==="signup"
        ?"Create Account"
        :"Log In";

    $("authToggleLink").textContent=
        mode==="signup"
        ?"Already have an account? Log in"
        :"New to Zenvyra? Create an account";

    $("welcome-message").textContent="";
}

document.querySelectorAll(".role-buttons button").forEach(b=>{
    b.onclick=()=>{
        selectedRole=b.dataset.role;

        document.querySelectorAll(".role-buttons button").forEach(x=>{
            x.classList.toggle("active",x===b);
        });

        $("selected-role").textContent=`Selected: ${selectedRole} ✓`;
    };
});

$("authToggleLink").onclick=()=>{
    setLoginMode(loginMode==="signup"?"login":"signup");
};

$("authSubmitBtn").onclick=async()=>{
    $("authSubmitBtn").disabled=true;

    try{
        const email=$("loginEmail").value.trim();
        const password=$("loginPassword").value;

        if(!email||!password){
            setAuthMessage("Please enter your email and password.");
            return;
        }

        if(loginMode==="signup"){
            const name=$("loginName").value.trim();

            if(!name){
                setAuthMessage("Please enter your name.");
                return;
            }

            if(password.length<8){
                setAuthMessage("Password must be at least 8 characters.");
                return;
            }

            if(!selectedRole){
                setAuthMessage("Please choose a role.");
                return;
            }

            const {data,error}=await supabaseClient.auth.signUp({
                email,
                password,
                options:{
                    data:{
                        name,
                        phone:$("loginPhone").value.trim(),
                        school:$("loginSchool").value.trim(),
                        role:selectedRole
                    }
                }
            });

            if(error)throw error;

            saveProfile({
                name,
                email,
                phone:$("loginPhone").value.trim(),
                school:$("loginSchool").value.trim(),
                role:selectedRole
            });

            if(!data.session){
                setAuthMessage("Account created successfully. Please log in.",false);
                return;
            }

            localStorage.setItem(LOGGED_IN_KEY,"true");
            localStorage.setItem(WELCOME_SEEN_KEY,"false");

            showWelcome();

        }else{
            const {data,error}=await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if(error)throw error;

            const m=data.user.user_metadata||{};

            const p={
                name:m.name||email.split("@")[0],
                email,
                phone:m.phone||"",
                school:m.school||"",
                role:m.role||"General"
            };

            saveProfile(p);

            localStorage.setItem(LOGGED_IN_KEY,"true");
            localStorage.setItem(WELCOME_SEEN_KEY,"true");

            showDashboard();
        }

    }catch(e){
        console.error(e);
        setAuthMessage(e.message||"Authentication failed.");
    }finally{
        $("authSubmitBtn").disabled=false;
    }
};

function showWelcome(){
    const p=profile();

    $("loginScreen").hidden=true;
    $("welcome-screen").hidden=false;

    $("welcome-name").textContent=p?.name||"there";
    $("welcome-role").textContent=`${p?.role||"General"} Mode`;
}

$("openDashboardBtn").onclick=()=>{
    localStorage.setItem(WELCOME_SEEN_KEY,"true");
    showDashboard();
};

function showDashboard(){
    $("loginScreen").hidden=true;
    $("welcome-screen").hidden=true;

    const shell=document.querySelector(".shell");

    if(shell){
        shell.hidden=false;
        shell.style.display="block";
    }

    const p=profile();

    updateProfileUI();

    if($("topbarGreeting")){
        $("topbarGreeting").textContent=`Welcome back, ${p?.name||"User"}! 👋`;
    }

    if(p?.role==="Teacher"){
        showTeacherTools();
    }else{
        showStudentTools();
    }
}

async function restore(){
    try{
        const {data}=await supabaseClient.auth.getSession();

        if(data.session?.user){
            const u=data.session.user;
            const m=u.user_metadata||{};

            const p={
                name:m.name||u.email?.split("@")[0]||"User",
                email:u.email||"",
                phone:m.phone||"",
                school:m.school||"",
                role:m.role||"General"
            };

            saveProfile(p);

            localStorage.setItem(LOGGED_IN_KEY,"true");

            if(localStorage.getItem(WELCOME_SEEN_KEY)==="true"){
                showDashboard();
            }else{
                showWelcome();
            }

        }else{
            localStorage.removeItem(LOGGED_IN_KEY);
            localStorage.removeItem(WELCOME_SEEN_KEY);

            const shell=document.querySelector(".shell");

            if(shell){
                shell.style.display="none";
            }

            $("loginScreen").hidden=false;
            setLoginMode("signup");
        }

    }catch(e){
        console.error("Restore error:",e);

        localStorage.removeItem(LOGGED_IN_KEY);

        const shell=document.querySelector(".shell");

        if(shell){
            shell.style.display="none";
        }

        $("loginScreen").hidden=false;
        setLoginMode("login");
    }
}

async function logOut(){
    await supabaseClient.auth.signOut().catch(()=>{});

    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
    localStorage.removeItem(WELCOME_SEEN_KEY);

    if($("settingsModal"))$("settingsModal").hidden=true;
    closeSidebar();

    const shell=document.querySelector(".shell");

    if(shell){
        shell.style.display="none";
    }

    $("loginScreen").hidden=false;
    setLoginMode("login");
}

$("studentToolsBtn").onclick=showStudentTools;
$("teacherToolsBtn").onclick=showTeacherTools;

/* Backdrop click closes modals (Settings has its own handler below) */
document.querySelectorAll(".modal").forEach(m=>{
    if(m.id==="settingsModal")return;

    m.addEventListener("click",e=>{
        if(e.target===m&&!generating){
            m.hidden=true;
        }
    });
});

/* =========================
   ABOUT ZENVYRA
   ========================= */
(function initAbout(){
    const modal=$("aboutModal");
    const openBtn=$("aboutZenvyraBtn");
    const closeBtn=$("closeAboutModal");

    if(openBtn&&modal){
        openBtn.onclick=()=>{
            if(isMobile())closeSidebar();
            modal.hidden=false;
            const card=modal.querySelector(".small-modal");
            if(card)card.scrollTop=0;
        };
    }

    if(closeBtn&&modal){
        closeBtn.onclick=()=>{modal.hidden=true};
    }
})();

/* =========================
   HELP & SUPPORT (mailto)
   ========================= */
(function initHelpSupport(){
    const SUPPORT_EMAIL="zenvyraaisupport@gmail.com";
    const modal=$("helpSupportModal");
    const openBtn=$("helpSupportBtn");
    const closeBtn=$("closeHelpSupportModal");
    const cancelBtn=$("helpCancelBtn");
    const sendBtn=$("helpSendBtn");
    const msg=$("helpSupportMsg");
    if(!modal||!openBtn)return;

    const fields={
        name:$("helpName"),
        email:$("helpEmail"),
        subject:$("helpSubject"),
        message:$("helpMessage")
    };

    function setMsg(text,type){
        msg.textContent=text||"";
        msg.className=type||"";
    }

    function openHelp(){
        if(isMobile())closeSidebar();
        setMsg("");
        /* Pre-fill from the saved profile when available (editable) */
        const p=profile();
        if(p){
            if(!fields.name.value&&p.name)fields.name.value=p.name;
            if(!fields.email.value&&p.email)fields.email.value=p.email;
        }
        modal.hidden=false;
        const card=modal.querySelector(".small-modal");
        if(card)card.scrollTop=0;
        setTimeout(()=>{(fields.name.value?fields.subject:fields.name).focus()},50);
    }

    function closeHelp(){
        modal.hidden=true;
        setMsg("");
    }

    function send(){
        const name=fields.name.value.trim();
        const email=fields.email.value.trim();
        const subject=fields.subject.value.trim();
        const message=fields.message.value.trim();

        if(!name){setMsg("Please enter your name.","error");fields.name.focus();return}
        if(!email){setMsg("Please enter your email.","error");fields.email.focus();return}
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setMsg("Please enter a valid email address.","error");fields.email.focus();return}
        if(!subject){setMsg("Please enter a subject.","error");fields.subject.focus();return}
        if(!message){setMsg("Please enter your message.","error");fields.message.focus();return}

        const mailSubject=`Zenvyra AI Support — ${subject}`;
        const body=
`Zenvyra AI Support

Name: ${name}

Email: ${email}

Issue: ${subject}

Message:
${message}

Thank you,
Zenvyra AI User`;

        const url=`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;

        /* mailto only opens the email app; it cannot confirm delivery */
        window.location.href=url;
        setMsg("Your email app is ready. Review the message and send it to Zenvyra AI Support.","success");
    }

    openBtn.addEventListener("click",openHelp);
    if(closeBtn)closeBtn.addEventListener("click",closeHelp);
    if(cancelBtn)cancelBtn.addEventListener("click",closeHelp);
    if(sendBtn)sendBtn.addEventListener("click",send);
})();

/* =========================
   SHORTCUT KEYS (reference list built from ZENVYRA_SHORTCUTS)
   ========================= */
(function initShortcutKeys(){
    const modal=$("shortcutKeysModal");
    const openBtn=$("shortcutKeysBtn");
    const closeBtn=$("closeShortcutKeysModal");
    const list=$("shortcutList");
    const search=$("shortcutSearch");
    const empty=$("shortcutEmpty");
    if(!modal||!openBtn||!list)return;

    const entries=Object.entries(ZENVYRA_SHORTCUTS);

    function render(filter){
        const q=(filter||"").trim().toLowerCase();
        const rows=entries.filter(([cmd,name])=>!q||cmd.toLowerCase().includes(q)||name.toLowerCase().includes(q));
        list.innerHTML=rows.map(([cmd,name])=>
            `<div class="shortcut-row"><code>${escapeHtml(cmd)}</code><span>${escapeHtml(name)}</span></div>`
        ).join("");
        if(empty)empty.hidden=rows.length>0;
    }

    function openShortcuts(){
        if(isMobile())closeSidebar();
        if(search)search.value="";
        render("");
        modal.hidden=false;
        const card=modal.querySelector(".small-modal");
        if(card)card.scrollTop=0;
        if(search)setTimeout(()=>search.focus(),50);
    }

    function closeShortcuts(){modal.hidden=true}

    openBtn.addEventListener("click",openShortcuts);
    if(closeBtn)closeBtn.addEventListener("click",closeShortcuts);
    if(search)search.addEventListener("input",()=>render(search.value));
    modal.addEventListener("click",e=>{if(e.target===modal)closeShortcuts()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeShortcuts()});
})();

/* =========================
   SETTINGS — ONE authoritative implementation
   settingsBtn, profile, appearance, accent, save, picture, logout
   ========================= */
(function initSettings(){
    const root=document.documentElement;
    const modal=$("settingsModal");
    const darkQuery=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;

    const themeButtons=document.querySelectorAll(".appearance-option");
    const accentButtons=document.querySelectorAll(".accent-option");

    function readStore(key,fallback){
        try{return localStorage.getItem(key)||fallback}
        catch{return fallback}
    }

    function writeStore(key,value){
        try{localStorage.setItem(key,value);return true}
        catch(e){console.error("Could not save",key,e);return false}
    }

    let savedTheme=readStore(THEME_KEY,"system");
    let savedAccent=readStore(ACCENT_KEY,DEFAULT_ACCENT);
    if(!["light","dark","system"].includes(savedTheme))savedTheme="system";
    if(!/^#[0-9a-f]{6}$/i.test(savedAccent))savedAccent=DEFAULT_ACCENT;

    let selectedTheme=savedTheme;
    let selectedAccent=savedAccent;

    function applyTheme(theme){
        const resolved=theme==="system"
            ?(darkQuery&&darkQuery.matches?"dark":"light")
            :theme;

        root.classList.toggle("dark-mode",resolved==="dark");
        root.setAttribute("data-theme",resolved);
        root.style.colorScheme=resolved;
    }

    function textOn(color){
        const m=/^#?([0-9a-f]{6})$/i.exec(String(color).trim());
        if(!m)return "#123b3a";
        const n=parseInt(m[1],16);
        const lum=(0.299*((n>>16)&255)+0.587*((n>>8)&255)+0.114*(n&255))/255;
        return lum>0.6?"#123b3a":"#ffffff";
    }

    function applyAccent(color){
        root.style.setProperty("--accent",color);
        root.style.setProperty("--mint",color);
        root.style.setProperty("--on-accent",textOn(color));
    }

    function markSelected(){
        themeButtons.forEach(b=>{
            const on=b.dataset.theme===selectedTheme;
            b.classList.toggle("selected",on);
            b.classList.toggle("active",on);
            b.setAttribute("aria-pressed",on?"true":"false");
        });

        accentButtons.forEach(b=>{
            const on=b.dataset.accent===selectedAccent;
            b.classList.toggle("selected",on);
            b.setAttribute("aria-pressed",on?"true":"false");
        });
    }

    themeButtons.forEach(b=>{
        b.onclick=()=>{
            selectedTheme=b.dataset.theme;
            applyTheme(selectedTheme);
            markSelected();
        };
    });

    accentButtons.forEach(b=>{
        b.onclick=()=>{
            selectedAccent=b.dataset.accent;
            applyAccent(selectedAccent);
            markSelected();
        };
    });

    if(darkQuery){
        const onChange=()=>{
            const active=modal&&!modal.hidden?selectedTheme:savedTheme;
            if(active==="system")applyTheme("system");
        };
        if(darkQuery.addEventListener)darkQuery.addEventListener("change",onChange);
        else if(darkQuery.addListener)darkQuery.addListener(onChange);
    }

    function showMsg(text,ms=2800){
        const msg=$("settingsSavedMsg");
        if(!msg)return;
        msg.textContent=text;
        if(ms){
            setTimeout(()=>{if(msg.textContent===text)msg.textContent=""},ms);
        }
    }

    /* Open / close */
    function openSettings(){
        if(!modal)return;
        if(isMobile())closeSidebar();
        selectedTheme=savedTheme;
        selectedAccent=savedAccent;
        markSelected();
        updateProfileUI();
        const nameInput=$("settingsName");
        if(nameInput){
            const p=profile();
            nameInput.value=(p&&p.name)||"";
        }
        const msg=$("settingsSavedMsg");
        if(msg)msg.textContent="";
        modal.hidden=false;
        const card=modal.querySelector(".small-modal");
        if(card)card.scrollTop=0;
    }

    function closeSettings(){
        if(!modal)return;
        /* discard unsaved appearance previews */
        selectedTheme=savedTheme;
        selectedAccent=savedAccent;
        applyTheme(savedTheme);
        applyAccent(savedAccent);
        markSelected();
        modal.hidden=true;
    }

    ["settingsBtn","profileBadge","sidebarProfile"].forEach(id=>{
        const el=$(id);
        if(el)el.onclick=openSettings;
    });

    const closeBtn=$("closeSettingsModal");
    if(closeBtn)closeBtn.onclick=closeSettings;

    if(modal){
        modal.addEventListener("click",e=>{
            if(e.target===modal)closeSettings();
        });
    }

    /* Escape closes Settings, About and the drawer */
    document.addEventListener("keydown",e=>{
        if(e.key!=="Escape")return;
        if(modal&&!modal.hidden){closeSettings();return}
        const about=$("aboutModal");
        if(about&&!about.hidden){about.hidden=true;return}
        const help=$("helpSupportModal");
        if(help&&!help.hidden){help.hidden=true;return}
        if($("sidebar").classList.contains("open")&&isMobile())closeSidebar();
    });

    /* Save settings: appearance, accent, display name (picture is saved on change) */
    const saveBtn=$("saveSettingsBtn");
    if(saveBtn){
        saveBtn.onclick=()=>{
            const ok=writeStore(THEME_KEY,selectedTheme)&&writeStore(ACCENT_KEY,selectedAccent);
            savedTheme=selectedTheme;
            savedAccent=selectedAccent;
            applyTheme(savedTheme);
            applyAccent(savedAccent);
            markSelected();

            /* Display name (existing profile store; also synced to Supabase metadata) */
            const nameInput=$("settingsName");
            const p=profile();
            if(nameInput&&p){
                const newName=nameInput.value.trim();
                if(newName&&newName!==p.name){
                    saveProfile({...p,name:newName});
                    const greeting=$("topbarGreeting");
                    if(greeting)greeting.textContent=`Welcome back, ${newName}! 👋`;
                    Promise.resolve(supabaseClient.auth.updateUser({data:{name:newName}})).catch(()=>{});
                }
            }
            updateProfileUI();

            showMsg(ok?"Settings saved successfully ✓":"Could not save settings in this browser.");
        };
    }

    /* Profile picture */
    function shrinkImage(file){
        return new Promise((resolve,reject)=>{
            const reader=new FileReader();
            reader.onerror=reject;
            reader.onload=()=>{
                const img=new Image();
                img.onerror=reject;
                img.onload=()=>{
                    const size=256;
                    const scale=Math.min(1,size/Math.max(img.width,img.height));
                    const canvas=document.createElement("canvas");
                    canvas.width=Math.max(1,Math.round(img.width*scale));
                    canvas.height=Math.max(1,Math.round(img.height*scale));
                    canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
                    resolve(canvas.toDataURL("image/jpeg",0.85));
                };
                img.src=reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    const picInput=$("profilePictureInput");
    const changeBtn=$("changeProfilePictureBtn");
    const removeBtn=$("removeProfilePictureBtn");

    if(changeBtn&&picInput){
        changeBtn.onclick=()=>picInput.click();
    }

    if(picInput){
        picInput.onchange=async()=>{
            const file=picInput.files&&picInput.files[0];
            if(!file)return;

            if(!file.type.startsWith("image/")){
                showMsg("Please select an image file.");
                picInput.value="";
                return;
            }

            try{
                const src=await shrinkImage(file);
                const saved=writeStore(PICTURE_KEY,src);
                /* show immediately, even if storage failed */
                ["profilePicture","settingsProfilePicture","sidebarProfilePicture"].forEach(id=>{
                    const el=$(id);
                    if(el)el.src=src;
                });
                showMsg(saved?"Profile picture updated ✓":"Picture shown now, but could not be saved for next time.");
            }catch(e){
                console.error(e);
                showMsg("Could not read that image. Please try another one.");
            }

            picInput.value="";
        };
    }

    if(removeBtn){
        removeBtn.onclick=()=>{
            try{localStorage.removeItem(PICTURE_KEY)}catch{}
            if(picInput)picInput.value="";
            updateProfileUI();
            showMsg("Profile picture removed ✓");
        };
    }

    /* Clear chat history */
    const clearBtn=$("clearHistoryBtn");
    if(clearBtn){
        clearBtn.onclick=()=>{
            if(!confirm("Clear all saved chat history on this device? This cannot be undone."))return;
            try{localStorage.removeItem(CHAT_SESSIONS_KEY)}catch{}
            activeSession=null;
            renderChat();
            showMsg("Chat history cleared ✓");
        };
    }

    /* Logout (existing Supabase logOut()) */
    const logoutBtn=$("logoutBtn");
    if(logoutBtn)logoutBtn.onclick=logOut;
    /* Delete Account */
const deleteAccountBtn = $("deleteAccountBtn");

if(deleteAccountBtn){
    deleteAccountBtn.onclick = async () => {
        const confirmed = confirm(
            "Delete your Zenvyra AI account permanently?\n\n" +
            "Your account and saved account data will be deleted. " +
            "This action cannot be undone."
        );

        if(!confirmed) return;

        deleteAccountBtn.disabled = true;
        deleteAccountBtn.textContent = "Deleting...";

        try{
            const { data: { session } } =
                await supabaseClient.auth.getSession();

            const token = session?.access_token;

            if(!token){
                throw new Error("Your session has expired. Please sign in again.");
            }

            const response = await fetch(
                `${API_BASE}/auth/account`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    credentials: "include"
                }
            );

            const result = await response.json().catch(() => null);

            if(!response.ok || !result?.success){
                throw new Error(
                    result?.message || "Could not delete your account."
                );
            }

            await supabaseClient.auth.signOut().catch(() => {});

            localStorage.removeItem(USER_PROFILE_KEY);
            localStorage.removeItem(LOGGED_IN_KEY);
            localStorage.removeItem(WELCOME_SEEN_KEY);
            localStorage.removeItem(CHAT_SESSIONS_KEY);

            if($("settingsModal")){
                $("settingsModal").hidden = true;
            }

            closeSidebar();

            const shell = document.querySelector(".shell");
            if(shell) shell.style.display = "none";

            $("loginScreen").hidden = false;
            setLoginMode("signup");

            alert("Your Zenvyra AI account has been permanently deleted.");

        }catch(err){
            console.error("Delete account error:", err);

            deleteAccountBtn.disabled = false;
            deleteAccountBtn.textContent = "🗑️ Delete Account";

            alert(err.message || "Could not delete your account.");
        }
    };
}

    /* Load saved appearance + picture */
    applyTheme(savedTheme);
    applyAccent(savedAccent);
    markSelected();
    updateProfileUI();
})();

renderToolCards();
renderHistory();
restore();
