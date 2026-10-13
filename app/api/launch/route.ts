import {env} from 'cloudflare:workers';
import {owner,apiError,ApiError,storageName} from '../../../lib/storage';
import {isResearchAdmin} from '../../../lib/research';
import {capabilities,billingConfig} from '../../../lib/billing';
import {authFetch,authEnabled} from '../../../lib/account-auth';
import {siteInfo} from '../../../lib/site-info';
import report from '../../../lib/calculation-validation.json';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await owner();if(!isResearchAdmin(user))throw new ApiError(403,'Only the site owner can open launch readiness.');const c=billingConfig(),info=siteInfo(),access=await capabilities(user.userId);let google=false,authOK=false;try{if(authEnabled()){const settings=await authFetch('settings');authOK=settings.ok;google=!!settings.data.external?.google;}}catch{}const missing=['LEMON_API_KEY','LEMON_WEBHOOK_SECRET','LEMON_STORE_ID','LEMON_DOSSIER_VARIANT_ID','LEMON_PASS_VARIANT_ID'].filter(key=>!(env as unknown as Record<string,string>)[key]);const emailConfigured=!!env.RESEND_API_KEY&&!!env.NATALASTRA_MAIL_FROM;
 const checks=[
 {id:'database',label:'Private archive',state:'ready',detail:storageName()+' is responding. Owner access was verified.'},
 {id:'auth',label:'Account provider',state:authOK?'ready':'blocked',detail:authOK?'Supabase Auth settings are reachable.':'Check the Supabase runtime connection.'},
 {id:'google',label:'Google sign-in',state:google?'verify':'blocked',detail:google?'Provider enabled. Complete sign-in in a browser on the final domain before launch.':'Enable the Google provider and configure its client credentials and callback.'},
 {id:'email',label:'Welcome email',state:emailConfigured?'verify':'blocked',detail:emailConfigured?'Sender configured; verify a delivered welcome email and its spam-folder placement.':'Add RESEND_API_KEY and a verified NATALASTRA_MAIL_FROM in protected runtime settings.'},
 {id:'smtp',label:'Verification and password-reset email',state:'verify',detail:'Configure production SMTP in Supabase Auth. Test signup confirmation and password reset with a non-owner email.'},
 {id:'merchant',label:'Payment configuration',state:missing.length?'blocked':'verify',detail:missing.length?'Missing: '+missing.join(', '):'Merchant fields present. Verify provider products, currency and prices.'},
 {id:'webhook',label:'Signed payment delivery',state:access.webhookVerified?'verify':'blocked',detail:access.webhookVerified?'A configured product has a signed test order. Still test refunds, retries and both products.':'Complete a test checkout and deliver the signed webhook to '+new URL('/api/billing/webhook',request.url).href},
 {id:'paid',label:'Live paid launch',state:access.paidEnabled&&!c.test?'verify':'blocked',detail:access.paidEnabled&&!c.test?'Live mode is enabled. A real purchase, receipt, access grant and refund still need a merchant acceptance test.':'Paid mode is not live. Keep it off until merchant and delivery checks are complete.'},
 {id:'identity',label:'Business identity and contact',state:info.operator&&info.address&&info.supportEmail?'ready':'blocked',detail:'Required public fields: '+[!info.operator&&'NATALASTRA_OPERATOR_NAME',!info.address&&'NATALASTRA_BUSINESS_ADDRESS',!info.supportEmail&&'NATALASTRA_SUPPORT_EMAIL'].filter(Boolean).join(', ')+(info.operator&&info.address&&info.supportEmail?'complete.':'')},
 {id:'calculation',label:'Calculation reference coverage',state:'ready',detail:report.charts+' reference charts; planet tolerance '+report.planetToleranceDegrees+'°. See /accuracy for limits and evidence.'},
 {id:'domain',label:'Final domain and public audience',state:'verify',detail:'Verify DNS, HTTPS, Site audience and OAuth redirect allowlists for the intended public domain. This page cannot verify hosting access settings.'},
 {id:'mobile',label:'Real-browser acceptance',state:'verify',detail:'Test 320/375/390/768 px widths, keyboard navigation, Google login, chart, PDF and logout. Automated backend tests do not prove a visual browser pass.'},
 {id:'users',label:'Real-user feedback',state:'verify',detail:'Ask 5–10 people to complete a reading and return after one week. Review actual feedback and return usage in /research.'}
 ];return Response.json({checkedAt:new Date().toISOString(),checks,missing,links:{research:'/research',pricing:'/pricing',support:'/support',accuracy:'/accuracy'},readyForPaidLaunch:false},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return apiError(e);}}
