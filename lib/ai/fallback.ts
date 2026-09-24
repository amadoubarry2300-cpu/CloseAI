import type { AIResponse, ConversationInput, ProspectAnalysis } from "./types";

export function analyzeLocally(text: string): ProspectAnalysis {
  const t=text.toLowerCase();
  const objection = /trop cher|prix|budget|argent/.test(t)?"Prix":/réfléchir|reflechir/.test(t)?"Besoin de réfléchir":/fiable|confiance|arnaque/.test(t)?"Confiance":/comparer|comparaison/.test(t)?"Comparaison":/plus tard|reviendrai|pas maintenant/.test(t)?"Timing":null;
  const purchase=/acheter|paiement|commander|intéress|interess|offre|prix/.test(t);
  const high=/je veux|comment payer|lien|commander|intéress/.test(t);
  const negative=/cher|problème|probleme|déçu|decu|arnaque/.test(t);
  let score=purchase?68:38;if(high)score+=16;if(objection)score+=5;if(/urgent|aujourd'hui|maintenant/.test(t))score+=7;
  score=Math.max(0,Math.min(100,score));
  return {intent:purchase?"purchase":"information",interest:score>=81?"very_hot":score>=61?"hot":score>=31?"interested":"cold",objection,sentiment:negative?"negative":purchase?"positive":"neutral",urgency:/urgent|maintenant|aujourd'hui/.test(t)?"high":"medium",product:null,budget:(text.match(/\b\d+[\s.,]?\d*\s?(?:€|eur|f?cfa|xof|usd|\$)\b/i)||[])[0]||null,score,nextAction:objection?`Répondre avec empathie à l’objection « ${objection} » en restant factuel.`:"Clarifier le besoin avec une question simple.",requiresHuman:false};
}
export function fallbackResponse(input:ConversationInput):AIResponse{
 const last=input.messages.at(-1)?.content||"";const a=analyzeLocally(last);const name=input.contact?.split(" ")[0];const hello=name?`${name}, `:"";const product=input.product;let response="";
 if(a.objection==="Prix") response=`Je comprends, ${hello}le budget est un point important. ${product?.name?`Pour vérifier si ${product.name} est vraiment pertinent pour vous, `:""}combien de conversations WhatsApp gérez-vous environ chaque semaine ? Je pourrai ainsi vous répondre de façon concrète, sans vous pousser vers une offre qui ne vous conviendrait pas.`;
 else if(a.objection==="Confiance") response=`Votre prudence est tout à fait légitime. Je peux vous partager uniquement les garanties et éléments vérifiables dont nous disposons. Quel point souhaitez-vous vérifier en priorité ?`;
 else if(a.objection==="Besoin de réfléchir") response=`Bien sûr, prenez le temps nécessaire. Pour vous aider à réfléchir utilement, quel est le principal point qui vous fait encore hésiter ?`;
 else if(a.objection==="Comparaison") response=`C’est une bonne démarche de comparer. Je peux vous aider avec des critères factuels : fonctionnalités, accompagnement, limites et prix. Qu’est-ce qui compte le plus pour vous ?`;
 else response=`Merci pour votre message. Pour vous orienter précisément${product?.name?` au sujet de ${product.name}`:""}, quel résultat souhaitez-vous obtenir en priorité ?`;
 if(input.length==="courte")response=response.split(". ").slice(0,2).join(". ");
 return {response,analysis:a,provider:"safe-fallback",grounded:Boolean(product||input.knowledge?.length)};
}
