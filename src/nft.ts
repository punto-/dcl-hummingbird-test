export class NFT extends Entity {
  public id: number

  constructor(
    nft: NFTShape,
    transform: Transform,
    color: Color3,
    id: number
  ) {
    super()
    engine.addEntity(this)
	
    nft.color = color
    this.addComponent(nft)
    this.addComponent(transform)
    this.id = id
  }
}
