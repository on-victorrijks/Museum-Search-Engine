import React, { useState, useCallback, Children, useEffect } from "react";
import {
  SimpleTreeItemWrapper,
  SortableTree,
  TreeItem,
  TreeItemComponentProps,
  TreeItems,
} from "dnd-kit-sortable-tree";

import { v4 as uuidv4 } from "uuid";
import { FaTrashCan } from "react-icons/fa6";
import { ItemChangedReason } from "dnd-kit-sortable-tree/dist/types";

type MinimalTreeItemData = {
  id: string;
  type: "GROUP" | "AND" | "OR" | "LEAF";
  children?: MinimalTreeItemData[];
  value?: string;
  isNot?: boolean;
};

export default function Tree(
  handleError: (sPath: string, message: string) => void
) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TreeItems<MinimalTreeItemData>>([]);

  // Add new block to the tree
  const addNewBlock = (type: MinimalTreeItemData["type"]) => {
    const itemID = uuidv4();
    setItems((prev) => [...prev, { id:itemID, type}]);
  };

  const recoverItemValues = () => {
    items.forEach((item) => {
      const isNotElement = document.getElementById("not-" + item.id) as HTMLInputElement;
      if (isNotElement) item.isNot = isNotElement.checked;

      const inputElement = document.getElementById("input-" + item.id) as HTMLInputElement;
      if (inputElement) item.value = inputElement.value;
    });
    console.log(items);
  }

  const removeBlock = (items_explorer: MinimalTreeItemData[], id: string, depth: number = 0) => {
    // Items is a tree-like structure, so we need to remove all children of the item as well
    const newItems : MinimalTreeItemData[] = [];
    for (let i = 0; i < items_explorer.length; i++) {
      if (items_explorer[i].id === id) {
        // Skip the item to be removed
        continue;
      } else {
        // This item can stay, check his children
        const children: MinimalTreeItemData[] = items_explorer[i].children ?? [];
        const children_validated = removeBlock(children, id, depth+1);
        newItems.push({
          ...items_explorer[i],
          children: children_validated,
        });
      }
    }
    if(depth === 0) {
      validateChanges(newItems);
    }
    return newItems;
  }

  // Tree Item Renderer (memoized for performance)
  const TreeItemRender = (props: TreeItemComponentProps<MinimalTreeItemData>) => {
    const [localValue, setLocalValue] = useState<string>("");
    const [isNot, setIsNot] = useState<boolean>(false);
    return (
        <SimpleTreeItemWrapper {...props}>
          <div
            className={"block-type " + props.item.type}
          >
            {props.item.type != "LEAF" && (
              <div className="block-not">
                <input 
                  type="checkbox" 
                  checked={isNot} 
                  onChange={(e) => {
                    e.stopPropagation();
                    setIsNot(e.target.checked)
                  }} 
                  id={"not-" + props.item.id}
                />
                <h4>NOT</h4>
              </div>
            )}
            <h3>{props.item.type}</h3>
          </div>
          { props.item.type === "LEAF" && (
            <div className="block-input">
              <input
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                id={"input-" + props.item.id}
              />
            </div>
          )}
          <div className="block-buttons">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeBlock(items, props.item.id);
              }}
            >
              <FaTrashCan />
            </button>
          </div>
        </SimpleTreeItemWrapper>
      );
  };

  const validateChanges = (
    newItems: TreeItems<MinimalTreeItemData>
  ) => {
    setItems(newItems);
  }

  /*
    items: TreeItems<TData>;
    onItemsChanged(items: TreeItems<TData>, reason: ItemChangedReason<TData>): void;
    TreeItemComponent: TreeItemComponentType<TData, TElement>;
    indentationWidth?: number;
    indicator?: boolean;
    pointerSensorOptions?: PointerSensorOptions;
    disableSorting?: boolean;
    dropAnimation?: DropAnimation | null;
    dndContextProps?: React.ComponentProps<typeof DndContext>;
    sortableProps?: Omit<UseSortableArguments, 'id'>;
    keepGhostInPlace?: boolean;
    canRootHaveChildren?: boolean | ((dragItem: FlattenedItem<TData>) => boolean);
  */

  return (
    <div
      style={{
        backgroundColor: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div className="blocks">
        {["GROUP", "AND", "OR", "LEAF"].map((type) => (
          <button key={type} onClick={() => addNewBlock(type as MinimalTreeItemData["type"])}>
            {type}
          </button>
        ))}
        <button onClick={recoverItemValues}>Recover Item Values</button>
      </div>
      <div>
        { loading
        ? <div>Loading...</div>
        : <SortableTree
          indentationWidth={100}
          items={items}
          onItemsChanged={validateChanges}
          TreeItemComponent={(props) => <TreeItemRender {...props} />}
        />
        }
      </div>
    </div>
  );
}
