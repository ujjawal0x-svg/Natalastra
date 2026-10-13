import {AccountControls} from './account-session';
import {SiteFooter} from './site-footer';
export function InfoShell({title,kicker='NATALASTRA',children}:{title:string;kicker?:string;children:React.ReactNode}){return <main className="info-shell"><header className="info-header"><a className="publication-brand" href="/">natalastra<span>A MAP, NOT A DESTINY.</span></a><AccountControls/></header><a className="info-back" href="/">← Home</a><div className="info-heading"><span className="eyebrow">{kicker}</span><h1>{title}</h1></div><div className="info-body">{children}</div><SiteFooter/></main>;}
