export const beginFrame = /\n#(\d*)\n/;
export const endFrame = /(.|\n)+(?=\n##)/;
export const endFrameNoCapture = /\n##\n/;
export const endHello = /]]>]]>/;
