import { Store } from './store.js';
export function seedSimulation(store:Store){
 const jobs=[
  ['o1','Spreadsheet cleanup','Clean and format a messy customer spreadsheet and remove duplicate rows.',30,1.2,0.3,4.7,0.25],
  ['o2','Landing page fix','Fix layout issues and improve the CTA on a small business landing page.',55,2.5,0.45,4.6,0.35],
  ['o3','AI chatbot setup','Configure a simple FAQ chatbot and document setup for a company website.',150,6,0.55,4.8,0.55],
  ['o4','Product descriptions','Write 20 concise product descriptions for an ecommerce store.',40,2,0.5,4.4,0.4],
  ['o5','Website bug fix','Fix a mobile responsiveness bug in an existing site.',70,3,0.4,4.5,0.3]
 ] as const;
 for(const [id,title,description,budget,hrs,diff,rating,competition] of jobs) store.addOpportunity({id,source:'SIMULATED_MARKET',title,description,budget,currency:'EUR',estimatedHours:hrs,skills:['communication','problem-solving'],clientName:`Client ${id.toUpperCase()}`,clientRating:rating,competition,deadlineHours:72,platformFeePct:10,difficulty:diff*10});
}
