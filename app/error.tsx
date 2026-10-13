'use client';
import {useEffect} from 'react';
import {reportBrowserError} from './diagnostics-client';
export default function ErrorPage({error,reset}:{error:Error;reset:()=>void}){useEffect(()=>{reportBrowserError(error,'react_error');},[error]);return <main className="app"><div className="content"><h1>This page couldn’t load.</h1><p>Your saved details are still in your account. Try this page again.</p><button className="dark-button" onClick={reset}>Try again</button> <a href="/">Go home</a></div></main>;}
