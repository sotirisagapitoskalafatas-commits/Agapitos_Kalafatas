import OpenAI from 'openai';
import { AgentContext } from './types.js';

export interface LLMProvider { generate(ctx:AgentContext,prompt:string):Promise<{text:string;cost?:number;model:string}>; }

export class OpenAIProvider implements LLMProvider {
 private client:OpenAI; constructor(private model=process.env.OPENAI_WORKER_MODEL||'gpt-5.6-luna'){this.client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});}
 async generate(ctx:AgentContext,prompt:string){
  const response=await this.client.responses.create({model:this.model,instructions:baseInstructions(ctx),input:prompt,tools:[{type:'web_search_preview'}]});
  return {text:response.output_text||'',model:this.model};
 }
}
function baseInstructions(ctx:AgentContext){return `You are ${ctx.role} in AI Freelance Survivor. Objective: ${ctx.objective}. State: ${ctx.currentState}. Wallet: EUR ${ctx.wallet.balance}. Strategy: ${ctx.strategy}. Never fabricate experience, bypass security, spam, or take irreversible actions without policy approval. Provide concise action summaries, not hidden chain-of-thought.`;}

export class MockLLM implements LLMProvider { async generate(ctx:AgentContext,prompt:string){return {text:`Simulated ${ctx.role} decision for: ${prompt}`,model:'mock'};} }
