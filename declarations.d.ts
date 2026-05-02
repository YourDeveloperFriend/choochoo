
declare module '*.css';

declare module '*.svg';

declare module 'choochoo:view-registry' {
  import { MapViewSettings } from './src/maps/view_settings';
  export const allViewSettings: MapViewSettings[];
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
