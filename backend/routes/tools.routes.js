const express=require("express");
const router=express.Router();
const ai=require("../services/ai.service");
const {requireAuth}=require("../middleware/requireAuth");
const {usageLimit}=require("../middleware/usageLimit");
const {success,fail,aiFailure}=require("../utils/apiResponse");

const TOOL_INSTRUCTIONS={
"quiz-generator":"Create a complete quiz. Include numbered questions, answer choices when appropriate, and an answer key. Respect the requested count, type and difficulty.",
"notes-maker":"Create clear study notes with headings, definitions, key points, examples, common mistakes and a short revision recap. Match the requested class.",
"lesson-explainer":"Explain the lesson at the requested class level. Use simple language, step-by-step reasoning, examples and a short check-for-understanding section.",
"study-planner":"Create a realistic day-by-day study plan using the available time and priorities. Include subjects, sessions, breaks and practical goals.",
"report-card":"Write a professional student report using only the supplied evidence. Do not invent marks or behavior. Separate strengths, areas for improvement and next steps.",
"revision-mode":"Create an active revision session for the topic. Include recall prompts, explanations, practice questions and a final self-check.",
"writing-coach":"Review the supplied writing. Provide corrected text plus concise explanations and actionable improvement points.",
"speaking-practice":"Create a speaking practice response and feedback appropriate to the scenario and level. Include a better natural version and useful phrases.",
"mistake-analyzer":"Analyze the student's mistake carefully. Compare the original question, student's answer, and correct answer. Explain exactly where the student's reasoning went wrong. Then give the correct solution step by step in simple language suitable for the student's class. Clearly identify the misconception or misunderstanding. Finish with one similar practice question for the student. Do not invent information and do not assume an answer when the supplied correct answer is missing.",
"homework-reminders":"Turn the supplied tasks into a prioritized, realistic schedule. Preserve dates supplied by the user and do not invent exact dates.",
"presentation":"Create a classroom presentation. IMPORTANT: return exactly the requested number of sections, one section per slide. Each section heading is the slide title and its items are concise slide bullets. Match the requested slide count and style.",
"question-paper":"Create a balanced exam paper. Respect total marks, duration, question types and difficulty. Show marks for questions and include a separate answer key/marking guidance.",
"worksheet":"Create a printable practice worksheet with the requested number and types of questions, followed by an answer key.",
"lesson-plan":"Create a professional lesson plan with objectives, materials, teaching sequence, activities, differentiation, assessment and closure. Respect the duration.",
"answer-checker":"Evaluate the student's answer against the expected answer. State correctness, reasoning, missing points and an improved answer without inventing facts.",
"class-performance":"Analyze the supplied scores. Calculate/describe patterns only from the evidence, identify strengths and weak areas, and suggest targeted interventions.",
"weak-topic-finder":"Identify likely weak topics from the evidence. Rank them, explain the evidence, and suggest remediation activities.",
"student-progress":"Write a factual progress review from the supplied evidence. Separate observed progress, strengths, concerns and recommended next steps.",
"homework-creator":"Create meaningful homework matched to class, subject, topic, difficulty and requested task count. Include clear instructions and an answer key when appropriate.",
"student-report":"Create a formal student report from the supplied evidence. Do not fabricate grades, attendance or behavior. Include strengths, concerns and an actionable support plan.",
"class-activity":"Design an engaging classroom activity with objective, materials, setup, steps, differentiation, timing and assessment."
};

function cleanResult(raw,toolTitle){
  if(!raw||typeof raw!=="object") throw new Error("Invalid AI result");
  const sections=Array.isArray(raw.sections)?raw.sections.map(s=>({
    heading:String(s.heading||"Section"),
    items:Array.isArray(s.items)?s.items.map(x=>String(x)): [String(s.items||"")].filter(Boolean)
  })).filter(s=>s.items.length):[];
  if(!sections.length&&raw.text)sections.push({heading:"Result",items:[String(raw.text)]});
  return {title:String(raw.title||toolTitle),subtitle:String(raw.subtitle||"Created by Zenvyra AI"),sections};
}

router.post("/generate",requireAuth,usageLimit("messages"),async(req,res)=>{
  try{
    const {toolId,toolTitle,answers}=req.body||{};
    if(!toolId||!toolTitle||!answers)return fail(res,"Tool details are required.",400);
    const instruction=TOOL_INSTRUCTIONS[toolId];
    if(!instruction)return fail(res,"This tool is not configured.",400);
    const answerText=Object.entries(answers).map(([k,v])=>`${k}: ${String(v)}`).join("\n");
    const system=`You are Zenvyra AI, a professional education assistant.

IDENTITY:
If the user asks who created you, who made you, who your creator is, or who your founder is, say:
"I’m Zenvyra AI, created by Mairaj Ali — Founder & CEO of Zenvyra AI.
I was built with one simple vision: to make learning smarter, simpler, and more enjoyable for everyone."

Do not say that Google created you.
Do not say that OpenAI created you.
Do not say that another AI company created Zenvyra AI.

${instruction}
Return ONLY valid JSON with this exact shape:
{"title":"string","subtitle":"string","sections":[{"heading":"string","items":["string"]}]}
Use concise but complete content. Do not use markdown fences.`;
    const message=`Tool: ${toolTitle}\nUser requirements:\n${answerText}`;
    const parsed=await ai.chatJson({system,message});
    return success(res,cleanResult(parsed,toolTitle));
  }catch(err){console.error("tool generation error:",err.message);return aiFailure(res,err)}
});

router.post("/export",requireAuth,async(req,res)=>{
 try{
  const {format,result,toolId}=req.body||{};
  if(!["pdf","docx","pptx"].includes(format))return fail(res,"Unsupported export format.",400);
  if(!result||!Array.isArray(result.sections))return fail(res,"There is no generated content to export.",400);
  const safeTitle=String(result.title||"Zenvyra Output").replace(/[^\w\s-]/g,"").trim().slice(0,80)||"Zenvyra Output";
  if(format==="pdf")return makePdf(res,result,safeTitle);
  if(format==="docx")return makeDocx(res,result,safeTitle);
  return makePptx(res,result,safeTitle,toolId);
 }catch(err){console.error("export error:",err);return fail(res,"The file could not be created. Please try again.",500)}
});

function makePdf(res,result,title){
 const PDFDocument=require("pdfkit");
 const doc=new PDFDocument({margin:50,size:"A4"});
 res.status(200).set({"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${title}.pdf"`});
 doc.pipe(res);
 doc.fontSize(22).fillColor("#123b3a").text(result.title||title,{bold:true});
 if(result.subtitle)doc.moveDown(.4).fontSize(10).fillColor("#52736d").text(result.subtitle);
 result.sections.forEach(s=>{doc.moveDown(1).fontSize(15).fillColor("#2f8f83").text(s.heading);s.items.forEach(item=>{doc.moveDown(.35).fontSize(11).fillColor("#173f3a").text("• "+strip(item),{lineGap:3})})});
 doc.end();
}
async function makeDocx(res,result,title){
 const {Document,Packer,Paragraph,HeadingLevel}=require("docx");
 const children=[new Paragraph({text:result.title||title,heading:HeadingLevel.TITLE})];
 if(result.subtitle)children.push(new Paragraph({text:result.subtitle}));
 result.sections.forEach(s=>{children.push(new Paragraph({text:s.heading,heading:HeadingLevel.HEADING_1}));s.items.forEach(item=>children.push(new Paragraph({text:strip(item),bullet:{level:0}})))});
 const doc=new Document({sections:[{properties:{},children}]});
 const buffer=await Packer.toBuffer(doc);
 res.status(200).set({"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":`attachment; filename="${title}.docx"`}).send(buffer);
}
async function makePptx(res,result,title){
 const pptxgen=require("pptxgenjs");const pptx=new pptxgen();pptx.layout="LAYOUT_WIDE";pptx.author="Zenvyra AI";pptx.subject=result.subtitle||"Education content";pptx.title=result.title||title;
 let first=true;
 for(const s of result.sections){
  const slide=pptx.addSlide();slide.background={color:"F5FFFB"};slide.addText(first?(result.title||title):s.heading,{x:.65,y:.45,w:11.5,h:.6,fontSize:first?27:23,bold:true,color:"123B3A"});first=false;
  if(result.subtitle&&!s.items?.length)slide.addText(result.subtitle,{x:.7,y:1.2,w:11,h:.4,fontSize:13,color:"52736D"});
  const lines=s.items.map(x=>"• "+strip(x)).join("\n\n");slide.addText(lines,{x:.8,y:1.35,w:11,h:5.2,fontSize:18,color:"173F3A",breakLine:false,fit:"shrink"});
 }
 if(!result.sections.length){const slide=pptx.addSlide();slide.addText(result.title||title,{x:1,y:2,w:11,h:1,fontSize:30,bold:true,color:"123B3A"})}
 const buffer=await pptx.write({outputType:"nodebuffer"});
 res.status(200).set({"Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation","Content-Disposition":`attachment; filename="${title}.pptx"`}).send(buffer);
}
function strip(s){return String(s).replace(/\*\*(.*?)\*\*/g,"$1").replace(/^#+\s*/,"").trim()}
module.exports=router;
