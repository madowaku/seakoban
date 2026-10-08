import {LEVELS} from '../src/levels.js';
import {solveLevel} from '../src/solver.js';
let failed=false;
for(const l of LEVELS){
 const r=solveLevel(l);
 console.log(`${String(l.id).padStart(3,'0')} | ${r.solved?'PASS':'FAIL'} | ${r.moves??'-'} moves | ${r.pushes??'-'} pushes | ${r.brakes??'-'} brakes`);
 if(!r.solved||(l.id>=3&&r.brakes<1))failed=true;
}
if(failed)process.exitCode=1;