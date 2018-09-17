let stringify = o => JSON.stringify(o);

export default function isEqual(a,b) { 
  if(typeof a != 'object' || typeof b != 'object') return a === b; 
  return stringify(a) == stringify(b);
}; 