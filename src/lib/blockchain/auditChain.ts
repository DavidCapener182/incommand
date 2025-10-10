/**
 * Blockchain Audit Trail
 * Immutable logging with cryptographic verification
 */

export interface BlockchainEntry {
  id: string
  timestamp: string
  data: any
  hash: string
  previousHash: string
  nonce: number
}

export class BlockchainAuditTrail {
  private chain: BlockchainEntry[] = []

  async addEntry(data: any): Promise<BlockchainEntry> {
    const previousHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : '0'
    const entry: BlockchainEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      data,
      hash: '',
      previousHash,
      nonce: 0
    }

    entry.hash = await this.calculateHash(entry)
    this.chain.push(entry)

    return entry
  }

  async verifyChain(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i]
      const previous = this.chain[i - 1]

      if (current.previousHash !== previous.hash) return false
      if (current.hash !== await this.calculateHash(current)) return false
    }

    return true
  }

  private async calculateHash(entry: BlockchainEntry): Promise<string> {
    const data = JSON.stringify({
      timestamp: entry.timestamp,
      data: entry.data,
      previousHash: entry.previousHash,
      nonce: entry.nonce
    })

    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

export const blockchainAuditTrail = new BlockchainAuditTrail()
