export interface EvalResult { score:number; passed:boolean; issues:string[]; summary:string; }
export function evaluateOutput(text:string,requirements:string):EvalResult{
 const issues:string[]=[]; if(text.length<20) issues.push('Output is too short'); if(requirements && !text.toLowerCase().includes(requirements.toLowerCase().split(/\s+/)[0])) issues.push('May not fully reflect the stated requirements');
 const score=Math.max(0,Math.min(100,90-issues.length*25)); return {score,passed:score>=75,issues,summary:issues.length?'Needs revision':'Meets baseline quality'};
}
