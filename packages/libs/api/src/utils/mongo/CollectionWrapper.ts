import {Collection, Db} from "mongodb";
import {ErrorCodes} from "./ErrorCodes";

export default class CollectionWrapper<T extends {}> {

  collection : Collection<T>;

  /**
   * Constructs the item object
   * @param db Database to manage items in
   * @param collectionName Collection name of the items (default is 'items')
   */
  constructor(db : Db, collectionName : string) {
    // save collection
    this.collection = db.collection<T>(collectionName);
  }

  /**
   * Returns the collection name
   * @returns Collection name
   */
  getCollectionName() : string {
    return this.collection.collectionName;
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
   * Calls the aggregation
   * @param documents Aggregation definition
   * @returns The result of the aggregation as array
   */
  async aggregate<S extends {} = T>(documents : Document[]) {
    // call aggregation
    return await this.collection.aggregate<S>(documents).toArray();
  }


}