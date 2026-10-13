import {z} from 'zod';
export const locationSchema=z.object({name:z.string().trim().min(1).max(100),lat:z.number().min(-89).max(89),lon:z.number().min(-180).max(180),tz:z.string().min(1).max(80).refine(t=>{try{new Intl.DateTimeFormat('en',{timeZone:t});return true;}catch{return false;}},'Use a valid IANA timezone, for example Asia/Kolkata')});
export const birthSchema=z.object({name:z.string().trim().min(1).max(50),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d=>d>='1900-01-01'&&d<='2100-12-31'&&!Number.isNaN(Date.parse(d)),'Date must be between 1900 and 2100'),time:z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),city:z.number().int().min(0).max(6),unknown:z.boolean().default(false),fold:z.enum(['earlier','later']).default('earlier'),location:locationSchema.optional()});
export type BirthData=z.infer<typeof birthSchema>;
export type SavedProfile={id:string;name:string;birth:BirthData;updated_at:string};
export type JournalEntry={id:string;title:string;body:string;mood:string;created_at:string};
