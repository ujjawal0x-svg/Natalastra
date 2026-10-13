import {birthSchema,type BirthData} from './profile';
import {calculate} from './astro';
export function savedProfile(profiles:unknown,wanted:string|null):{id:string;birth:BirthData}|null{
 if(!Array.isArray(profiles))throw Error('Your saved charts could not be loaded. Please retry.');
 const selected=wanted?profiles.filter(p=>p?.id===wanted):profiles;
 if(wanted&&!selected.length)throw Error('That birth chart is not in your archive.');
 for(const profile of selected){const parsed=birthSchema.safeParse(profile?.birth);if(parsed.success){try{calculate(parsed.data.date,parsed.data.time,parsed.data.location||parsed.data.city,parsed.data.unknown,parsed.data.fold);return {id:profile.id,birth:parsed.data};}catch{}}}
 if(selected.length)throw Error('Your saved birth details need attention. Retry loading or update your birth details.');
 return null;
}

export function savedBirth(profiles:unknown,wanted:string|null):BirthData|null{return savedProfile(profiles,wanted)?.birth||null;}
