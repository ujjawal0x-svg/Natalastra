'use client';
import {useEffect,useState} from 'react';
import type {BirthData} from '../lib/profile';
import {forgetGuestChart,guestChartMode,saveGuestChart,updateGuestChart} from './guest-chart';
export function GuestChartControls({birth}:{birth:BirthData}){
 const [mode,setMode]=useState<'device'|'tab'|null>(null),[error,setError]=useState('');
 useEffect(()=>{try{updateGuestChart(birth);setMode(guestChartMode());}catch(e){setError((e as Error).message);}},[birth]);
 useEffect(()=>{const check=()=>setMode(guestChartMode());window.addEventListener('pageshow',check);return()=>window.removeEventListener('pageshow',check);},[]);
 return <section className="guest-chart-save" aria-label="Guest chart saving"><div><strong>{mode==='device'?'Birth details saved on this device':mode==='tab'?'Chart remembered in this tab':'Your guest chart is not saved'}</strong><p>{mode==='device'?'Your chart opens automatically next time in this browser. Saved details remain until you edit or remove them, or clear browser data.':mode==='tab'?'Your earlier tab save is temporary. Choose “Save on this device” to keep your chart after closing the tab.':'Choose “Save on this device” to open your chart next time without filling these details again.'}</p>{mode!=='device'&&<p>Anyone using this browser can access a device save. <a href="/signup">Create an account</a> for a private profile across devices.</p>}</div><div className="guest-chart-actions">{mode!=='device'&&<button type="button" onClick={()=>{try{saveGuestChart(birth);setMode('device');setError('');}catch(e){setError((e as Error).message);}}}>Save on this device</button>}{mode&&<button type="button" onClick={()=>{forgetGuestChart();setMode(null);setError('');}}>Remove saved details</button>}</div>{error&&<p role="alert">{error}</p>}</section>;
}
