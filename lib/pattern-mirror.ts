export const mirrorMoments={
 yes:{en:'I say yes when I need a limit.',hi:'सीमा चाहिए, फिर भी हाँ कह देता/देती हूँ।',context:'I sometimes agree to a request even when I need a limit. Offer a kind, specific boundary; do not assume manipulation or fear of abandonment.'},
 quiet:{en:'I go quiet in a difficult conversation.',hi:'मुश्किल बातचीत में चुप हो जाता/जाती हूँ।',context:'I sometimes go quiet during a difficult conversation. Offer a pause-and-return phrase; do not assume trauma or an unsafe relationship.'},
 explain:{en:'I keep explaining myself.',hi:'अपनी बात बार-बार समझाता/समझाती हूँ।',context:'I sometimes keep explaining my position. Offer a concise request or understanding check; do not assume that another person is ignoring me.'},
 start:{en:'I wait for the perfect moment to begin.',hi:'शुरू करने के लिए सही समय का इंतज़ार करता/करती हूँ।',context:'I sometimes postpone beginning until conditions feel ideal. Offer a reversible small beginning; do not diagnose anxiety, ADHD or perfectionism.'}
} as const;
export type MirrorMoment=keyof typeof mirrorMoments;
export function mirrorEvidence(basis:string[]){return basis.map((text,i)=>({id:`E${i+1}`,text}));}
