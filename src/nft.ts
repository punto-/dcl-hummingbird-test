export class NFT extends Entity {
  public id: number

  constructor(
    nft: NFTShape,
    transform: Transform,
    id: number
  ) {
    super()
    engine.addEntity(this)
    
    this.addComponent(nft)
    this.addComponent(transform)
    this.id = id
  }
}
