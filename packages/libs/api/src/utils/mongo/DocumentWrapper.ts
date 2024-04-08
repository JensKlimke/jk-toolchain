import {Db, ObjectId} from "mongodb";
import CollectionWrapper from "./CollectionWrapper";
import {ErrorCodes} from "./ErrorCodes";

export type LinkType = { target: ObjectId, type: string }
export type TagsType = { [key : string]: string }

export type DbDocumentType<T extends {} = any> = T & {
  _id : ObjectId
  _item: ObjectId
  _commit: ObjectId
  _links: LinkType[]
  _tags: TagsType
}

class DocumentWrapper<T extends {}> extends CollectionWrapper<DbDocumentType<T>> {

  constructor(database : Db, collectionName : string = 'documents') {
    super(database, collectionName);
  }

  /**
   * Empty collection
   */
  async clear() {
    // delete all elements
    const del = await this.collection.deleteMany({});
    // error handling
    if (!del.acknowledged)
      throw new Error(ErrorCodes.RUNTIME_ERROR);
  }

  /**
   * Inserts a document entry to the database.
   * Uses body as content and adds item ID, commit ID and (empty) links
   * @param body Content of the entry
   * @param itemId Item ID
   * @param commitId Commit ID
   * @param links Link list
   * @param tags Tag list
   * @return The document ID
   */
  async add(body : T, itemId : ObjectId, commitId : ObjectId, links : LinkType[] = [], tags : TagsType = {}) {
    // create data body
    const document = {
      ...body,
      _item: itemId,
      _commit: commitId,
      _links: links,
      _tags: tags
      // TODO: _labels
      // TODO: _status (workflow)
    };
    // insert document
    // @ts-ignore
    const res = await this.collection.insertOne(document);
    // error handling
    if (!res.acknowledged)
      throw new Error(ErrorCodes.COULD_NOT_INSERT)
    // save and get document ID
    return res.insertedId;
  }

  /**
   * Removes all internal fields from the object. Internal fields start with '_'
   * @param obj Object to be cleaned
   * @return The cleaned object
   */
  static _blankDataObject<T extends {}>(obj : DbDocumentType<T>) : T {
    // copy object
    let newObject = {...obj};
    // remove all keys with
    Object.keys(obj).forEach(key => key.startsWith('_') && (delete newObject[key]));
    // return object
    return newObject;
  }

}

export default DocumentWrapper;