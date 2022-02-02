

import { NFT } from "./nft"

import { data } from "./data"

import { Crate } from './crate'

import * as utils from '@dcl/ecs-scene-utils'

/////// Define song list
const songs: { src: string; name: string }[] = [
  { src: 'sounds/Telemann.mp3', name: 'Telemann' },
  { src: 'sounds/Bach.mp3', name: 'Bach' },
  { src: 'sounds/Brahms.mp3', name: 'Brahms' },
  { src: 'sounds/Chopin.mp3', name: 'Chopin' },
]


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
  new NFTShape("ethereum://" + data[1].address, { color: Color3.Red(), style: PictureFrameStyle.Classic}),
  new Transform({
    position: new Vector3(1, 2.5, 8),
	rotation: Quaternion.Euler(0,-45,0),
    scale: new Vector3(3, 3, 3),
  }),
  data[1].id
)

const exampleNFT1 = new NFT(
  new NFTShape("ethereum://" + data[0].address, { color: Color3.Yellow(), style: PictureFrameStyle.Blocky}),
  new Transform({
    position: new Vector3(3, 2.5, 16),
    scale: new Vector3(4, 4, 4),
  }),
  data[1].id
)

const exampleNFT2 = new NFT(
  new NFTShape("ethereum://" + data[2].address, { color: Color3.Blue(), style: PictureFrameStyle.Gold_Carved}),
  new Transform({
    position: new Vector3(10, 2.5, 16),
    scale: new Vector3(4, 4, 4),
  }),
  data[1].id
)

const exampleNFT3 = new NFT(
  new NFTShape("ethereum://" + data[3].address, { color: Color3.Green(), style: PictureFrameStyle.Gold_Wide}),
  new Transform({
    position: new Vector3(12, 2.5, 8),
	rotation: Quaternion.Euler(0,45,0),
    scale: new Vector3(3, 3, 3),
  }),
  data[1].id
)

// Jukebox
const jukebox = new Entity()
jukebox.addComponent(new GLTFShape('models/Jukebox.gltf'))
jukebox.addComponent(
  new Transform({
    position: new Vector3(5, 0, 9.5),
    rotation: Quaternion.Euler(0, 180, 0),
    scale: new Vector3(0.6, 0.6, 0.6),
  })
)
engine.addEntity(jukebox)

// Buttons
let buttonArray = []

let clickOffset = new Vector3(0, 0, 0.02)
let buttonPos = new Vector3(0, 0, -0.04)

let buttonPositions = [ new Vector2(-0.4, 1.9), new Vector2(0.2, 1.77), new Vector2(-0.2, 1.77), new Vector2(0.4, 1.9)  ]

for (let i = 0; i < songs.length; i++) {
  //let posX = i % 2 == 0 ? -0.03 : 0.4
  //let posY = Math.floor(i / 2) == 0 ? 1.9 : 1.77
  let posX = buttonPositions[i].x
  let posY = buttonPositions[i].y

  log(posX, posY, songs.length)
  // groups the button itself and label
  let buttonWrapper = new Entity()
  buttonWrapper.addComponent(
    new Transform({
      position: new Vector3(posX, posY, 0.7),
      rotation: Quaternion.Euler(0, 180, 0),
    })
  )
  buttonWrapper.setParent(jukebox)
  engine.addEntity(buttonWrapper)

  let buttonLabel = new Entity()
  buttonLabel.addComponent(
    new Transform({
      position: new Vector3(0.05, 0, -0.1),
    })
  )
  let text = new TextShape(songs[i].name)
  text.fontSize = 1
  text.hTextAlign = 'left'
  text.color = Color3.FromHexString('#ffffff')
  text.outlineColor = Color3.FromHexString('#332244')
  text.outlineWidth = 2
  buttonLabel.addComponent(text)
  buttonLabel.setParent(buttonWrapper)
  engine.addEntity(buttonLabel)

  buttonArray[i] = new Entity()
  buttonArray[i].addComponent(
    new Transform({
      position: new Vector3(0, 0, -0.04),
      rotation: Quaternion.Euler(270, 0, 0),
      scale: new Vector3(0.3, 0.3, 0.3),
    })
  )
  buttonArray[i].setParent(buttonWrapper)
  buttonArray[i].addComponent(new GLTFShape('models/Button.glb'))

  // Click behavior
  buttonArray[i].addComponent(
    new OnPointerDown(
      (e) => {
        pressButton(i)
      },
      { button: ActionButton.POINTER, hoverText: songs[i].name }
    )
  )

  // Audio components
  let song = new AudioClip(songs[i].src)
  let audioSource = new AudioSource(song)
  audioSource.playing = false
  buttonArray[i].addComponent(audioSource)

  // Toggle functionality
  buttonArray[i].addComponent(
    new utils.ToggleComponent(utils.ToggleState.Off, (value) => {
      if (value == utils.ToggleState.On) {
        // switch button on
        buttonArray[i].addComponentOrReplace(
          new utils.MoveTransformComponent(buttonPos, clickOffset, 0.5)
        )
        buttonArray[i].getComponent(AudioSource).playing = true
      } else {
        // switch button off
        if (buttonArray[i].getComponent(AudioSource).playing) {
          buttonArray[i].getComponent(AudioSource).playing = false
          buttonArray[i].addComponentOrReplace(
            new utils.MoveTransformComponent(clickOffset, buttonPos, 0.5)
          )
        }
      }
    })
  )

  engine.addEntity(buttonArray[i])
}

///////////////////////////////////////
//HELPER FUNCTIONS

function pressButton(i: number) {
  buttonArray[i].getComponent(utils.ToggleComponent).toggle()
  for (let j = 0; j < songs.length; j++) {
    if (j != i) {
      buttonArray[j]
        .getComponent(utils.ToggleComponent)
        .set(utils.ToggleState.Off)
    }
  }
}

// Base
const base = new Entity()
base.addComponent(new GLTFShape('models/baseLight.glb'))
engine.addEntity(base)

// Configuration
const Z_OFFSET = 1.5
const GROUND_HEIGHT = 0.55

// Crate
const crate = new Crate(
  new GLTFShape('models/crate.glb'),
  new Transform({
    position: new Vector3(8, GROUND_HEIGHT, 8),
  })
)

// Sounds
const pickUpSound = new Entity()
pickUpSound.addComponent(new AudioSource(new AudioClip('sounds/pickUp.mp3')))
pickUpSound.addComponent(new Transform())
engine.addEntity(pickUpSound)
pickUpSound.setParent(Attachable.AVATAR)


const putDownSound = new Entity()
putDownSound.addComponent(new AudioSource(new AudioClip('sounds/putDown.mp3')))
putDownSound.addComponent(new Transform())
engine.addEntity(putDownSound)
putDownSound.setParent(Attachable.AVATAR)


// Controls
Input.instance.subscribe('BUTTON_DOWN', ActionButton.PRIMARY, false, (e) => {
  let transform = crate.getComponent(Transform)
  if (!crate.isGrabbed) {
    crate.isGrabbed = true
    pickUpSound.getComponent(AudioSource).playOnce()

    // Calculates the crate's position relative to the camera
    transform.position = Vector3.Zero()
    transform.rotation = Quaternion.Zero()
    transform.position.z += Z_OFFSET
    crate.setParent(Attachable.AVATAR)
  } else {
    crate.isGrabbed = false
    putDownSound.getComponent(AudioSource).playOnce()

    // Calculate crate's ground position
    crate.setParent(null) // Remove parent
    let forwardVector: Vector3 = Vector3.Forward()
      .scale(Z_OFFSET)
      .rotate(Camera.instance.rotation)
    transform.position = Camera.instance.position.clone().add(forwardVector)
    transform.lookAt(Camera.instance.position)
    transform.rotation.x = 0
    transform.rotation.z = 0
    transform.position.y = GROUND_HEIGHT
  }
})
