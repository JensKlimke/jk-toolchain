# `api-lib`

## Features

### TODOs:

- [ ] Define start char for internal fields (currently hard-coded '_')
- [ ] Think about only linking in one direction for ownership
- [ ] Check where to rollback in case of errors (e.g. setting the new head, if failed, reset to old)
- [ ] The auth system does not work.
- [ ] Restructure mongo lib (as lib)
  - Each DB type could have a dedicated class/struct (commit, item, document)

### Mongo Features (to be tested)

- [x] Get head commit ID
  - Should return the commit head ID
- [x] Get document ID by item and commit
  - Existing item should return document ID
  - Non-existing/deleted item should return null
  - Non-existing commit should throw error
- [x] Get items at head
  - All documents of the head commit are returned
- [x] Get item by ID at head
  - The head document of the item is returned
- [x] Get items at commit
  - All documents within the commit are returned
- [x] Get item by ID at commit
  - The item with the given ID within the commit are returned
- [x] Add new item
  - A commit is created
  - An item is created
  - A document is created
  - New commit is head
  - Link to parent shall be set
- [x] Add many new items
  - A commit is created
  - _N_ items are created
  - _N_ documents are created
  - New commit is head
  - Links to parent shall be set
- [x] Update item by ID
  - A commit is created
  - A new document is created with the content
- [x] Patch fields of an item by ID
  - A commit is created
  - A new document is created
  - The fields to be changed are stored to the document
- [x] Delete item by ID
  - A commit is created
  - All sub-items are marked as deleted
  - The item is marked as deleted
- [ ] Delete all items by tags
  - All elements with the tags are deleted
- [x] Create a link between items (one-directional)
  - A commit is created
  - From the source item, a new document is created
  - The link is written into the document referring to the target item
- [x] Create links between items (bi-directional)
  - A commit is created
  - For each item, a new document is created
  - The links are written into the documents referring to the other item
- [x] Delete link from item (one-directional)
  - A commit is created
  - From the source item, a new document is created
  - The link, referring to the target item, is removed from the document
- [x] Delete links between items (bi-directional)
  - A commit is created
  - For each item, a new document is created
  - The links, referring to the other item, are removed from the documents
- [x] Reset head
  - Head markings are removed from all commits
  - The commit to be reset is marked as head
  - Head documents are set to reset head
- [x] Reset head to latest commit
  - Head markings are removed from all commits
  - The latest commit is marked as head
  - Head documents are set to reset head
- [ ] Add and remove tags of item
  - The tag is written to the item
- [x] Add an item with tags
  - The item is created
  - The tag is added
- [ ] Get items by tags
  - The items with the tag combination are returned
- [x] Convert string ID to ObjectId
- [ ] TODO: Patch items with callback
  - A commit is created
  - Each document is updated
  - Parent can be changed
- [ ] Workflows
- [ ] Filter definition to operate
  - Get items 
  - Bulk change items

### Additional test

- [x] Delete item, reset head to previous commit and try to update item -> should pass
- [x] Try to update deleted item -> should fail
- [x] Try to patch deleted item -> should fail
- [x] Try to link deleted item (as source) -> should fail
- [x] Try to link deleted item (as target) -> should fail
- [x] Try to unlink deleted item (as source) -> should fail
- [x] Try to unlink deleted item (as target) -> should fail
- [x] Try to delete deleted item (as target) -> should fail
- [ ] Try to add/update/patch with internal fields
- [ ] Try to update/patch/delete with different auth