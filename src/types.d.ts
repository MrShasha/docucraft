declare module '@theme/Mermaid' {
  import {type ReactNode} from 'react';

  export interface Props {
    value: string;
  }

  export default function Mermaid(props: Props): ReactNode;
}
