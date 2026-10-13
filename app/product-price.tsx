import {products,type Product} from '../lib/pricing';
export function ProductPrice({product}:{product:Product}){return <>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(products[product].price/100)}</>;}
