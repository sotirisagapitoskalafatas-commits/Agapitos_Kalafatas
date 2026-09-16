import { Opportunity, Score, StrategyName } from './types.js';
export function scoreOpportunity(o:Opportunity,strategy:StrategyName):Score{
  const budget=o.budget; const skillFit=Math.max(0,1-(o.difficulty/10));
  const competitionPenalty=Math.min(.45,o.competition*.5); const rating=o.clientRating/5;
  const win=Math.max(.03,Math.min(.95,.25 + skillFit*.45 + rating*.2 - competitionPenalty + (strategy==='AGGRESSIVE'?0.05:0)));
  const exec=Math.max(.15,1-o.difficulty*.06);
  const cost=Math.max(.5,o.estimatedHours*0.8 + budget*(o.platformFeePct/100));
  const profit=budget-cost; const hourly=profit/Math.max(.25,o.estimatedHours);
  const capitalRisk=Math.min(1,cost/Math.max(1,budget)); const customerQuality=.5*rating+.5*(1-Math.min(1,o.competition));
  const repeat=Math.max(.05,Math.min(.9,.25+rating*.35+(o.competition<.4?.15:0)));
  const expectedProfit=win*exec*profit-cost*.1;
  const overall=Math.max(0,Math.min(100,expectedProfit*2.4 + win*25 + exec*15 + repeat*10 + customerQuality*10 - capitalRisk*10));
  return {winProbability:+win.toFixed(3),executionProbability:+exec.toFixed(3),expectedRevenue:+(win*exec*budget).toFixed(2),expectedCost:+cost.toFixed(2),expectedProfit:+expectedProfit.toFixed(2),expectedHourlyProfit:+hourly.toFixed(2),capitalRisk:+capitalRisk.toFixed(3),customerQuality:+customerQuality.toFixed(3),repeatProbability:+repeat.toFixed(3),overall:+overall.toFixed(2),confidence:.65,evidence:[`Budget €${budget}`,`${o.estimatedHours}h estimate`,`Client rating ${o.clientRating}/5`,`Competition ${(o.competition*100).toFixed(0)}%`]};
}
