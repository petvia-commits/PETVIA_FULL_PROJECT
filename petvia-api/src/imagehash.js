import imghash from "imghash";

/**
 * Retorna hash perceptual (dhash) em hex.
 * - 16 chars (64 bits) quando bits=8
 */
export async function perceptualHashHex(filePath){
  // dhash é leve e rápido para VPS pequena
  const hex = await imghash.hash(filePath, 8, "hex");
  return String(hex).slice(0, 16);
}

export function hammingDistanceHex(a, b){
  if (!a || !b) return 999;
  // a,b = 16 hex chars -> 64 bits
  const A = BigInt("0x"+a);
  const B = BigInt("0x"+b);
  let x = A ^ B;
  // popcount BigInt
  let count = 0;
  while (x){
    x &= (x - 1n);
    count++;
  }
  return count;
}
