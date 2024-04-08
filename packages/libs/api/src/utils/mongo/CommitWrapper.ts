import {Db, ObjectId} from "mongodb";
import CollectionWrapper from "./CollectionWrapper";
import {ErrorCodes} from "./ErrorCodes";

export type CommitType = { id : ObjectId, base: ItemDocList, previous ?: ObjectId }

export type DocumentInCommit = {
  item: ObjectId
  document: ObjectId
}

export type DbCommitType = {
  date : Date
  previous : ObjectId | null
  documents : DocumentInCommit[]
  author: ObjectId | null
  isHead: boolean
}

export type ItemDocList = { item: ObjectId, document: ObjectId }[];

class CommitWrapper extends CollectionWrapper<DbCommitType> {

  author : ObjectId | undefined = undefined

  constructor(database : Db, collectionName : string = 'commits') {
    super(database, collectionName);
  }

  /**
   * Sets the author
   * @param author
   */
  setAuthor(author : ObjectId) {
    this.author = author;
  }

  /**
   * Ensures that the previous field is set
   * @param commit Commit with previous
   */
  static ensureWithPrevious (commit : CommitType) : Required<CommitType> {
    // check commit
    if (!commit.previous)
      throw new Error(ErrorCodes.RUNTIME_ERROR);
    // return copy of commit (the previous field set with new Object ID is ignored)
    return {previous: ObjectId.createFromTime(0), ...commit};
  }


  /**
   * Returns the latest commit
   * @return The commit ID
   */
  async getLatest() {
    // get commit
    const commit = (await this.collection.find({}).sort({_id : -1}).limit(1).toArray());
    // error handling
    if (commit.length === 0)
      throw new Error(ErrorCodes.NOT_FOUND);
    // return ID
    return commit[0];
  }

  /**
   * Returns the head commit
   * @return the head commit
   */
  async getHead() {
    // get commit
    return this.collection.findOne({isHead : true});
  }

  /**
   * Resets the head to the given commit or if commit not set to the latest commit
   * @param commitId Commit ID
   * @return The commit ID to which the head is reset
   */
  async resetHead(commitId ?: ObjectId) {
    // unset all other
    const unsetRes = await this.collection.updateOne({isHead: true}, {$set: {isHead: false}});
    // error handling
    if (!unsetRes.acknowledged)
      throw new Error(ErrorCodes.RUNTIME_ERROR);
    // set commit as head
    const setRes = await this.collection.updateOne({_id: commitId}, {$set: {isHead: true}});
    // error handling
    if (!setRes.acknowledged)
      throw new Error(ErrorCodes.RUNTIME_ERROR);
    // send commit id
    return {commit: commitId};
  }

  /**
   * Creates a commit, sets the previous commit (head commit) and sets the head to the new commit
   * @return The commit ID, the base (documents of the previous commit), the previous commit ID
   */
  async create(ensurePrevious : boolean = false) : Promise<CommitType> {
    // get last commit
    const prev = (await this.collection.findOne({isHead: true}));
    // check previous
    if (ensurePrevious && prev === null)
      throw new Error(ErrorCodes.NOT_FOUND)
    // create commit
    const commit = await this.collection.insertOne({
      date: new Date(),
      previous: prev?._id || null,
      documents: [],
      author: this.author || null,
      isHead: true
    });
    // error handling
    if (!commit.acknowledged)
      throw new Error(ErrorCodes.COULD_NOT_INSERT);
    // save commit id
    const commitId = commit.insertedId;
    // has previous
    if (prev) {
      // update previous (unset head flag) and return with previous
      await this.collection.updateOne({_id: prev._id}, {$set: {isHead: false}});
      return {id: commitId, base: prev.documents, previous: prev._id};
    }
    // return without previous
    return {id: commitId, base: []};
  }

  /**
   * Updates the documents list of the given commit in the database
   * @param commitId Commit ID
   * @param documents Documents list to be set
   */
  async update(commitId : ObjectId, documents : ItemDocList) {
    // save documents
    const res = await this.collection.updateOne({_id: commitId}, { $set: { documents } });
    // error handling
    if (!res.acknowledged)
      throw new Error(ErrorCodes.COULD_NOT_UPDATE)
  }

  /**
   * Returns the commit with the given ID. Is not given, returns head commit
   * @param commitId Commit ID
   */
  async get(commitId ?: ObjectId) {
    // create commit filter
    const commitFilter : any = commitId ? { '_id' : commitId } : { isHead : true };
    // get commit from database
    const commit = await this.collection.findOne<DbCommitType>(commitFilter);
    // if not exist, return null
    if (!commit)
      throw new Error(ErrorCodes.NOT_FOUND);
    // return result
    return commit;
  }

}

export default CommitWrapper;
