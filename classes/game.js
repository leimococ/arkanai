// eslint-disable-next-line no-unused-vars
class Game {
  constructor ({ AI, canvas, settings }) {
    // eslint-disable-next-line no-undef
    this.ball = new Ball({ settings })
    this.bricks = []
    this.lost = false
    // eslint-disable-next-line no-undef
    this.paddle = new Paddle({ ball: this.ball, canvas, settings })
    const brickHeight = Math.round(settings.brick.height)
    const brickPadding = Math.round(settings.brick.padding)
    const brickWidth = Math.round(settings.brick.width)
    const padding = Math.round(settings.padding)
    const cols = Math.floor((canvas.width - padding * 2) / (brickPadding + brickWidth))
    const rows = settings.rows
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const frame = Math.max(padding, (canvas.width - cols * (brickPadding + brickWidth) + brickPadding) / 2)
        // eslint-disable-next-line no-undef
        const brick = new Brick({ alpha: settings.alpha, color: settings.brick.colors[Math.floor(Math.random() * settings.brick.colors.length)], height: brickHeight, width: brickWidth, x: col * (brickPadding + brickWidth) + brickWidth / 2 + frame, y: row * (brickHeight + brickPadding * 0.8) + brickHeight / 2 + frame })
        this.bricks.push(brick)
      }
    }
    this.polygon = this.createPolygon(canvas)
    this.setControls(AI)
  }

  createPolygon (canvas) {
    return [
      { x: 0, y: 0 },
      { x: canvas.width, y: 0 },
      { x: canvas.width, y: canvas.height },
      { x: 0, y: canvas.height }
    ]
  }

  drawBricks (ctx) {
    for (const brick of this.bricks) {
      if (!brick.hit) {
        brick.draw(ctx)
      }
    }
  }

  getCollision () {
    // eslint-disable-next-line no-undef
    let touches = getTouches(this.ball.polygon, this.polygon)
    if (touches) {
      const directions = Object.keys(touches)
      if (directions.length > 1) {
        // eslint-disable-next-line no-undef
        return { direction: 'both', type: 'border', ...getCentroid(Object.values(touches)) }
      }
      return { direction: directions[0], type: 'border', ...touches[directions[0]] }
    }
    if (!this.paddle.ghost) {
      // eslint-disable-next-line no-undef
      touches = getTouches(this.ball.polygon, this.paddle.polygon)
      if (touches) {
        const directions = Object.keys(touches)
        if (directions.length > 1) {
          // eslint-disable-next-line no-undef
          return { direction: 'both', type: 'paddle', ...getCentroid(Object.values(touches)) }
        }
        return { direction: directions[0], type: 'paddle', ...touches[directions[0]] }
      }
    }
    for (const brick of this.bricks) {
      if (!brick.hit) {
        // eslint-disable-next-line no-undef
        touches = getTouches(this.ball.polygon, brick.polygon)
        if (touches) {
          brick.hit = true
          const directions = Object.keys(touches)
          if (directions.length > 1) {
            // eslint-disable-next-line no-undef
            return { brick, direction: 'both', type: 'brick', ...getCentroid(Object.values(touches)) }
          }
          return { direction: directions[0], type: 'brick', ...touches[directions[0]] }
        }
      }
    }
    return null
  }

  setControls (AI) {
    if (!AI) {
      document.onkeydown = event => {
        switch (event.key) {
          case 'ArrowLeft': {
            this.paddle.goLeft = true
            break
          }
          case 'ArrowRight': {
            this.paddle.goRight = true
            break
          }
        }
      }
      document.onkeyup = event => {
        switch (event.key) {
          case 'ArrowLeft': {
            this.paddle.goLeft = false
            break
          }
          case 'ArrowRight': {
            this.paddle.goRight = false
            break
          }
        }
      }
    }
  }

  update ({ canvas, ctx, frame }) {
    this.drawBricks(ctx)
    this.paddle.update({ canvas, ctx, frame })
    this.ball.update({ ctx })
    const collision = this.getCollision()
    if (collision) {
      if (collision.type === 'paddle') {
        this.paddle.ghost = true
        const angle = ((collision.x - this.paddle.x + this.paddle.width / 2) * 140) / this.paddle.width + 20
        this.ball.direction = { x: -Math.cos(angle * (Math.PI / 180)), y: -Math.sin(angle * (Math.PI / 180)) }
      } else {
        this.ball.direction.x *= collision.direction === 'vertical' ? -1 : 1
        this.ball.direction.y *= collision.direction === 'horizontal' ? -1 : 1
      }
      if (collision.direction === 'both') {
        switch (collision.type) {
          case 'border': {
            this.ball.direction.x *= -1
            this.ball.direction.y *= -1
            break
          }
          case 'brick': {
            this.ball.direction.x *= (this.ball.direction.x > 0 && this.ball.x <= collision.brick.x) || (this.ball.direction.x < 0 && this.ball.x >= collision.brick.x) ? -1 : 1
            this.ball.direction.y *= (this.ball.direction.y > 0 && this.ball.y <= collision.brick.y) || (this.ball.direction.y < 0 && this.ball.y >= collision.brick.y) ? -1 : 1
            break
          }
          case 'paddle': {
            this.ball.direction.x *= (this.ball.direction.x > 0 && this.ball.x <= this.paddle.x) || (this.ball.direction.x < 0 && this.ball.x >= this.paddle.x) ? -1 : 1
            this.ball.direction.y *= (this.ball.direction.y > 0 && this.ball.y <= this.paddle.y) || (this.ball.direction.y < 0 && this.ball.y >= this.paddle.y) ? -1 : 1
            break
          }
        }
      }
      if (collision.type === 'border' && collision.y === canvas.height) {
        this.lost = true
      }
    }
  }
}