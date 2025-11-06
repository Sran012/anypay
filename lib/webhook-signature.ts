import crypto from "crypto"

export function verifyAlchemyWebhook(payload: string, signature: string, authToken: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", authToken).update(payload).digest("hex")
  return signature === expectedSignature
}

export function verifyCoinDCXWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return signature === expectedSignature
}

export function verifyCashfreeWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return signature === expectedSignature
}
