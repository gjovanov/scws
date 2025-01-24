import { clamp } from '@yume-chan/scrcpy'

export const mapClientToDevicePosition = ({clientX, clientY, clientRect, rotation, width, height}) => {
    let pointerViewX = clamp((clientX - clientRect.x) / clientRect.width, 0, 1)
    let pointerViewY = clamp((clientY - clientRect.y) / clientRect.height, 0, 1)

    if (rotation & 1) {
      ;[pointerViewX, pointerViewY] = [pointerViewY, pointerViewX]
    }
    switch (rotation) {
      case 1:
        pointerViewY = 1 - pointerViewY
        break
      case 2:
        pointerViewX = 1 - pointerViewX
        pointerViewY = 1 - pointerViewY
        break
      case 3:
        pointerViewX = 1 - pointerViewX
        break
    }

     return {
      x: pointerViewX * width,
      y: pointerViewY * height,
    }
  }

 