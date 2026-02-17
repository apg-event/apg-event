// /// <reference types="vite/client" />

import 'react';

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.bmp' {
  const content: string;
  export default content;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      directionalLight: any;
      ambientLight: any;
      pointLight: any;
      fog: any;
      points: any;
      shaderMaterial: any;
      octahedronGeometry: any;
      meshStandardMaterial: any;
      cylinderGeometry: any;
      meshBasicMaterial: any;
      ringGeometry: any;
      instancedMesh: any;
      boxGeometry: any;
      planeGeometry: any;
      primitive: any;
    }
  }
}