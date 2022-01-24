

import { NFT } from "./nft"

import { data } from "./data"



function createCube(pos: Vector3, caption: string) {
  let cube = new Entity()
  cube.addComponent(
    new Transform({
      position: pos,
    })
  )
  cube.addComponent(new BoxShape())

  engine.addEntity(cube)
  
  let label = new Entity()
  label.setParent(cube)
  label.addComponent(new Billboard())
  label.addComponent(new Transform({
    position: new Vector3(0, 1.5, 0),
  }))
  label.addComponent(new TextShape(caption))
  label.getComponent(TextShape).fontSize = 3
  label.getComponent(TextShape).color = Color3.Black()

  engine.addEntity(label)

  return cube
}

/////////////////////
// Create Ground
const ground = new Entity()
ground.addComponent(
  new Transform({
    position: new Vector3(8, 0, 8),
    scale: new Vector3(1.6, 1.6, 1.6),
  })
)
ground.addComponent(new GLTFShape('models/FloorBaseGrass.glb'))
engine.addEntity(ground)

/////////////////////
// Create Bird
const bird = new Entity()
const bird_xform = new Transform({
  position: new Vector3(8, 1, 8),
  scale: new Vector3(0.15, 0.15, 0.15),
  rotation: Quaternion.Euler(0, 180, 0),
})
bird.addComponent(bird_xform)
bird.addComponent(new GLTFShape('models/hummingbird2.glb'))
engine.addEntity(bird)

// set animations
let birdAnim = new Animator()
bird.addComponent(birdAnim)

const flyAnim = new AnimationState('fly', { layer: 0 })
flyAnim.speed = 8
birdAnim.addClip(flyAnim)

const lookAnim = new AnimationState('look', { looping: false, layer: 1 })
birdAnim.addClip(lookAnim)

const shakeAnim = new AnimationState('shake', { looping: false, layer: 1 })
birdAnim.addClip(shakeAnim)

flyAnim.play()

function distance_to(pos1: Vector3, pos2: Vector3): number {
  const a = pos1.x - pos2.x
  const b = pos1.z - pos2.z
  return a * a + b * b
}
 // Behaviours
const player = Camera.instance
const MOVE_SPEED = 1
const ROT_SPEED = 1

let birdArrivedAtTarget = false
class FollowBehaviour implements ISystem {
  update(dt: number) {
    let distance = distance_to(bird_xform.position, player.position) // Check distance squared as it's more optimized
	if (distance <= 16) {
	birdMoving = false
	if (distance >= 1) {
	birdArrivedAtTarget = false
    // Rotate to face the player
    let lookAtTarget = new Vector3(player.position.x, 1.5, player.position.z)
    let direction = lookAtTarget.subtract(bird_xform.position)
    bird_xform.rotation = Quaternion.Slerp(bird_xform.rotation, Quaternion.LookRotation(direction), dt * ROT_SPEED)
	
    let forwardVector = Vector3.Forward().rotate(bird_xform.rotation)
	bird_xform.translate(forwardVector.scale(dt * MOVE_SPEED))
	} else {
	  if (!birdArrivedAtTarget) {
	  lookAnim.play()
	  }
	  birdArrivedAtTarget = true
	}
    }
  }
}

engine.addSystem(new FollowBehaviour())

let birdMoving = false
let nextPos : Vector3
class RandomFlyBehaviour implements ISystem {
  update(dt: number) {
    let distance = distance_to(bird_xform.position, player.position) // Check distance squared as it's more optimized
	if (distance > 16) {
	birdArrivedAtTarget = false
	
	if (!birdMoving) {
	birdMoving = true
	nextPos = new Vector3(
        Math.random() * 12 + 2,
        Math.random() * 3 + 1,
        Math.random() * 12 + 2
      )
	  bird_xform.lookAt(nextPos)
	}
	
    let forwardVector = Vector3.Forward().rotate(bird_xform.rotation)
    let increment = forwardVector.scale(dt * MOVE_SPEED)
    bird_xform.translate(increment)
	
	if (distance_to(bird_xform.position, nextPos) <= 1) {
	birdMoving = false
	}
	}
  }
}

engine.addSystem(new RandomFlyBehaviour())

// Video Controls


// reusable materials
let onMaterial = new Material()
onMaterial.albedoColor = Color3.Green()

let offMaterial = new Material()
offMaterial.albedoColor = Color3.White()

function createPrimitive(pos: Vector3, type, scale = new Vector3(0.5, 0.5, 0.5)) {
let shape = new Entity()
shape.addComponent(
new Transform({
  position: pos,
  scale: scale,
})
)

switch (type) {
case 0:
shape.addComponent(new SphereShape())
break
case 1:
shape.addComponent(new CylinderShape())
break
case 2:
shape.addComponent(new ConeShape())
break
case 3:
shape.addComponent(new PlaneShape())
break
case 4:
shape.addComponent(new BoxShape())
break
}

engine.addEntity(shape)
return shape
}
const visibilityShape = createPrimitive(new Vector3(9, 1, 1), 4)
const muteShape = createPrimitive(new Vector3(10, 1, 1), 0)
const loopShape = createPrimitive(new Vector3(11, 1, 1), 1)
const playShape = createPrimitive(new Vector3(12, 1, 1), 2)
const screenShape = createPrimitive(new Vector3(14, 1, 1), 3, new Vector3(3, 2, 1))

// Video
const videoClip = new VideoClip("videos/small.ogv")
const videoTexture = new VideoTexture(videoClip)

const screenMaterial = new Material()
screenMaterial.albedoTexture = videoTexture
screenMaterial.emissiveTexture = videoTexture
screenMaterial.emissiveColor = Color3.White()
screenMaterial.emissiveIntensity = 0.6
screenMaterial.roughness = 1.0
screenShape.addComponent(screenMaterial)


let visibleControls = true
visibilityShape.addComponent(
  new OnClick((e) => {
    if (visibleControls) {
      visibleControls = false
    }
    else {
      visibleControls = true
    }
	muteShape.getComponent(SphereShape).withCollisions = visibleControls
	loopShape.getComponent(CylinderShape).withCollisions = visibleControls
	playShape.getComponent(ConeShape).withCollisions = visibleControls
  })
)

let videoPlaying = false
playShape.addComponent(
  new OnClick((e) => {
    if (videoPlaying) {
      videoPlaying = false
	  videoTexture.pause()
      playShape.addComponentOrReplace(offMaterial)
    }
    else {
      videoPlaying = true
	  videoTexture.play()
      playShape.addComponentOrReplace(onMaterial)
    }
  })
)

videoTexture.loop = false
loopShape.addComponent(
  new OnClick((e) => {
    if (videoTexture.loop) {
      videoTexture.loop = false
      loopShape.addComponentOrReplace(offMaterial)
    }
    else {
      videoTexture.loop = true
      loopShape.addComponentOrReplace(onMaterial)
    }
  })
)

let videoMuted = false
muteShape.addComponent(onMaterial)
muteShape.addComponent(
  new OnClick((e) => {
    if (videoMuted) {
      videoMuted = false
	  videoTexture.volume = 1
      muteShape.addComponentOrReplace(onMaterial)
    }
    else {
      videoMuted = true
	  videoTexture.volume = 0
      muteShape.addComponentOrReplace(offMaterial)
    }
  })
)

// NFTs

const cryptoKittiesNFT = new NFT(
  new NFTShape("ethereum://" + data[1].address),
  new Transform({
    position: new Vector3(1, 2.5, 8),
    scale: new Vector3(4, 4, 4),
  }),
  new Color3(1.5, 1.5, 0.0),
  data[1].id
)