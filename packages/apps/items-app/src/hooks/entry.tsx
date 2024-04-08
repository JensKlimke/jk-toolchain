import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useApi} from "@sdk/dashboard";

const ITEM_API_URL = process.env.REACT_APP_ITEM_API_URL || 'http://localhost:3001'

export type ContentElement = JSX.Element | string | number;

export type DataColType = {
  label: ContentElement
  content: (row: any, data: any[], index: number, page ?: number, noOfPages ?: number) => ContentElement
  className?: string
  sort?: number
  width?: number
}

export type DataComponentConfigType = {
  title?: (row: any, data: any[], index: number, page ?: number, noOfPages ?: number) => ContentElement
  footer?: (row: any, data: any[], index: number, page ?: number, noOfPages ?: number) => ContentElement
  cols: DataColType[],
}

export type DataSortType = {
  label: string
  callback: (a: any, b: any) => number
}

export type DataSortConfig = {
  fields: DataSortType[],
  default?: {
    field: number,
    asc: boolean,
  },
  filterText: (data: any) => string
};

export type OnRowClickType =
  (row: EntryWithId, data: EntryWithId[], index: number, page ?: number, noOfPages ?: number) => void

export type StringKeyStringValueObjectsType = { [key: string]: string; };

export type ReloadCallbackType = (referenceID ?: string) => void
export type SaveCallbackType = () => void;
export type UpdateCallbackType<Type> = (key: keyof Type, value: any) => void;
export type SaveManyCallbackType<Type> = (entries: Type[]) => Promise<void>;
export type EraseCallbackType = () => void;
export type EraseAllCallbackType = () => Promise<void>;
export type EditCallbackType<Type> = (id: string | undefined, data ?: Type) => void;


export type EntryContextType<Type> = {
  data?: Type[] // EntryResponseType<Type>
  reload: ReloadCallbackType
  save: SaveCallbackType
  saveMany: SaveManyCallbackType<Type>
  erase: EraseCallbackType
  eraseAll: EraseAllCallbackType
  update: UpdateCallbackType<Type>
  edit: EditCallbackType<Type>
  entry?: Type
  setReference: (reference ?: string) => void
  setFilter: (filter: { [key: string]: string; }) => void
  loading: boolean
}

export const defaultContext = {
  'save': () => new Promise<any>(reject => {
    reject("Not implemented")
  }),
  'saveMany': () => new Promise<any>(reject => {
    reject("Not implemented")
  }),
  'erase': () => new Promise<any>(reject => {
    reject("Not implemented")
  }),
  'eraseAll': () => new Promise<any>(reject => {
    reject("Not implemented")
  }),
  'reload': () => {
    throw new Error('Not implemented')
  },
  'edit': () => {
    throw new Error('Not implemented')
  },
  'update': () => {
    throw new Error('Not implemented')
  },
  'setReference': () => {
    throw new Error('Not implemented')
  },
  'setFilter': () => {
    throw new Error('Not implemented')
  },
  'loading': false
}

export type EntryWithId = {
  _id?: string
}

export function GenericEntryProvider<Type extends EntryWithId>(
  itemKey: string,
  cleanCopy: (data: any) => Type,
  defaultObject: () => Type,
  providerElement: (
    context: EntryContextType<Type>,
    children: React.ReactNode
  ) => JSX.Element,
  referenceKey ?: string,
  defaultFilter ?: StringKeyStringValueObjectsType,
) {
  // return element
  return ({children}: { children: React.ReactNode }) => {
    // get data
    const [filter, setFilter] = useState<StringKeyStringValueObjectsType>(defaultFilter || {});
    const [reference, setReference] = useState<string>();
    const [entry, setEntry] = useState<Type>();
    const {data, save: saveApi, erase: eraseApi, reload: reloadData, loading} = useApi<Type>(`${ITEM_API_URL}/${itemKey}`);
    const reload = useCallback(() => {
      if (referenceKey === undefined)
        reloadData({...filter});
      else if (reference !== undefined)
        reloadData({[referenceKey]: reference, ...filter});
    }, [filter, reference, reloadData]);
    const update = useCallback((key: keyof Type, value: any) => {
      if (!entry) return;
      // copy entry and set value
      const c = {...entry};
      c[key] = value;
      // set entry
      setEntry(c);
    }, [entry]);
    const edit = useCallback((id: string | undefined, objectData ?: Type) => {
      // switch
      if (id === '' && objectData)
        return setEntry(cleanCopy(objectData))
      else if (id === '' && referenceKey !== undefined)
        return setEntry({[referenceKey]: reference, ...defaultObject()});
      else if (id === '')
        return setEntry(defaultObject());
      else if (id === undefined || !data)
        return setEntry(undefined); // no edit
      // find entry
      const c = data.find(e => e._id === id);
      // check if found
      if (!c) return setEntry(undefined); // not found -> no edit
      // otherwise return entry
      setEntry(c);
    }, [data, reference]);
    const saveCheck = useCallback((j: any) => {
      if (j.code && j.message) {
        // reject with error
        throw new Error(j.message);
      } else {
        // unset edit
        edit(undefined);
        // reload
        reload();
      }
    }, [edit, reload]);
    const save = useCallback(() => new Promise<void>((resolve, reject) => {
      // create clean copy
      let obj = cleanCopy(entry);
      // add reference
      let params: { [key: string]: string } = {};
      if (referenceKey !== undefined && reference !== undefined)
        params[referenceKey] = reference;
      // save object
      saveApi(entry?._id, obj, params)
        .then((j: any) => saveCheck(j))
        .then(() => resolve())
        .catch(e => reject(e));
    }), [entry, reference, saveApi, saveCheck]);
    const saveMany = useCallback((entries: Type[]) => new Promise<void>((resolve, reject) => {
      // create clean copy
      let objects = entries.map(entry => cleanCopy(entry));
      // add reference
      let param = undefined;
      if (referenceKey !== undefined)
        param = {[referenceKey]: reference};
      // save
      saveApi(undefined, objects, param)
        .then((j: any) => saveCheck(j))
        .then(() => resolve())
        .catch(e => reject(e));
    }), [reference, saveApi, saveCheck]);
    const erase = useCallback(() => new Promise<void>((resolve, reject) => {
      if (!entry || !entry._id) return
      // confirm
      if (window.confirm(`Do you really want to delete the item ${entry._id}?`)) {
        eraseApi(entry._id)
          .then((j: any) => saveCheck(j))
          .then(() => resolve())
          .catch(e => reject(e))
      }
    }), [entry, eraseApi, saveCheck]);
    const eraseAll = useCallback(() => new Promise<void>((resolve, reject) => {
      if (window.confirm('Do you really want to delete all items?')) {
        // add reference
        let param = undefined;
        if (referenceKey !== undefined)
          param = {[referenceKey]: reference};
        // erase
        eraseApi([], param)
          .then((j: any) => saveCheck(j))
          .then(() => resolve())
          .catch(e => reject(e))
      }
    }), [reference, eraseApi, saveCheck]);
    // effects
    useEffect(() => {
      reload();
    }, [reload]);
    // build context object
    const context = useMemo<EntryContextType<Type>>(() => ({
      entry,
      data,
      save,
      saveMany,
      erase,
      eraseAll,
      reload,
      edit,
      update,
      setReference,
      setFilter,
      loading
    }), [data, edit, entry, erase, eraseAll, loading, reload, save, saveMany, update]);
    // render
    return providerElement(context, children);
  };
}
