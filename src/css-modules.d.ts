declare module '*.module.css' {
  const styles: Record<string, string>;
  export = styles;
}

declare module '*.css';
