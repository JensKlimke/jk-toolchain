import {describe, beforeAll, beforeEach, afterAll, expect, test} from '@jest/globals';
import {MongoClient, ObjectId} from 'mongodb';
import {DBClient} from '../src/utils/mongo';
import {MONGO_URL} from '../src/config/env';
import {ErrorCodes} from "../src/utils/mongo/ErrorCodes";

interface DataType {
  label: string,
  fieldAdded ?: boolean
  stringField ?: string
  numberField ?: number
}

describe('Mongo wrapper', () => {

  let mongoClient: MongoClient = new MongoClient(MONGO_URL);
  let client = new DBClient<DataType>();

  beforeAll(async () => {
    // connect to mongo client and init wrapper
    await mongoClient.connect();
    client.initCollections(mongoClient.db('test'), '000000000000000000000000');
  })

  afterAll(() => {
    // disconnect
    mongoClient.close();
  })

  describe('Database Base Features', () => {

    let commits: any[] = [];

    beforeEach(async () => {
      // empty collections
      await client.clear();
      // clean up caches
      commits = [];
      // add items
      commits.push(await client.addItems([
        {label: 'item0'},
        {label: 'item1'},
        {label: 'item2'}
      ]));
      // add another item
      commits.push(await client.addItem({label: 'item3'}, commits[0].items[0]));
      // change item
      commits.push(await client.updateItem(commits[0].items[0], {label: 'item0a'}));
      // add another item and delete
      commits.push(await client.addItem({label: 'delete'}));
      commits.push(await client.deleteItem(commits[3].item));
    });

    test('Convert string id to object ID', async () => {
      // generate IDs
      const id = '0a1b2c3d4e5f6a7b8c9d0a1b'
      const obj = DBClient.toId(id);
      // check type and content
      expect(obj.constructor.name).toEqual(ObjectId.name);
      expect(obj.toHexString()).toEqual(id);
    });

    test('Get head commit ID', async () => {
      // get head ID and check
      const head = await client.getHeadCommitId();
      expect(head).toEqual(commits[4].commit);
    });

    test('Get document by item and commit', async () => {
      // check existing and non-existing item
      expect(await client.getDocumentId(commits[0].items[0])).toEqual(commits[2].document);
      expect(await client.getDocumentId(ObjectId.createFromTime(999))).toBeNull();
      // delete item and check again at head and at creation commit
      expect(await client.getDocumentId(commits[3].item)).toBeNull();
      expect(await client.getDocumentId(commits[3].item, commits[3].commit)).toEqual(commits[3].document);
      // try to access unknown commit ID
      const f1 = async () => await client.getDocumentId(commits[0].items[0], new ObjectId());
      await expect(f1).rejects.toThrow(ErrorCodes.NOT_FOUND);
    });

    test('Get items at head', async () => {
      // get all head documents
      const result = await client.getHeadItems();
      // check results (length and labels)
      expect(result.length).toBe(4);
      expect(result[0].label).toBe('item0a');
      expect(result[1].label).toBe('item1');
      expect(result[2].label).toBe('item2');
      expect(result[3].label).toBe('item3');
    });

    test('Get items by ID at head', async () => {
      // get item ID
      const item = commits[0].items[0];
      // get all head documents
      const result = await client.getHeadItem(item);
      // check result
      expect(result).toEqual({
        _id: commits[2].document,
        label: 'item0a',
        _item: item,
        _commit: commits[2].commit,
        _links: [{
          target: commits[1].item,
          type: 'owns'
        }],
        _tags: {}
      })
    });

    test('Get items at commit', async () => {
      // get commit ID
      const commit = commits[1].commit;
      // get all head documents
      const result = await client.getItemsInCommit(commit);
      // check results (length and labels)
      expect(result.length).toBe(4);
      expect(result[0].label).toBe('item0');
      expect(result[1].label).toBe('item1');
      expect(result[2].label).toBe('item2');
      expect(result[3].label).toBe('item3');
    });

    test('Get item at commit', async () => {
      // get commit ID
      const commit = commits[2].commit;
      const item = commits[1].item;
      // get all head documents
      const result = await client.getItemInCommit(commit, item);
      // check result
      expect(result).toEqual({
        _id: commits[1].document,
        label: 'item3',
        _item: item,
        _commit: commits[1].commit,
        _links: [{
          target: commits[0].items[0],
          type: 'owned_by'
        }],
        _tags: {}
      });
    });

    test('Add new item (with parent and tags)', async () => {
      // add item
      const parent = commits[0].items[1];
      const tags = {tag1: 't01', tag2: 't02'};
      const added = await client.addItem({label: 'item4'}, parent, tags);
      // get head commit and check commit ID
      const head = await client.getHeadCommitId();
      expect(added.commit).toEqual(head);
      // get content and check label and document ID
      const doc = await client.getHeadItem(added.item);
      expect(doc).toEqual({
        _id: added.document,
        _item: added.item,
        _commit: added.commit,
        _links: [{
          target: parent,
          type: 'owned_by'
        }],
        _tags: tags,
        label: 'item4',
      });
      // check parent document
      const parentDoc = await client.getHeadItem(parent);
      expect(parentDoc).toEqual({
        _commit: added.commit,
        _item: parent,
        _id: added.parentDocument,
        _links: [{
          target: added.item,
          type: 'owns'
        }],
        _tags: {},
        label: 'item1'
      });
    });

    test('Add many new items (with parent and tags)', async () => {
      // add item
      const parent = commits[0].items[1];
      const tags = {tag1: 't01', tag2: 't02'};
      const added = await client.addItems([
        {label: 'item4'},
        {label: 'item5'},
      ], parent, tags);
      // check the second commit
      expect(added.items.length).toBe(2);
      expect(added.documents.length).toBe(2);
      // get head commit
      const head = await client.getHeadCommitId();
      expect(added.commit).toEqual(head);
      // get content and check labels and document IDs
      const docs = await client.getHeadItems();
      expect(docs[4]).toEqual({
        _commit: added.commit,
        _item: added.items[0],
        _id: added.documents[0],
        _links: [{
          target: parent,
          type: 'owned_by'
        }],
        _tags: tags,
        label: 'item4'
      });
      expect(docs[5]).toEqual({
        _commit: added.commit,
        _item: added.items[1],
        _id: added.documents[1],
        _links: [{
          target: parent,
          type: 'owned_by'
        }],
        _tags: tags,
        label: 'item5'
      });
      // check parent document
      const parentDoc = await client.getHeadItem(parent);
      expect(parentDoc).toEqual({
        _commit: added.commit,
        _item: parent,
        _id: added.parentDocument,
        _links: [{
          target: added.items[0],
          type: 'owns'
        },
          {
            target: added.items[1],
            type: 'owns'
          }
        ],
        _tags: {},
        label: 'item1'
      });
    });

    test('Update item by ID', async () => {
      // update item
      const item = commits[0].items[1];
      const update = await client.updateItem(item, {
        label: 'item1b',
        fieldAdded: true
      });
      // get head commit
      const head = await client.getHeadCommitId();
      expect(update.commit).toEqual(head);
      // check document
      const doc = await client.getHeadItem(item);
      expect(doc).toEqual({
        _id: update.document,
        _item: item,
        _commit: update.commit,
        _links: [],
        _tags: {},
        label: 'item1b',
        fieldAdded: true,
      })
    });

    test('Patch fields of an item by ID', async () => {
      // update item
      const item = commits[0].items[1];
      const update = await client.patchItemFields(item, {
        fieldAdded: true
      });
      // get head commit
      const head = await client.getHeadCommitId();
      expect(update.commit).toEqual(head);
      // check document
      const doc = await client.getHeadItem(item);
      expect(doc).toEqual({
        _id: update.document,
        _item: item,
        _commit: update.commit,
        _links: [],
        _tags: {},
        label: 'item1',
        fieldAdded: true,
      })
    });

    test('Delete item by ID', async () => {
      // add more items as sub-sub-child
      const subSub = await client.addItems([
        {label: 'item3-sub0'},
        {label: 'item3-sub1'},
      ], commits[1].item);
      // check number of documents
      let docs = await client.getHeadItems();
      expect(docs.length).toBe(6);
      // delete item
      const item = commits[0].items[0];
      const del = await client.deleteItem(item);
      // get deletion commit to be head commit
      const head = await client.getHeadCommitId();
      expect(del.commit).toEqual(head);
      // check deleted items
      expect(del.ids.length).toBe(4);
      expect(del.ids[0]).toEqual(item);
      expect(del.ids[1]).toEqual(commits[1].item);
      expect(del.ids[2]).toEqual(subSub.items[0]);
      expect(del.ids[3]).toEqual(subSub.items[1]);
      // check remaining documents
      docs = await client.getHeadItems();
      expect(docs.length).toBe(2);
      expect(docs[0].label).toEqual('item1');
      expect(docs[1].label).toEqual('item2');
    });

    test('Create a link between items (one-directional)', async () => {
      // get items to link
      const source = commits[0].items[1];
      const target = commits[0].items[2];
      // link items
      const link = await client.linkItem(source, target, 'link');
      // get head commit
      const head = await client.getHeadCommitId();
      expect(link.commit).toEqual(head);
      // check documents
      const docSource = await client.getHeadItem(source);
      const docTarget = await client.getHeadItem(target);
      expect(docSource._links).toEqual([{
        target: target,
        type: 'link'
      }]);
      expect(docTarget._links).toEqual([]);
      // check target and source document
      expect(link.source).toEqual(docSource._id);
      expect(link.target).toEqual(docTarget._id);
    });

    test('Create links between items (bi-directional)', async () => {
      // get items to link
      const source = commits[0].items[1];
      const target = commits[0].items[2];
      // link items
      const link = await client.linkItem(source, target, 'link', 'back');
      // get head commit
      const head = await client.getHeadCommitId();
      expect(link.commit).toEqual(head);
      // check document
      const docSource = await client.getHeadItem(source);
      const docTarget = await client.getHeadItem(target);
      expect(docSource._links).toEqual([{
        target: target,
        type: 'link'
      }]);
      expect(docTarget._links).toEqual([{
        target: source,
        type: 'back'
      }]);
      // check target and source document
      expect(link.source).toEqual(docSource._id);
      expect(link.target).toEqual(docTarget._id);
    });

    test('Delete link from item (one-directional)', async () => {
      // get items to link
      const source = commits[0].items[0];
      const target = commits[1].item;
      // link items
      const link = await client.unlinkItem(source, target, 'owns');
      // get head commit
      const head = await client.getHeadCommitId();
      expect(link.commit).toEqual(head);
      // check documents
      const docSource = await client.getHeadItem(source);
      const docTarget = await client.getHeadItem(target);
      expect(docSource._links).toEqual([]);
      expect(docTarget._links).toEqual([{
        target: source,
        type: 'owned_by'
      }]);
      // check target and source document
      expect(link.source).toEqual(docSource._id);
      expect(link.target).toEqual(docTarget._id);
    });

    test('Delete link between items (bi-directional)', async () => {
      // get items to link
      const source = commits[0].items[0];
      const target = commits[1].item;
      // link items
      const link = await client.unlinkItem(source, target, 'owns', 'owned_by');
      // get head commit
      const head = await client.getHeadCommitId();
      expect(link.commit).toEqual(head);
      // check documents
      const docSource = await client.getHeadItem(source);
      const docTarget = await client.getHeadItem(target);
      expect(docSource._links).toEqual([]);
      expect(docTarget._links).toEqual([]);
      // check target and source document
      expect(link.source).toEqual(docSource._id);
      expect(link.target).toEqual(docTarget._id);
    });

    test('Reset head and set to latest again', async () => {
      // reset head and check return value
      const head = await client.resetHead(commits[0].commit);
      expect(head.commit).toEqual(commits[0].commit);
      // get head commit and check
      const commit = await client.getHeadCommitId();
      expect(commit).toEqual(head.commit);
      // check documents
      const docs = await client.getHeadItems();
      expect(docs.length).toBe(3);
      // reset head back to latest and check return value
      const latest = await client.resetHead();
      expect(latest.commit).toEqual(commits[4].commit);
    });

    test('Delete item, reset head to previous commit and try to update item', async () => {
      // item ID
      const item = commits[0].items[0];
      // patch deleted item
      await client.patchItemFields(commits[0].items[1], {
        fieldAdded: true
      });
      // delete item
      const del = await client.deleteItem(item);
      // reset head and check return value
      await client.resetHead(commits[0].commit);
      // patch deleted item
      const update = await client.patchItemFields(del.ids[0], {
        fieldAdded: true
      });
      // get head commit
      const head = await client.getHeadCommitId();
      expect(update.commit).toEqual(head);
      // get documents and check
      const docs = await client.getHeadItems();
      expect(docs.length).toBe(3);
      // first item (updated)
      expect(docs[0]).toEqual({
        _commit: update.commit,
        _id: update.document,
        _item: item,
        _links: [],
        _tags: {},
        fieldAdded: true,
        label: 'item0'
      });
      // second item (not updated)
      expect(docs[1]).toEqual({
        _commit: commits[0].commit,
        _id: commits[0].documents[1],
        _item: commits[0].items[1],
        _links: [],
        _tags: {},
        label: 'item1'
      });
      // third item (not updated)
      expect(docs[2]).toEqual({
        _commit: commits[0].commit,
        _id: commits[0].documents[2],
        _item: commits[0].items[2],
        _links: [],
        _tags: {},
        label: 'item2'
      });
    });

    test('Try to update/patch/link/delete deleted item', async () => {
      // get item IDs
      const item = commits[0].items[0];
      const other = commits[0].items[1];
      // delete item
      await client.deleteItem(item);
      // try to update item
      const f0 = async () => await client.updateItem(item, {label: 'fail'});
      await expect(f0).rejects.toThrow(ErrorCodes.NOT_FOUND);
      // try to patch item
      const f1 = async () => await client.patchItemFields(item, {fieldAdded: true});
      await expect(f1).rejects.toThrow(ErrorCodes.NOT_FOUND);
      // try to link item
      const f2a = async () => await client.linkItem(item, other, 'link');
      await expect(f2a).rejects.toThrow(ErrorCodes.NOT_FOUND);
      const f2b = async () => await client.linkItem(other, item, 'link');
      await expect(f2b).rejects.toThrow(ErrorCodes.NOT_FOUND);
      // try to unlink item
      const f3a = async () => await client.unlinkItem(item, other, 'link');
      await expect(f3a).rejects.toThrow(ErrorCodes.NOT_FOUND);
      const f3b = async () => await client.unlinkItem(other, item, 'link');
      await expect(f3b).rejects.toThrow(ErrorCodes.NOT_FOUND);
      // try to patch item
      const f4 = async () => await client.deleteItem(item);
      await expect(f4).rejects.toThrow(ErrorCodes.NOT_FOUND);
    });

  });

  describe('Filter Features', () => {

    let commits: any[] = [];

    beforeEach(async () => {
      // empty collections
      await client.clear();
      // clean up caches
      commits = [];
      // add items
      commits.push(await client.addItems([
        {label: 'item0', stringField: 'group0', numberField: 0},
        {label: 'item1', stringField: 'group0', numberField: 1},
        {label: 'item2', stringField: 'group1', numberField: 1}
      ], undefined, {type: 'firstItems'}));
    });

    test('Get with simple filter', async () => {
      // get elements by filter
      const res = await client.getHeadItems({stringField: 'group0'});
      expect(res.length).toBe(2);
      // check labels
      expect(res[0].label).toEqual('item0');
      expect(res[1].label).toEqual('item1');
    });

    test('Update with simple filter', async () => {
      // patch elements by filter (add tag group='group0')
      const filter = {stringField: 'group0'};
      const update = await client.patch(filter, (docs) => {
        return docs.map(document => ({_tags: {...document._tags, group: 'group0'}}));
      });
      // check number of updates
      expect(update.documents.length).toBe(2);
      // get documents
      const res = await client.getHeadItems(filter)
      expect(res.length).toBe(2);
      expect(res[0]).toEqual({
        _id: update.documents[0],
        _item: commits[0].items[0],
        _commit: update.commit,
        label: 'item0',
        stringField: 'group0',
        numberField: 0,
        _links: [],
        _tags: {
          type: 'firstItems',
          group: "group0"
        }
      });
      expect(res[1]).toEqual({
        _id: update.documents[1],
        _item: commits[0].items[1],
        _commit: update.commit,
        label: 'item1',
        stringField: 'group0',
        numberField: 1,
        _links: [],
        _tags: {
          type: 'firstItems',
          group: "group0"
        }
      });
    });

  });

  describe('Tag Features', () => {

    let commits: any[] = [];

    beforeEach(async () => {
      // empty collections
      await client.clear();
      // clean up caches
      commits = [];
      // add items
      commits.push(await client.addItems([
        {label: 'item0'},
        {label: 'item1'},
        {label: 'item2'}
      ], undefined, {type: 'test'}));
    });

    test('Add tags manually', async () => {
      // add tag
      await client.addTagToItems([commits[0].items[0], commits[0].items[1]], {hello: 'world'});
      // apply new filter and get results
      const res = await client.getItemsByTag('hello', 'world');
      expect(res.length).toBe(2);
      expect(res[0].label).toEqual('item0');
      expect(res[0]._tags).toEqual({hello: 'world', type: 'test'});
      expect(res[1].label).toEqual('item1');
      expect(res[1]._tags).toEqual({hello: 'world', type: 'test'});
    });

  });

})
