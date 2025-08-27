export type tSchemaMap<Type> = {
  [Property in keyof Type]: Type[Property] extends Array<infer Element>
    ? Element
    : Type[Property] extends Object
    ? tSchemaMap<Type[Property]>
    : Type[Property];
};
