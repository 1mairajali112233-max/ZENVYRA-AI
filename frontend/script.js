const SUPABASE_URL="https://djijtacuygdhqgxlpbif.supabase.co";
const SUPABASE_KEY="sb_publishable_Q9oFojJYkkUMnHIykKxCjQ_IeFAGXew";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const API_BASE="https://zenvyra-ai-production.up.railway.app";
const USER_PROFILE_KEY="zenvyra_user_profile",LOGGED_IN_KEY="zenvyra_logged_in",WELCOME_SEEN_KEY="zenvyra_welcome_seen",CHAT_SESSIONS_KEY="zenvyra_chat_sessions";
let selectedRole="",loginMode="signup",activeSession=null,currentTool=null,currentAnswers={},currentResult=null,generating=false,exporting=false;

const STUDENT_TOOLS=[
{id:"quiz-generator",icon:"📝",title:"Quiz Generator",desc:"Create a tailored quiz with questions, difficulty and types.",steps:[["class","What class are you in?","Select your class.","select",["Nursery","KG",...Array.from({length:12},(_,i)=>`Grade ${i+1}`)]],["subject","Which subject?","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies","General Knowledge"]],["topic","What topic should the quiz cover?","Enter a chapter, lesson or topic.","text"],["count","How many questions?","Choose the number of questions.","select",["5","10","15","20"]],["type","Choose question type","Select the assessment format.","options",["MCQ","Short Answer","Long Answer","True-False","Mixed"]],["difficulty","Choose difficulty","Match the level to your learners.","options",["Easy","Medium","Hard","Mixed"]]],export:["pdf","docx"]},
{id:"notes-maker",icon:"🗒️",title:"Notes Maker",desc:"Turn a topic into clear, structured study notes.",steps:[["class","What class are you in?","Choose your level.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Which subject?","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies","General Knowledge"]],["topic","What topic should the notes cover?","Enter the topic.","text"],["format","How should the notes be organized?","Choose a structure.","options",["Quick Revision","Detailed Notes","Exam Notes","Key Points + Examples"]]],export:["pdf","docx"]},
{id:"lesson-explainer",icon:"📘",title:"Lesson Explainer",desc:"Get a clear, level-appropriate explanation of any lesson.",steps:[["class","What class are you in?","Choose your class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Which subject?","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies","General Knowledge"]],["topic","Which lesson or topic?","Enter what you want explained.","text"],["style","How should Zenvyra explain it?","Choose the explanation style.","options",["Simple & Clear","Step by Step","With Examples","Exam Focused"]]],export:[]},
{id:"study-planner",icon:"📅",title:"Study Planner",desc:"Build a practical plan around your subjects and available time.",steps:[["subjects","Which subjects do you need to study?","List subjects separated by commas.","text"],["days","How many days?","Choose your planning window.","select",["3","5","7","14","30"]],["hours","How much time per day?","Approximate study time.","select",["30 minutes","1 hour","2 hours","3 hours","4+ hours"]],["priority","What is your priority?","Choose the main goal.","options",["Exam Preparation","Homework","Revision","Balanced Study"]]],export:["pdf","docx"]},
{id:"revision-mode",icon:"🔁",title:"Revision Mode",desc:"Turn a topic into an active revision session.",steps:[["class","Class","Choose your level.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Subject","Choose a subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies"]],["topic","Topic","What should we revise?","text"],["mode","Revision style","Choose how you want to practice.","options",["Quick Recall","Teach Me Then Test Me","Exam Drill","Mixed Practice"]]],export:[]},
{id:"writing-coach",icon:"✍️",title:"Writing & Grammar Coach",desc:"Improve writing, grammar, clarity and structure.",steps:[["task","What do you want to improve?","Choose the writing task.","options",["Grammar Correction","Essay","Paragraph","Email/Letter","Creative Writing"]],["text","Your writing","Paste or type your writing.","textarea"],["goal","Main goal","What should Zenvyra focus on?","options",["Grammar","Clarity","Vocabulary","Structure","Everything"]]],export:[]},
{id:"speaking-practice",icon:"🗣️",title:"English Speaking Practice",desc:"Practice realistic conversations and receive feedback.",steps:[["scenario","Scenario","Choose a conversation setting.","options",["Daily Conversation","Ordering Food","Job Interview","School Presentation","Travel"]],["level","Your level","Choose your speaking level.","options",["Beginner","Intermediate","Advanced"]],["response","Your response","Type what you would say, or use voice input.","textarea"]],export:[]},
{id:"mistake-analyzer",icon:"🔍",title:"Mistake Analyzer",desc:"Understand mistakes and learn the correct method.",steps:[["subject","Subject","Choose a subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu"]],["question","Question","Enter the original question.","textarea"],["answer","Your answer","Enter your answer.","textarea"],["correct","Correct answer","If known, enter the correct answer.","textarea"]],export:["pdf","docx"]},
{id:"homework-reminders",icon:"⏰",title:"Homework & Exam Reminders",desc:"Turn tasks and dates into an organized action plan.",steps:[["tasks","Your tasks","List homework and exams with dates.","textarea"],["time","Available time","How much time can you use each day?","options",["30 minutes","1 hour","2 hours","3+ hours"]]],export:["pdf","docx"]},
{id:"presentation",icon:"📊",title:"Presentation Maker",desc:"Create a classroom-ready presentation with real PPTX export.",steps:[["class","Class","Choose the class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Subject","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies","General Knowledge"]],["topic","Topic","What should the presentation teach?","text"],["slides","Number of slides","Choose the slide count.","select",["5","7","10","12","15"]],["style","Presentation style","Choose the visual/content approach.","options",["Clean Academic","Interactive Classroom","Exam Review","Storytelling"]]],export:["pptx"]}];

const TEACHER_TOOLS=[
{id:"question-paper",icon:"📋",title:"Question Paper Maker",desc:"Build a balanced exam with marks, duration and difficulty.",steps:[["class","Class","Choose the class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Subject","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies","General Knowledge"]],["topic","Chapter / topic","What content should be assessed?","text"],["marks","Total marks","Set the total marks.","select",["20","30","40","50","75","100"]],["duration","Exam duration","Choose the exam time.","select",["30 minutes","45 minutes","60 minutes","90 minutes","120 minutes","180 minutes"]],["types","Question types","Select the mix.","options",["MCQ + Short","MCQ + Short + Long","Short + Long","Mixed"]],["difficulty","Difficulty","Choose the difficulty.","options",["Easy","Medium","Hard","Mixed"]]],export:["pdf","docx"]},
{id:"worksheet",icon:"📑",title:"Worksheet Maker",desc:"Create printable practice material for your class.",steps:[["class","Class","Choose the class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Subject","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies"]],["topic","Topic","Enter the topic.","text"],["difficulty","Difficulty","Choose the challenge level.","options",["Easy","Medium","Hard","Mixed"]],["count","Number of questions","Choose the number.","select",["5","10","15","20","25","30"]],["type","Question type","Choose the format.","options",["MCQ","Short Answer","Long Answer","True-False","Mixed"]]],export:["pdf","docx"]},
{id:"lesson-plan",icon:"🗂️",title:"Lesson Plan Generator",desc:"Plan objectives, instruction, activities and assessment.",steps:[["class","Class","Choose the class.","select",["Nursery","KG","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Subject","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies","General Knowledge"]],["topic","Topic","Enter the lesson topic.","text"],["duration","Duration","Choose the lesson duration.","select",["30 minutes","40 minutes","45 minutes","60 minutes","90 minutes"]],["objectives","Learning objectives","What should students be able to do?","textarea"],["approach","Teaching approach","Choose the teaching approach.","options",["Direct Instruction","Inquiry Based","Collaborative","Activity Based","Mixed"]]],export:["pdf","docx"]},
{id:"answer-checker",icon:"✅",title:"AI Answer Checker",desc:"Evaluate a student's answer and explain what to improve.",steps:[["question","Question","Enter the question.","textarea"],["correct","Expected answer","Enter the model/correct answer.","textarea"],["student","Student answer","Paste the student's answer.","textarea"]],export:[]},
{id:"class-performance",icon:"📊",title:"Class Performance Analyzer",desc:"Turn scores into class-level insights and priorities.",steps:[["scores","Class scores","Paste names and scores, one per line.","textarea"],["assessment","Assessment","What test or assessment was this?","text"],["goal","Analysis goal","Choose what you need.","options",["Identify Weak Areas","Plan Remediation","Compare Performance","Full Analysis"]]],export:["pdf","docx"]},
{id:"weak-topic-finder",icon:"🎯",title:"Weak Topic Finder",desc:"Identify topics students struggle with from evidence.",steps:[["subject","Subject","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies"]],["evidence","Evidence","Describe results, mistakes or common errors.","textarea"],["action","Next action","What should the AI prioritize?","options",["Topics Only","Topics + Reasons","Topics + Remediation"]]],export:["pdf","docx"]},
{id:"report-card-picture",icon:"🖼️",title:"Report Card — Picture",desc:"Upload a report card image and receive a careful AI analysis.",steps:[["photo","Upload report card","Choose a clear PNG, JPG or WEBP image.","file"],["name","Student name","Enter the student's name.","text"],["focus","What should we focus on?","Optional: performance, strengths, weaknesses or recommendations.","textarea"]],export:["pdf","docx"]},
{id:"student-progress",icon:"📈",title:"Student Progress",desc:"Summarize one student's progress over time.",steps:[["name","Student name","Enter the student name.","text"],["class","Class","Choose the class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["notes","Progress evidence","Scores, observations, attendance, strengths and concerns.","textarea"],["focus","Focus","Choose the report focus.","options",["Academic Progress","Support Plan","Parent Summary","Full Progress Review"]]],export:["pdf","docx"]},
{id:"homework-creator",icon:"🏠",title:"Homework Creator",desc:"Create meaningful homework matched to class and topic.",steps:[["class","Class","Choose the class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Subject","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies"]],["topic","Topic","Enter the homework topic.","text"],["difficulty","Difficulty","Choose the challenge.","options",["Easy","Medium","Hard","Mixed"]],["count","Number of tasks","How many tasks?","select",["5","10","15","20"]]],export:["pdf","docx"]},
{id:"student-report",icon:"📄",title:"Student Report Generator",desc:"Create a formal, teacher-ready student report.",steps:[["name","Student name","Enter the student name.","text"],["class","Class","Choose the class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["details","Student details","Performance, attendance, behavior, strengths and weaknesses.","textarea"],["tone","Report style","Choose the tone.","options",["Formal","Supportive","Parent Friendly","Detailed"]]],export:["pdf","docx"]},
{id:"class-activity",icon:"🎨",title:"Class Activity Generator",desc:"Design an engaging activity with objectives and materials.",steps:[["class","Class","Choose the class.","select",["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]],["subject","Subject","Choose the subject.","select",["Mathematics","English","Science","Computer","Sindhi","Urdu","Social Studies"]],["topic","Topic","Enter the topic.","text"],["duration","Duration","How long is the activity?","select",["10 minutes","20 minutes","30 minutes","45 minutes","60 minutes"]],["style","Activity style","Choose the format.","options",["Individual","Pairs","Groups","Whole Class","Mixed"]]],export:["pdf","docx"]}];

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
    return escapeHtml(text)
        .replace(/^### (.*)$/gm,"<h4>$1</h4>")
        .replace(/^## (.*)$/gm,"<h3>$1</h3>")
        .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
        .replace(/^\s*[-*]\s+(.*)$/gm,"<li>$1</li>")
        .replace(/\n/g,"<br>");
}

function profile(){
    try{return JSON.parse(localStorage.getItem(USER_PROFILE_KEY)||"null")}
    catch{return null}
}

function saveProfile(p){
    localStorage.setItem(USER_PROFILE_KEY,JSON.stringify(p));
}

function setAuthMessage(msg,error=true){
    $("welcome-message").textContent=msg;
    $("welcome-message").className=error?"auth-message":"auth-message success";
}

function renderToolCards(){
    const make=(t)=>`<article class="tool-card"><div class="tool-icon">${t.icon}</div><h3>${t.title}</h3><p>${t.desc}</p><button data-open-tool="${t.id}">Open guided workflow →</button></article>`;

    $("studentToolsGrid").innerHTML=STUDENT_TOOLS.map(make).join("");
    $("teacherToolsGrid").innerHTML=TEACHER_TOOLS.map(make).join("");

    document.querySelectorAll("[data-open-tool]").forEach(b=>{
        b.onclick=()=>openWizard(b.dataset.openTool);
    });

    document.querySelectorAll("nav [data-tool]").forEach(b=>{
        b.onclick=()=>openWizard(b.dataset.tool);
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

let wizardIndex=0;

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
        control=`<input id="wizardInput" type="file" accept="${currentTool.id==="photo-solver"?"image/png,image/jpeg,image/webp":".pdf,.docx,.txt"}"><div id="fileMeta" class="file-meta"></div>`;
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

    if(!value){
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
            if(!file)throw Error("Please upload a report card image.");

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
                    prompt:`Analyze this student report card carefully. Student name: ${currentAnswers.name||"Not provided"}. Focus: ${currentAnswers.focus||"overall performance, strengths, weaknesses and practical recommendations"}. Do not invent information that is not visible.`
                })
            });

            const d=await r.json();

            if(!d.success)throw Error(d.message||"Report card analysis failed.");

            result={
                title:"Report Card Analysis",
                subtitle:file.name,
                sections:[{
                    heading:"Zenvyra's Analysis",
                    items:[d.data.reply]
                }]
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
    $("resultContent").innerHTML=
        `<div class="result-body">
        <span class="eyebrow">YOUR RESULT</span>
        <h2>${escapeHtml(result.title||currentTool.title)}</h2>
        <p class="subtitle">${escapeHtml(result.subtitle||"Generated by Zenvyra AI")}</p>
        ${(result.sections||[]).map(s=>
            `<section class="result-section">
            <h4>${escapeHtml(s.heading||"Section")}</h4>
            ${(s.items||[]).map(i=>
                `<div class="result-text">${renderMarkdown(i)}</div>`
            ).join("")}
            </section>`
        ).join("")}
        </div>`;

    $("resultModal").hidden=false;
    $("downloadMenu").hidden=true;
    $("exportStatus").textContent="";

    const allowed=currentTool.export||[];

    document.querySelectorAll("#downloadMenu [data-format]").forEach(b=>{
        b.style.display=allowed.includes(b.dataset.format)?"block":"none";
    });

    $("downloadBtn").style.display=allowed.length?"":"none";
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
console.log("🔥 NEW ASKCHAT RUNNING:", message);
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

function renderHistory(){
    const list=$("leftSidebarHistory");

    if(!list)return;

    const ss=sessions();

    list.innerHTML=ss.map(s=>
        `<button class="sidebar-history-item ${activeSession?.id===s.id?"active":""}" data-session="${s.id}">
        🕘 ${escapeHtml(s.title)}
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
        };
    });
}

function renderChat(){
    const box=$("ai-response");
    const hist=$("chat-history");

    if(!box||!hist)return;

    if(!activeSession||!activeSession.messages.length){
        box.classList.remove("show");
        box.innerHTML="";
        hist.innerHTML="";
        return;
    }

    const last=activeSession.messages.at(-1);

    box.innerHTML=
        `<strong>👤 You:</strong> ${escapeHtml(last.q)}
        <br><br>
        <strong>✨ Zenvyra:</strong>
        <div>${renderMarkdown(last.a)}</div>`;

    box.classList.add("show");

    hist.innerHTML=activeSession.messages
        .slice(0,-1)
        .reverse()
        .map(m=>
            `<div class="history-item">
            <strong>${escapeHtml(m.q)}</strong>
            <div>${renderMarkdown(m.a)}</div>
            </div>`
        ).join("");

    renderHistory();
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
};

$("historyToolBtn").onclick=()=>{
    renderHistory();

    const sidebar=$("sidebar");
    const overlay=$("sidebarOverlay");
    const historyTitle=$("sidebarHistoryTitle");
    const historyList=$("leftSidebarHistory");

    if(sidebar){
        sidebar.classList.add("open");
    }

    if(overlay&&window.innerWidth<=800){
        overlay.classList.add("show");
    }

    if(historyTitle){
        historyTitle.style.display="block";
    }

    if(historyList){
        historyList.style.display="block";

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

    if($("profileName")){
        $("profileName").textContent=p?.name||"User";
    }

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

    $("settingsModal").hidden=true;

    const shell=document.querySelector(".shell");

    if(shell){
        shell.style.display="none";
    }

    $("loginScreen").hidden=false;
    setLoginMode("login");
}

$("studentToolsBtn").onclick=showStudentTools;
$("teacherToolsBtn").onclick=showTeacherTools;

$("hamburgerBtn").onclick=()=>{
    $("sidebar").classList.add("open");
    $("sidebarOverlay").classList.add("show");
};

$("sidebarCloseBtn").onclick=()=>{
    $("sidebar").classList.remove("open");
    $("sidebarOverlay").classList.remove("show");
};

$("sidebarOverlay").onclick=()=>{
    $("sidebar").classList.remove("open");
    $("sidebarOverlay").classList.remove("show");
};

$("settingsBtn").onclick=()=>{
    const p=profile()||{};

    $("settingsName").value=p.name||"";
    $("settingsProfilePicture").src=
        localStorage.getItem("zenvyra_profile_picture")||"logo.png";

    $("settingsModal").hidden=false;
};

$("closeSettingsModal").onclick=()=>{
    $("settingsModal").hidden=true;
};

$("aboutZenvyraBtn").onclick=()=>{
    $("aboutModal").hidden=false;
};

$("closeAboutModal").onclick=()=>{
    $("aboutModal").hidden=true;
};

$("saveSettingsBtn").onclick=()=>{
    const p=profile()||{};

    p.name=$("settingsName").value.trim()||p.name;

    saveProfile(p);

    $("profileName").textContent=p.name||"User";
    $("topbarGreeting").textContent=`Welcome back, ${p.name||"User"}! 👋`;

    $("settingsSavedMsg").textContent="✓ Settings saved";

    setTimeout(()=>{
        $("settingsSavedMsg").textContent="";
    },1800);
};

document.querySelectorAll(".swatches button").forEach(b=>{
    b.onclick=()=>{
        const accent=b.dataset.accent;

        document.documentElement.style.setProperty("--mint",accent);
        localStorage.setItem("zenvyra_accent",accent);

        document.querySelectorAll(".swatches button").forEach(x=>{
            x.classList.toggle("active",x===b);
        });
    };
});

$("clearHistoryBtn").onclick=()=>{
    localStorage.removeItem(CHAT_SESSIONS_KEY);
    activeSession=null;

    renderHistory();
    renderChat();

    $("settingsSavedMsg").textContent="✓ Chat history cleared";

    setTimeout(()=>{
        $("settingsSavedMsg").textContent="";
    },1800);
};

$("logoutBtn").onclick=()=>{
    if(confirm("Log out of Zenvyra AI?")){
        logOut();
    }
};

$("changeProfilePictureBtn").onclick=()=>{
    $("profilePictureInput").click();
};

$("profilePictureInput").onchange=()=>{
    const f=$("profilePictureInput").files[0];

    if(!f)return;

    const r=new FileReader();

    r.onload=()=>{
        localStorage.setItem("zenvyra_profile_picture",r.result);

        $("settingsProfilePicture").src=r.result;

        if($("profilePicture")){
            $("profilePicture").src=r.result;
        }
    };

    r.readAsDataURL(f);
};

$("removeProfilePictureBtn").onclick=()=>{
    localStorage.removeItem("zenvyra_profile_picture");

    $("settingsProfilePicture").src="logo.png";

    if($("profilePicture")){
        $("profilePicture").src="logo.png";
    }
};

document.querySelectorAll(".modal").forEach(m=>{
    m.addEventListener("click",e=>{
        if(e.target===m&&!generating){
            m.hidden=true;
        }
    });
});

const accent=localStorage.getItem("zenvyra_accent");

if(accent){
    document.documentElement.style.setProperty("--mint",accent);
}

renderToolCards();
renderHistory();
restore();