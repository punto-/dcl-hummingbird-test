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
bird.addComponent(new Transform({
  position: new Vector3(8, 1, 8),
  scale: new Vector3(2, 2, 2),
  rotation: Quaternion.Euler(0, 180, 0),
}))
bird.addComponent(new GLTFShape('models/hummingbird.glb'))
engine.addEntity(bird)

// set animations
let birdAnim = new Animator()
bird.addComponent(birdAnim)

const flyAnim = new AnimationState('fly', { layer: 0 })
flyAnim.speed = 2
birdAnim.addClip(flyAnim)
flyAnim.play()

const lookAnim = new AnimationState('look', { looping: false, layer: 1 })
birdAnim.addClip(lookAnim)

const shakeAnim = new AnimationState('shake', { looping: false, layer: 2 })
birdAnim.addClip(shakeAnim)

/////////////////////
// Create Interactions

// reusable materials
let onMaterial = new Material()
onMaterial.albedoColor = Color3.Green()

let offMaterial = new Material()
offMaterial.albedoColor = Color3.White()

// shake animation
let shakeCube = createCube(new Vector3(2, 1, 2), 'Shake')
let shakeOn = false
shakeCube.addComponent(
  new OnClick((e) => {
    if (shakeOn) {
      shakeOn = false
      shakeCube.addComponentOrReplace(offMaterial)
      shakeAnim.stop()
    }
    else {
      shakeOn = true
      shakeCube.addComponentOrReplace(onMaterial)
      shakeAnim.play()
    }
  })
)

// look animation
let lookCube = createCube(new Vector3(0.5, 1, 2), 'Look')
let lookOn = false
lookCube.addComponent(
  new OnClick((e) => {
    if (lookOn) {
      lookOn = false
      lookCube.addComponentOrReplace(offMaterial)
      lookAnim.stop()
    }
    else {
      lookOn = true
      lookCube.addComponentOrReplace(onMaterial)
      lookAnim.play()
    }
  })
)

// fly animation
let flyCube = createCube(new Vector3(2, 1, 0.5), 'Fly')
let flyOn = true
flyCube.addComponentOrReplace(onMaterial)
flyCube.addComponent(
  new OnClick((e) => {
    if (flyOn) {
      flyOn = false
      flyCube.addComponentOrReplace(offMaterial)
      flyAnim.stop()
    }
    else {
      flyOn = true
      flyCube.addComponentOrReplace(onMaterial)
      flyAnim.play()
    }
  })
)