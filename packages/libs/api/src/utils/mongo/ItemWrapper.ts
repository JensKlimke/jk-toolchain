import {Db, ObjectId} from "mongodb";
import CollectionWrapper from "./CollectionWrapper";
import {ErrorCodes} from "./ErrorCodes";

export type DbItemType = {
  creationCommit : ObjectId
}

class ItemWrapper extends CollectionWrapper<DbItemType> {

  constructor(database : Db, collectionName : string = 'items') {
    super(database, collectionName);
  }

  /**
   * Adds a item entry to the database
   * @param commitId Commit ID
   * @returns ID of the inserted item
   */
  async add(commitId : ObjectId) {
    // create item
    const itemRes = await this.collection.insertOne({
      creationCommit : commitId,
    });
    // error handling
    if (!itemRes.acknowledged)
      throw new Error(ErrorCodes.COULD_NOT_INSERT);
    // save id
    return itemRes.insertedId;
  }


}

export default ItemWrapper;