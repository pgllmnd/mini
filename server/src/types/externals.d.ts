// Temporary ambient declarations for external packages used by the server.
// These help the TypeScript compiler accept imports while devDependencies
// (like @types/express) are being installed. Replace with proper types
// when available.

declare module 'express' {
  const anyExport: any;
  export = anyExport;
}

declare module 'cors' {
  const anyExport: any;
  export = anyExport;
}

declare module 'dotenv' {
  const anyExport: any;
  export = anyExport;
}
