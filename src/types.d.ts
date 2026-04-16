declare module '@theme/Mermaid' {
  import {type ReactNode} from 'react';

  export interface Props {
    value: string;
  }

  export default function Mermaid(props: Props): ReactNode;
}

declare module '@docusaurus/BrowserOnly' {
  import {type ReactNode} from 'react';

  export interface BrowserOnlyProps {
    children: () => ReactNode;
    fallback?: ReactNode;
  }

  export default function BrowserOnly(props: BrowserOnlyProps): ReactNode;
}
