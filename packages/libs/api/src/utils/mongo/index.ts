import '@sdk/utils-lib'
import {Db, Document, ObjectId} from 'mongodb';
import CommitWrapper, {CommitType, DocumentInCommit} from "./CommitWrapper";
import ItemWrapper from "./ItemWrapper";
import DocumentWrapper, {DbDocumentType, LinkType, TagsType} from "./DocumentWrapper";
import {ErrorCodes} from "./ErrorCodes";

type UpdateCallback<T extends {}> = (documents : DbDocumentType<T>[]) => Partial<DbDocumentType<T>>[];
type DirectUpdateCallback<T extends {}> = (documents : DbDocumentType<T>[]) => ObjectId[];

export class DBClient<T extends {}> {

  items : ItemWrapper | undefined;
  documents : DocumentWrapper<T> | undefined;
  commits : CommitWrapper | undefined;

  /**
   * Initializes the collection wrappers
   * @param database Database to manage collections in
   * @param author Author ID
   */
  initCollections(database : Db, author ?: string) {
    // init wrappers
    this.items = new ItemWrapper(database);
    this.documents = new DocumentWrapper<T>(database);
    this.commits = new CommitWrapper(database);
    // set author
    author && this.setAuthor(author);
  }

  setAuthor(author : string) {
    this.commits?.setAuthor(new ObjectId(author))
  }

  /**
   * Clear all collections
   */
  async clear() {
    await this.items?.clear();
    await this.documents?.clear();
    await this.commits?.clear();
  }

  /**
   * Returns the commit ID of the head commit
   * @return the head commit ID
   */
  async getHeadCommitId() {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get commit
    const commit = await this.commits.getHead();
    // check commit
    if (!commit)
      throw new Error(ErrorCodes.NOT_FOUND);
    // return id
    return commit._id;
  }

  /**
   * Returns the document ID of the given item in the given commit
   * @param itemId Item ID
   * @param commit Commit ID (if not set, head is used)
   * @return The document ID or null if not exist in commit (e.g. deleted or invalid ID)
   */
  async getDocumentId(itemId : ObjectId, commit : ObjectId | undefined = undefined) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get commit
    const dbResult = await this.commits.get(commit);
    // find document reference by id (and return)
    const doc = dbResult.documents.find((e : DocumentInCommit) => e.item.toString() === itemId.toHexString());
    return doc?.document || null;
  }

  /**
   * Returns all documents corresponding to the head commit
   * @param filter Filter query (optional)
   * @return The head documents
   */
  async getHeadItems(filter ?: object) {
    return this._generateDocumentRequest({ isHead: true }, undefined, filter);
  }

  /**
   * Returns the document corresponding to the item and the head commit
   * @param itemId Item ID
   * @return The head document with the given item ID
   */
  async getHeadItem(itemId : ObjectId) {
    // get result array (should be one)
    return this._ensureSingle(await this._generateDocumentRequest({isHead: true}, {item: itemId}))
  }

  /**
   * Returns all documents within the commit
   * @param commitId Commit ID
   * @return A list of documents
   */
  async getItemsInCommit(commitId : ObjectId) {
    return this._generateDocumentRequest({ _id: commitId });
  }

  /**
   * Returns the document corresponding to the item at the given commit.
   * @param commitId Commit ID
   * @param itemId Item ID
   * @return The document
   */
  async getItemInCommit(commitId : ObjectId, itemId : ObjectId) {
    // get result array (should be one)
    return this._ensureSingle(await this._generateDocumentRequest({_id: commitId}, {item: itemId}));
  }

  /**
   * Adds an item within a new commit and saves the document accordingly.
   * @param body Body of the document
   * @param parent Parent item (optional)
   * @param tags Tags list (optional)
   * @return Item ID, document ID, commit ID, parent document ID (if set, otherwise null)
   */
  async addItem(body : T, parent ?: ObjectId, tags ?: TagsType) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // check body
    if (!DBClient._checkBody<T>(body))
      throw new Error(ErrorCodes.INTERNAL_FIELDS_IN_BODY)
    // create commit
    const commit = await this.commits.create(!!parent);
    // insert item
    const res = await this._insertItemAndDocumentEntry(body, commit.id, parent, tags);
    // add document to commit
    commit.base.push({item: res.item, document: res.document});
    // write link data
    let parentDoc : ObjectId | null = null;
    if (parent) {
      // save links and get doc ID
      const sourceDocs = await this._writeLinksIntoDocumentAndUpdateCommit(CommitWrapper.ensureWithPrevious(commit), [parent], [res.item], 'owns');
      parentDoc = sourceDocs[0];
    }
    // update commit
    await this.commits.update(commit.id, commit.base);
    // insert single
    return {
      item : res.item,
      document: res.document,
      commit: commit.id,
      parentDocument: parentDoc
    };
  }

  /**
   * Adds multiple items within a new commit and saves the documents accordingly.
   * @param bodies Bodies of the documents
   * @param parent Parent item (optional)
   * @param tags Tags list (optional)
   */
  async addItems(bodies : T[], parent ?: ObjectId, tags ?: TagsType) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // check bodies
    bodies.forEach(body => {
      if (!DBClient._checkBody<T>(body))
        throw new Error(ErrorCodes.INTERNAL_FIELDS_IN_BODY)
    });
    // create commit
    const commit = await this.commits.create(!!parent);
    // insert items
    const items = await Promise.all(bodies.map(body => this._insertItemAndDocumentEntry(body, commit.id, parent, tags)));
    // update base
    commit.base = [...commit.base, ...items.map(i => ({item: i.item, document: i.document}))];
    // write link into parent
    let parentDoc : ObjectId | null = null;
    if (parent) {
      // save links and get doc ID
      const sourceDocs = await this._writeLinksIntoDocumentAndUpdateCommit(CommitWrapper.ensureWithPrevious(commit), [parent], items.map(i => i.item), 'owns');
      parentDoc = sourceDocs[0];
      // update commit base
      const doc = commit.base.find(d => d.item.toHexString() === parent.toHexString());
      doc && (doc.document = parentDoc);
    }
    // save commit
    await this.commits.update(commit.id, commit.base);
    // insert many
    return {
      items: items.map(r => r.item),
      documents: items.map(r => r.document),
      commit: commit.id,
      parentDocument: parentDoc
    };
  }

  /**
   * Updates the item by storing the given body
   * @param itemId Item to be updated
   * @param body Body to be stored
   * @return The commit ID and the document ID
   */
  async updateItem(itemId : ObjectId, body : T) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // check body
    if (!DBClient._checkBody<T>(body))
      throw new Error(ErrorCodes.INTERNAL_FIELDS_IN_BODY)
    // check item
    if (!await this.getDocumentId(itemId))
      throw new Error(ErrorCodes.NOT_FOUND);
    // create commit
    const commit = CommitWrapper.ensureWithPrevious(await this.commits.create());
    // get old document
    const oldDocument = await this.getItemInCommit(commit.previous, itemId);
    const newDocument = {...oldDocument, ...body};
    // insert document
    const docId = await this._update(commit, newDocument, itemId);
    // return commit and doc ID
    return {commit: commit.id, document: docId};
  }

  /**
   * Changes one or more field of the item
   * @param itemId Item to be updated
   * @param fields Fields to be set
   * @return The commit ID and the document ID
   */
  async patchItemFields(itemId : ObjectId, fields : Partial<T>) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // check body
    if (!DBClient._checkBody<Partial<T>>(fields))
      throw new Error(ErrorCodes.INTERNAL_FIELDS_IN_BODY)
    // check item
    if (!await this.getDocumentId(itemId))
      throw new Error(ErrorCodes.NOT_FOUND);
    // create commit
    const commit = CommitWrapper.ensureWithPrevious(await this.commits.create());
    // insert document
    const oldDocument = await this.getItemInCommit(commit.previous, itemId);
    const body = DocumentWrapper._blankDataObject({...oldDocument, ...fields});
    const newDocument = {...oldDocument, ...body};
    // insert document
    const docId = await this._update(commit, newDocument, itemId);
    // return commit and doc ID
    return {commit: commit.id, document: docId};
  }

  /**
   * Updates the given fields
   * @param documentFilter Document filter
   * @param fnc Callback to manipulate the document
   * TODO: allow to update in callback (return null) -> create a second callback type
   */
  async patch(documentFilter : object, fnc : UpdateCallback<T> | DirectUpdateCallback<T>) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get documents
    const docs = await this.getHeadItems(documentFilter);
    if (docs.length === 0)
      throw new Error(ErrorCodes.NOT_FOUND);
    // create commit
    const commit = CommitWrapper.ensureWithPrevious(await this.commits.create());
    // execute callback with documents
    const fieldsOrIds = fnc(docs);
    // if fields is an array of IDs, the update has been done in the function
    let docIds : ObjectId[];
    if (Array.isArray(fieldsOrIds)) {
      // save to docIDs
      docIds = fieldsOrIds as ObjectId[];
    } else {
      // convert type of fields
      const f = fieldsOrIds as Partial<DbDocumentType<T>>[];
      console.log(f)
      // update document fields
      docIds = await Promise.all(docs.map(async (document, i) => {
        // get fields
        const newDocument = {...document, ...f[i]};
        // insert document
        return await this._update(commit, newDocument, document._item);
      }));
    }
    // return commit and doc ID
    return {commit: commit.id, documents: docIds};
  }

  /**
   * Creates a link between the source and the target item and backwards, when backType is set.
   * @param source Source item
   * @param target Target item
   * @param type Type of the link
   * @param backType Type of the back link
   * @return source doc ID, target docs IDs, commit ID
   */
  async linkItem(source : ObjectId, target : ObjectId, type : string, backType ?: string) {
    // check initialization
    if (!this.commits || !this.documents)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get documents
    let targetDocId = await this.getDocumentId(target);
    let sourceDocId = await this.getDocumentId(source);
    // check items to be available
    if (!sourceDocId || !targetDocId)
      throw new Error(ErrorCodes.NOT_FOUND);
    // create commit
    const commit = await this.commits.create();
    // write links and update commit
    const docs = await this._writeBiDirectionalLinksIntoDocumentAndUpdateCommit(CommitWrapper.ensureWithPrevious(commit), [source], [target], type, backType);
    // update commit
    await this.commits.update(commit.id, commit.base);
    // get target doc (if not created)
    let targetDoc = docs.targetDocs ? docs.targetDocs[0] : await this.getDocumentId(target);
    // return docs and commit
    return { source: docs.sourceDocs[0], target: targetDoc, commit: commit.id };
  }

  /**
   * Deletes the link
   * @param source Source of the link
   * @param target Target of the link
   * @param type Type of the link
   * @param backType Type of the back link (optional)
   * @return source doc ID, target doc ID (if back link type set), commit ID
   */
  async unlinkItem(source : ObjectId, target : ObjectId, type : string, backType ?: string) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get documents
    let targetDocId = await this.getDocumentId(target);
    let sourceDocId = await this.getDocumentId(source);
    // check items to be available
    if (!sourceDocId || !targetDocId)
      throw new Error(ErrorCodes.NOT_FOUND);
    // create commit
    const commit = CommitWrapper.ensureWithPrevious(await this.commits.create());
    // update source
    const sourceDoc = await this._incrementDocument(commit.previous, commit.id, source, (document : any) => {
      this._removeLinkFromDocument(document, target, type);
    });
    // update commit base
    const doc = commit.base.find(d => d.item.toHexString() === source.toHexString());
    doc && (doc.document = sourceDoc);
    // if back type is set ...
    if (backType) {
      // update target
      targetDocId = await this._incrementDocument(commit.previous, commit.id, target, (document: any) => {
        this._removeLinkFromDocument(document, source, backType);
      });
      // update target base
      const doc = commit.base.find(d => d.item.toHexString() === target.toHexString());
      doc && (doc.document = targetDocId);
    }
    // update commit
    await this.commits.update(commit.id, commit.base);
    // return docs and commit
    return { source: sourceDoc, target: targetDocId, commit: commit.id };
  }

  /**
   * Adds the given tags to the items
   * @param items Items to be updated
   * @param tags Tags to be set
   */
  async addTagToItems(items : ObjectId[], tags : TagsType) {
    // @ts-ignore
    return await this.patch({ _item: { $in: items } }, (docs) => docs.map(d => ({
      _tags: {...d._tags, ...tags}
    })));
  }

  /**
   * Get all head items with the given tag value 'tag=value'
   * @param tag Key of the tag
   * @param value Value of the tag
   */
  async getItemsByTag(tag : string, value : string) {
    // create filter
    const filter = {};
    filter[`_tags.${tag}`] = value
    // get items
    return this.getHeadItems(filter);
  }

  /**
   * Deletes the item given by its ID
   * @param itemId Item to be deleted
   * @return The IDs of the deleted items (including all sub items)
   */
  async deleteItem(itemId : ObjectId) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // check item
    if (!await this.getDocumentId(itemId))
      throw new Error(ErrorCodes.NOT_FOUND);
    // create commit
    const commit = CommitWrapper.ensureWithPrevious(await this.commits.create());
    // delete recursively
    const ids = await this._deleteItemsRecursively(itemId, commit.id, commit.previous);
    // remove from base
    ids.forEach(id => {
      commit.base.remove(d => d.item.toHexString() === id.toHexString());
    });
    // save base
    await this.commits.update(commit.id, commit.base);
    // return id
    return {ids: ids, commit: commit.id};
  }

  /**
   * Resets the head to the given commit or if commit not set to the latest commit
   * @param commitId Commit ID
   * @return The commit ID to which the head is reset
   */
  async resetHead(commitId ?: ObjectId) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get commit
    if (commitId) {
      // get commit
      const commit = this.commits.getHead();
      // check commit
      if (commit === null)
        throw new Error(ErrorCodes.NOT_FOUND);
    } else {
      // get latest commit
      commitId = (await this.commits.getLatest())._id;
    }
    // update
    await this.commits.resetHead(commitId);
    // send commit id
    return {commit: commitId};
  }

  /**
   * Returns the document corresponding to the commit filter and item filter
   * @param commitFilter Commit filter
   * @param itemFilter Item filter
   * @param documentFilter Document filter
   * @return The document
   */
  async _generateDocumentRequest(commitFilter : object, itemFilter ?: object, documentFilter ?: object) {
    // check initialization
    if (!this.commits)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get previous version of document
    let a : Document[] = [
      { $match: commitFilter },
      { $unwind: '$documents' },
      { $project: {
          document: '$documents.document',
          item: '$documents.item'
        }
      },
    ];
    // add item filter
    itemFilter && a.push({ $match: itemFilter });
    a = [...a,
      { $lookup: {
          from: this.items?.getCollectionName() || 'items',
          localField: 'item',
          foreignField: '_id',
          as: 'item'
        }},
      { $unwind: '$item' },
      { $lookup: {
          from: this.documents?.getCollectionName() || 'documents',
          localField: 'document',
          foreignField: '_id',
          as: 'document'
        }},
      { $unwind: '$document' },
      { '$replaceRoot': { 'newRoot': '$document' }  }
    ];
    documentFilter && a.push({ $match: documentFilter });
    // execute
    return await this.commits.aggregate<DbDocumentType<T>>(a);
  }

  /**
   * Ensures that the result has only one item. Throws NOT FOUND error if not.
   * @param results Result array to be checked
   * @return The single value
   */
  _ensureSingle(results : DbDocumentType<T>[]) {
    // check results
    if (results.length !== 1)
      throw new Error(ErrorCodes.NOT_FOUND);
    // return result
    return results[0];
  }

  /**
   * Inserts an item to the database.
   * 1. Inserts an item entry with the commit ID.
   * 2. Inserts a document to the database with reference to the item and the commit using the body as content.
   * @param body Content of the document
   * @param commitId Commit ID
   * @param parent Parent ID (optional)
   * @param tags Tags list (optional)
   * @return The item ID and the document ID
   */
  async _insertItemAndDocumentEntry(body : T, commitId : ObjectId, parent ?: ObjectId, tags ?: TagsType) {
    // check initialization
    if (!this.items || !this.documents)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // add item
    const itemId = await this.items.add(commitId);
    // create links
    const links = parent ? [{target: parent, type: 'owned_by'}] : [];
    // insert first document
    const docId = await this.documents.add(body, itemId, commitId, links, tags);
    // return item and document ID
    return {item: itemId, document: docId};
  }

  /**
   * Gets the current version of the document and updates to the new commit.
   * @param prevCommitId Original commit ID
   * @param nextCommitId The new commit ID
   * @param itemId Item ID
   * @param updateCallback Callback to update document
   * @return The document ID
   */
  async _incrementDocument( prevCommitId : ObjectId, nextCommitId : ObjectId, itemId : ObjectId, updateCallback : (document : any) => void) {
    // check initialization
    if (!this.documents)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // get document
    const document = await this.getItemInCommit(prevCommitId, itemId);
    // call update function
    updateCallback(document);
    // inserts document and returns its ID
    return await this.documents.add(DocumentWrapper._blankDataObject(document), itemId, nextCommitId, document?._links || []);
  }

  /**
   * Checks the body to contain internal fields (starting with _)
   * @param body Body to be checked
   * @returns Boolean indicating internal fields
   */
  static _checkBody<T extends {}>(body : T) {
    Object.keys(body).forEach(f => {
      // check for internal fields
      if (f.startsWith('_'))
        return false;
    });
    // all fine
    return true;
  }

  /**
   * Removes the link from the document
   * @param document Document to be updated
   * @param target Target item to be unlinked
   * @param type Type of the link
   */
  _removeLinkFromDocument(document : DbDocumentType<{}>, target : ObjectId, type : string) {
    // remove link TODO: return number of removed items
    return (document._links as LinkType[]).remove(
        a => (a.target.toString() === target.toHexString() && a.type === type)
    );
  }

  /**
   * Writes the links to the targets into all sources and updates the commit object
   * @param commit Commit objects
   * @param sources Source items
   * @param targets Target items
   * @param type Type of the link
   * @return The source document ID
   */
  async _writeLinksIntoDocumentAndUpdateCommit(commit : Required<CommitType>, sources : ObjectId[], targets : ObjectId[], type : string) {
    // for all source items
    return await Promise.all(sources.map(async source => {
      // update source
      const sourceDoc = await this._incrementDocument(commit.previous, commit.id, source, (document: any) => {
        // for each target ...
        targets.forEach(target => {
          // ... add link uniquely
          document._links = (document._links as LinkType[]).addUniquely({target, type},
            (a, b) => (a.target.toString() === b.target.toString() && a.type === b.type)
          );
        });
      });
      // update commit base
      const doc = commit.base.find(d => d.item.toHexString() === source.toHexString());
      doc && (doc.document = sourceDoc);
      // return
      return sourceDoc;
    }));
  }

  /**
   * Writes the links to the targets into all sources and back if backType is set and updates the commit object
   * @param commit Commit objects
   * @param sources Source items
   * @param targets Target items
   * @param type Type of the link
   * @param backType Type of the back link
   */
  async _writeBiDirectionalLinksIntoDocumentAndUpdateCommit(commit : Required<CommitType>, sources : ObjectId[], targets : ObjectId[], type : string, backType : string | undefined = undefined) {
    // write link
    const sourceDocs = await this._writeLinksIntoDocumentAndUpdateCommit(commit, sources, targets, type);
    // write back link
    let targetDocs : ObjectId[] | undefined = undefined;
    if (backType)
      targetDocs = await this._writeLinksIntoDocumentAndUpdateCommit(commit, targets, sources, backType);
    // return
    return {sourceDocs, targetDocs}
  }

  /**
   * Delete item recursively (sub items which are linked by 'owned')
   * @param itemId Item ID
   * @param commit New commit ID
   * @param previousCommit Previous commit ID
   * @return item IDs which were deleted
   */
  async _deleteItemsRecursively(itemId : ObjectId, commit : ObjectId, previousCommit: ObjectId) : Promise<ObjectId[]> {
    // get item links
    const doc = await this.getItemInCommit(previousCommit, itemId);
    // throw if not found
    const delIds = await Promise.all(doc._links.filter((l : any) => l.type === 'owns').map(async l => {
      return this._deleteItemsRecursively(l.target, commit, previousCommit);
    }));
    // return ID array
    return delIds.reduce((a, v) => a.concat(v), [itemId])
  }


  /**
   * Updates the item by creating a new document in the given commit and updates the commit
   * @param commit Commit object in which the document shall be created
   * @param document New document with all custom and internal fields (except for _id)
   * @param itemId Item ID
   * @return The document ID
   */
  async _update(commit : CommitType, document : DbDocumentType<T>, itemId : ObjectId) {
    // check initialization
    if (!this.commits || !this.documents)
      throw new Error(ErrorCodes.NOT_INITIALIZED);
    // create blank body
    const body = DocumentWrapper._blankDataObject(document);
    const newDocId = await this.documents.add(body, itemId, commit.id, document._links, document._tags);
    // update commit
    const idx = commit.base.findIndex(d => d.item.toHexString() === itemId.toHexString());
    // error handling
    if (idx === -1)
      throw new Error(ErrorCodes.RUNTIME_ERROR);
    // update document
    commit.base[idx].document = newDocId
    await this.commits.update(commit.id, commit.base);
    // return data
    return newDocId;
  }

  /**
   * Converts and returns the string to an ID object
   * @param id ID to be converted
   */
  static toId(id : string) {
    return ObjectId.createFromHexString(id);
  }

}
