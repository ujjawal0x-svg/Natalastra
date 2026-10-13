import {z} from 'zod';
export const routes=['/','/dashboard','/chart','/synastry','/dossier','/pricing','/psychology','/transits','/journal','/studio','/login','/signup','/forgot-password','/reset-password','/research','/diagnostics','/privacy','other'] as const;
export const metrics=['browser_error','react_error','rejection','resource_error','LCP','INP','CLS','TTFB','button_response','navigation_render','api_duration'] as const;
export const targets=['none','button','navigation','chart_save','timeline','pdf','auth','vault','research','billing','audio','reflections','places','other'] as const;
export const categories=['none','uncaught','network','chunk','calculation','resource','http_error'] as const;
export const diagnosticEvent=z.object({metric:z.enum(metrics),route:z.enum(routes),target:z.enum(targets),category:z.enum(categories),value:z.number().finite().min(0).max(600000),status:z.number().int().min(0).max(599),viewport:z.enum(['small','medium','large']),asset:z.string().regex(/^(?:[a-zA-Z0-9_.-]{1,100})?$/),line:z.number().int().min(0).max(100000),column:z.number().int().min(0).max(100000),build:z.literal('observability-1')}).strict();
export const diagnosticBatch=z.object({session:z.string().uuid(),events:z.array(diagnosticEvent).min(1).max(20)}).strict();
export type DiagnosticEvent=z.infer<typeof diagnosticEvent>;
export function safeRoute(path:string){return routes.includes(path as typeof routes[number])?path as typeof routes[number]:'other';}
export function errorCategory(error:unknown):DiagnosticEvent['category']{let message='';try{message=error instanceof Error?error.message:typeof error==='string'?error:'';}catch{}if(/chunk|dynamically imported/i.test(message))return 'chunk';if(/fetch|network/i.test(message))return 'network';if(/house|birth time|latitude/i.test(message))return 'calculation';return 'uncaught';}
