import {calculate,aspects,placement,degree} from './astro';
type Chart=ReturnType<typeof calculate>;
import {houseNumber,houseTopics} from './interpretation';
type Focus='self-understanding'|'relationships'|'work';
const themes:Record<string,[string,string]>={
 'Sun/Moon':['direction / restoration','An outward choice and an inward need can ask for different kinds of care.'],
 'Sun/Saturn':['expression / accountability','Giving yourself permission and keeping a promise are distinct tasks.'],
 'Sun/Mercury':['direction / language','Explaining a choice and making a choice are separate tasks. A clear explanation can express your direction without requiring everyone to endorse it.'],
 'Sun/Venus':['expression / values','Being appreciated and acting in line with your values can coincide, but approval is not the only measure of an honest choice.'],
 'Sun/Jupiter':['direction / possibility','A larger possibility needs a direction you can choose now. Compare what would make the step meaningful with what would merely make it impressive.'],
 'Moon/Mercury':['feeling / explanation','Describing a feeling does not have to settle its meaning immediately. Name the need before building an explanation for why you should have it.'],
 'Mercury/Venus':['language / connection','A considerate message can still carry a clear disagreement. Kindness need not require a hint, and clarity need not require harshness.'],
 'Sun/Mars':['purpose / action','Acting quickly can express a purpose, but the purpose still deserves to be named.'],
 'Sun/Neptune':['direction / imagination','An inspiring image of who you could become needs an ordinary, observable next step.'],
 'Moon/Saturn':['comfort / responsibility','A practical duty may support safety while leaving a need for tenderness unanswered.'],
 'Moon/Venus':['restoration / connection','What makes a relationship pleasant may differ from what makes you feel emotionally restored.'],
 'Moon/Mars':['comfort / assertion','Protecting a feeling and making a request are separate moves; an urgent response need not decide the whole conversation.'],
 'Mercury/Saturn':['language / standards','Precision can make a request reliable; demanding certainty before speaking can also leave a useful thought unspoken.'],
 'Mercury/Mars':['attention / assertion','Making a point and winning a point are different aims. Decide which one this conversation needs.'],
 'Mercury/Neptune':['language / imagination','An image or intuition can start a thought; a concrete example lets another person check what you mean.'],
 'Mercury/Jupiter':['detail / perspective','A broad explanation needs a testable detail, while a detail needs enough context to be understood.'],
 'Venus/Mars':['values / desire','Wanting something and valuing it are related questions, not interchangeable answers.'],
 'Venus/Saturn':['connection / commitment','Reliability can express care; a commitment also needs room for warmth and freely chosen consent.'],
 'Venus/Pluto':['connection / power','Being deeply invested does not remove either person’s right to privacy, refusal or a changing preference.'],
 'Sun/Uranus':['expression / autonomy','A role can express your direction without defining all of you. Test whether changing the role serves a value or only offers an escape from being seen.'],
 'Sun/Pluto':['visibility / influence','Being recognized and being able to influence an outcome are different needs. Make space for a choice that remains valid even when others disagree.'],
 'Moon/Jupiter':['restoration / possibility','An encouraging story can bring perspective without answering an immediate need for rest, reassurance or care.'],
 'Moon/Uranus':['comfort / change','A familiar routine may provide care while a change provides breathing room. Choose one part to keep stable while experimenting with another.'],
 'Moon/Neptune':['comfort / imagination','A feeling deserves attention without being treated as certain knowledge about another person. Separate what you felt from what you observed.'],
 'Moon/Pluto':['security / influence','Wanting reassurance does not require controlling another person’s response. Name the care you need and the choice that remains theirs.'],
 'Mercury/Uranus':['clarity / novelty','An unexpected idea becomes shareable when you slow down enough to show the steps. Invite a question before assuming resistance.'],
 'Mercury/Pluto':['attention / depth','Looking beneath an explanation can be useful, but an unanswered question is not evidence of a hidden motive. Distinguish inquiry from accusation.'],
 'Venus/Jupiter':['values / possibility','Generosity needs a clear sense of what you can freely offer. An attractive possibility can be considered without becoming a promise.'],
 'Venus/Uranus':['connection / autonomy','Closeness and freedom need explicit agreements rather than a test of how much distance a relationship can tolerate.'],
 'Venus/Neptune':['affection / idealization','Appreciating someone and imagining their potential are different forms of attention. Base a current agreement on what each person actually offers.'],
 'Mars/Jupiter':['initiative / confidence','Confidence can start an action; it cannot substitute for checking its scope, cost and effect on other people.'],
 'Mars/Uranus':['initiative / change','A quick change may create space while leaving practical consequences unresolved. Try a reversible action before a larger commitment.'],
 'Mars/Neptune':['action / meaning','A meaningful aim needs a concrete action whose result you can observe. Rest and uncertainty can be named without turning them into a failure of will.'],
 'Mars/Pluto':['pursuit / influence','Determination can sustain a difficult task; pushing harder is not the only way to protect an important aim. Clarify where your action ends and another person’s choice begins.'],
 'Jupiter/Saturn':['possibility / limits','An ambitious possibility and a realistic limit can improve the same plan. Keep the aim while negotiating the size of the first commitment.'],
 'Saturn/Uranus':['accountability / change','A structure can support experimentation when you state what must remain reliable and what is allowed to change.'],
 'Saturn/Neptune':['structure / imagination','A practical commitment can give an ideal form without proving the ideal is certain. Name both the hope and the evidence needed for the next step.'],
 'Saturn/Pluto':['responsibility / influence','Carrying responsibility does not mean owning every outcome. Distinguish an obligation you accepted from control you cannot legitimately claim.'],
 'Mars/Saturn':['initiative / limits','A boundary can give an action shape; treating every limit as a verdict can stop an experiment before it begins.'],
};
const key=(a:string,b:string)=>[a,b].sort().join('/');
const indexed=Object.fromEntries(Object.entries(themes).map(([pair,value])=>[key(...pair.split('/') as [string,string]),value]));
const qualities=['direct','deliberate','curious','protective','expressive','precise','reciprocal','private','exploratory','structured','independent','receptive'];
const needs=['initiative','stability','exchange','belonging','expression','usefulness','reciprocity','trust','freedom','structure','independence','compassion'];
const strategies:Record<string,[string,string]>={
 Conjunction:['Name the two aims separately before choosing one response.','Write one sentence for each aim; do not assume one action serves both.'],
 Sextile:['Treat cooperation as an opportunity you can deliberately use.','Choose one small action that connects the two aims; notice whether you actually take it.'],
 Square:['Let the competing aims negotiate instead of asking which one is wrong.','Make two feasible proposals, each protecting a different aim, and compare their costs.'],
 Trine:['Check an easy route for a need that has gone unnamed.','Try the familiar response once and one alternative once; compare what each leaves out.'],
 Opposition:['Hold both aims in view without assigning one entirely to someone else.','Name what each side protects, then make a request that does not require the other person to surrender their choice.'],
};
export function synthesizePair(chart:Chart,system:string,a:string,b:string,focus:Focus){
 if(chart.unknown&&(a==='Moon'||b==='Moon'))return null;
 const first=chart.planets.find(p=>p.name===a),second=chart.planets.find(p=>p.name===b);if(!first||!second)return null;
 const contact=aspects(chart.planets).find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));
 const theme=indexed[key(a,b)]||[`${a} / ${b}`,`Give the symbolic roles of ${a} and ${b} separate names before deciding how they fit your situation.`];
 const firstSign=Math.floor(first.lon/30),secondSign=Math.floor(second.lon/30);
 const signRelation=firstSign===secondSign?`Both use a ${qualities[firstSign]} sign language; sharing a style does not mean sharing a need.`:firstSign%4===secondSign%4?`Their signs share an element, while ${qualities[firstSign]} and ${qualities[secondSign]} describe different possible approaches.`:`Compare a ${qualities[firstSign]} approach with a ${qualities[secondSign]} one; translating between them may be more useful than choosing a winner.`;
 const geometry=contact?`${contact.name} (${contact.orb.toFixed(2)} deg orb): ${strategies[contact.name][0]}`:'No major aspect within the calculation’s 6-degree orb joins this pair. The contrast below compares placements; it does not imply an aspect.';
 let setting='House context is omitted because birth time is unknown.';
 if(!chart.unknown){const h1=houseNumber(first.lon,chart,system),h2=houseNumber(second.lon,chart,system);setting=h1===h2?`Both occupy house ${h1}: try this in ${houseTopics[h1-1].toLowerCase()}.`:`Follow the link between house ${h1} (${houseTopics[h1-1].toLowerCase()}) and house ${h2} (${houseTopics[h2-1].toLowerCase()}).`;}
 const scene=focus==='work'?'Use a recent decision about workload, visibility or a deadline.':focus==='relationships'?'Use one recent exchange in which both people could freely make a request or decline.':'Use an ordinary choice for which you can describe what actually happened.';
 const exercise=contact?strategies[contact.name][1]:`Write what ${needs[firstSign]} would ask for and what ${needs[secondSign]} would ask for; check each against a real example.`;
 return {ruleId:`pair:${key(a,b)}:${contact?.name||'placement-only'}:${firstSign}:${secondSign}:${chart.unknown?'no-houses':houseNumber(first.lon,chart,system)+'-'+houseNumber(second.lon,chart,system)}:${focus}`,title:theme[0],body:`${theme[1]} ${signRelation} ${geometry} ${setting}`,practice:`${scene} ${exercise}`,aspectBody:`${theme[1]} ${contact?strategies[contact.name][0]:geometry} ${setting}`,aspectPractice:exercise,basis:[`${a} ${placement(first.lon)} ${degree(first.lon)}`,`${b} ${placement(second.lon)} ${degree(second.lon)}`,contact?`${contact.name} / ${contact.orb.toFixed(2)} deg orb`:'Placement comparison only / no qualifying major aspect']};
}
export const houseExperiments=[
 'Describe how you enter a room before asking how you want to be perceived.',
 'Separate a practical resource you need from a judgment about your worth.',
 'Ask someone to repeat your request in their own words.',
 'Name one condition that makes a place feel restful to you.',
 'Make something small before deciding whether it deserves an audience.',
 'Choose one daily rhythm you can sustain on an ordinary day.',
 'Compare a freely chosen agreement with an unspoken expectation.',
 'Clarify who can access a shared resource and how either person can decline.',
 'Write a belief and one experience that could lead you to revise it.',
 'Separate the contribution you want to make from the recognition you hope to receive.',
 'Name one commitment to a group and one limit that preserves your capacity.',
 'Notice what solitude restores and when it becomes a way to avoid a needed request.',
];
export const editorialPairs=Object.keys(themes).map(pair=>pair.split('/') as [string,string]);
export const editorialEdition='combinations-2026-10-v3';
