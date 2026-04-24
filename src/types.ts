export type PickedLocation = {
  lng: number;
  lat: number;
};

export type ItemField = {
  key: string;
  type: string;
  value: unknown;
};

export type Item = {
  id: string;
  fields: ItemField[];
};
