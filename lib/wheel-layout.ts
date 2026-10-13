// Label positions only. Calculated longitudes and aspect geometry are unchanged.
export function spreadLabels(longitudes:number[],gap=16):number[]{
 if(longitudes.length<2)return [...longitudes];
 const sorted=longitudes.map((lon,index)=>({lon:((lon%360)+360)%360,index})).sort((a,b)=>a.lon-b.lon);
 let cut=0,largest=-1;
 for(let i=0;i<sorted.length;i++){const next=(i+1)%sorted.length,d=(sorted[next].lon-sorted[i].lon+360)%360;if(d>largest){largest=d;cut=next;}}
 const order=[...sorted.slice(cut),...sorted.slice(0,cut)];
 const original=order.map((p,i)=>p.lon+(i&&p.lon<order[0].lon?360:0));
 const spaced=[...original]; const minimum=Math.min(gap,360/longitudes.length);
 for(let i=1;i<spaced.length;i++)spaced[i]=Math.max(spaced[i],spaced[i-1]+minimum);
 spaced[spaced.length-1]=Math.min(spaced.at(-1)!,spaced[0]+360-minimum);
 for(let i=spaced.length-2;i>=0;i--)spaced[i]=Math.min(spaced[i],spaced[i+1]-minimum);
 const drift=spaced.reduce((s,v,i)=>s+v-original[i],0)/spaced.length;
 const result=Array(longitudes.length).fill(0);order.forEach((p,i)=>result[p.index]=(spaced[i]-drift+720)%360);return result;
}
