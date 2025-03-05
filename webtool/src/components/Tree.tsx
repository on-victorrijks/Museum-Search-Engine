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

import "../styles/Tree.css";
import { FaBan, FaNotEqual } from "react-icons/fa";

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

  const hashCode = function(
    s: string
  ) {
    var hash = 0,
      i, chr;
    if (s.length === 0) return hash;
    for (i = 0; i < s.length; i++) {
      chr = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  //

  const [loading, setLoading] = useState(false);
  const [itemsHash, setItemsHash] = useState(hashCode("[]"));
  const [items, setItems] = useState<TreeItems<MinimalTreeItemData>>([]);

  // Add new block to the tree
  const addNewBlock = (type: MinimalTreeItemData["type"]) => {
    const itemID = uuidv4();
    setItems((prev) => [...prev, { 
      id:itemID, 
      type,
      isNot: false
    }]);
  };

  const recoverItemValues = () => {
    let newItems = [...items];
    items.forEach((item) => {
      const itemDiv = document.getElementById("TreeItem-" + item.id);
      if (itemDiv) {
        const isNot = itemDiv.getAttribute("is-not") === "true";
        item.isNot = isNot;

        const input = document.getElementById("input-" + item.id) as HTMLInputElement;
        if (!input) return;
        item.value = input.value;
      }
    });
    validateChanges(newItems, "RECOVER");
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
      validateChanges(newItems, "REMOVE");
    }
    return newItems;
  }

  const getItemByID = (
    items_explorer: MinimalTreeItemData[], 
    id: string
  ): MinimalTreeItemData | null => {
    for (let i = 0; i < items_explorer.length; i++) {
      if (items_explorer[i].id === id) {
        return items_explorer[i];
      } else {
        const children: MinimalTreeItemData[] = items_explorer[i].children ?? [];
        const item = getItemByID(children, id);
        if (item) return item;
      }
    }
    return null;
  }

  const getIsNotStatus = (id: string) => {
    const item = getItemByID(items, id);
    if (!item) return false;
    return item.isNot ?? false;
  }

  const getTextValue = (id: string) => {
    const item = getItemByID(items, id);
    if (!item) return "";
    return item.value ?? "";
  }

  // Tree Item Renderer (memoized for performance)
  const TreeItemRender = (props: TreeItemComponentProps<MinimalTreeItemData>) => {
    const [localValue, setLocalValue] = useState<string>(getTextValue(props.item.id));
    const [local__isNOT, local__setIsNOT] = useState<boolean>(getIsNotStatus(props.item.id));

    const update_isNOT = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
      new_isNOT: boolean
    ) => {
      e.stopPropagation();
      local__setIsNOT(new_isNOT);
    }

    return (
        <SimpleTreeItemWrapper {...props}>
          <div 
            className="block"
            id={"TreeItem-" + props.item.id}
            is-not={local__isNOT ? "true" : "false"}
          >
            {(props.item.type != "LEAF" && props.item.type != "GROUP") && (
            <div className={"block-type " + props.item.type}>
                <div className="block-not">
                  <div 
                    className="ccheckbox"
                    onClick={(e) => update_isNOT(e, !local__isNOT)}
                  >
                    <div className="not-icon">
                      <FaBan />
                    </div>
                  </div>
                  <h4>NOT</h4>
                </div>
              <h3>{props.item.type}</h3>
            </div>
            )}
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
          </div>
        </SimpleTreeItemWrapper>
      );
  };

  const validateChanges = (
    newItems: TreeItems<MinimalTreeItemData>,
    reason: ItemChangedReason<MinimalTreeItemData>|string
  ) => {
    const newHash = hashCode(JSON.stringify(newItems));
    console.log(newHash, itemsHash);
    if (newHash === itemsHash) return;
    // Get the IsNot status and the value of each item using the DOM

    setItemsHash(newHash);
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
