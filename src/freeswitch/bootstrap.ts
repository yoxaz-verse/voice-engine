


console.log('[BOOTSTRAP] Event observers before registered');

// 🔥 Side-effect imports ONLY
import '../observers/callslifeCycleObserver';
import '../observers/logObserver';

// ❌ NO eventRouter.on(...) here
// ❌ NO registry mutation here
// ❌ NO business logic here

console.log('[BOOTSTRAP] Event observers registered');
