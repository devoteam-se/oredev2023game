export const checkSelector = <T extends Element>(
  selectors: string,
  elementType: { new (): T; prototype: T },
  parent: ParentNode = document,
): T => {
  const element = parent.querySelector(selectors);

  if (!element) {
    throw new Error('Selector string matched no element');
  }

  if (!(element instanceof elementType)) {
    throw new Error(
      `Selector string matched wrong element type (expected ${elementType.name}, got ${element.constructor.name})`,
    );
  }

  return element;
};

export const checkById = <T extends Element>(
  id: string,
  elementType: { new (): T; prototype: T },
  parent: ParentNode = document,
): T => checkSelector(`#${id}`, elementType, parent);

export const checkByClass = <T extends Element>(
  className: string,
  elementType: { new (): T; prototype: T },
  parent: ParentNode = document,
): T => checkSelector(`.${className}`, elementType, parent);
