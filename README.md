# JK Toolchain

## Items API

**Main item operations**

TODO: filter

- [ ] `POST /items {...}` Adds a single new item
  - Body `ItemData`
  - Response `Return<T>`
- [ ] `POST /items [{...}, {...}]` Adds multiple new items
  - Body `ItemData[]`
  - Response `Return<T>[]`
- [ ] `GET /items` Gets all items
  - Response `Return<T>[]`
- [ ] `PUT /items/{item} {...}` Updates the item
  - Body `ItemData`
  - Response `Return<T>`
- [ ] `PATCH /items/{item} {...}` Modifies the item
  - Body `Partial<ItemData>`
  - Response `Return<T>[]`
- [ ] `DELETE /items/{item}` Deletes item and its sub-items
  - Response `string[]` List of deleted IDs
- [ ] `DELETE /items/` Deletes all items
  - Response `string[]` List of deleted IDs

** Tags operations **

- [ ] `POST /items/{id}/tags {...}` Adds tags to the item
  - Description: Existing tags are ignored. Existing tag keys are overwritten.
  - Body `{[key : string] : TagValueType}` The tags to be added
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `GET /items/{id}/tags` Returns the tags of the item
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `PUT /items/{id}/tags {...}` Replaces all tags of the item
  - Description: All previous tags are deleted.
  - Body `{[key : string] : TagValueType}` The tags to be set
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `PATCH /items/{item}/tags/{tagKey} {...}` Modifies the tag with the given tag key by setting the new value
  - Body `TagValueType`
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `DELETE /items/{id}/tags` Deletes the tags from the item
  - Description: Tags which completely defined (tag value != undefined) are deleted if they fit with key and value. Tags with value set to undefined are deleted if key fits (the value is ignored).
  - Body `{[key : string] : TagValueType | undefined }` The tags to be deleted
  - Response `{[key : string] : TagValueType}` The complete tag object of the item

** Labels operations **

- [ ] `POST /items/{id}/labels [...]` Adds labels to the item
  - Description: Existing labels are ignored.
  - Body `string[]` The labels to be added
  - Response `string[]` The complete labels array of the item
- [ ] `GET /items/{id}/labels` Returns the labels of the item
  - Response `string[]` The complete labels array of the item
- [ ] `PUT /items/{id}/labels [...]` Replaces all labels of the item
  - Description: All previous labels are deleted.
  - Body `string[]` The labels to be set    
  - Response `string[]` The complete labels array of the item
- [ ] `DELETE /items/{id}/labels` Deletes the labels from the item
  - Unknown labels are ignored.
  - Body `string[]` The labels to be deleted
  - Response `string[]` The complete labels array of the item
     
** Links operations **

- [ ] `POST /items/{id}/links {...}` Adds new links to the item
  - Description: Existing links are ignored.
  - Body `LinkType[]` The links to be added
  - Response `LinkType[]` The complete links array of the item
- [ ] `GET /items/{id}/links` Returns the links of the item
  - TODO: Filter by link type    
  - Response `LinkType[]` The links array of the item
- [ ] `DELETE /items/{id}/links` Deletes the links from the item
  - Description: Links which completely defined (link type != undefined and target != undefined) are deleted if they fit with type and target. Links with target not set are deleted if type fits (the target is ignored).
  - Body `{type : string, target ?: string}` The tags to be deleted
  - Response `LinkType[]` The links array of the item
     
** Status operations **

see more about status (TODO)

- [ ] `PATCH /items/{id}/status {...}` Updates the status
  - Description: Status can only be changed to a new state by a valid transition.
  - Body `string` The transition key to follow
  - Response `{status : string, }` The complete links array of the item
- [ ] `GET /items/{id}/links` Returns the links of the item
  - TODO: Filter by link type    
  - Response `LinkType[]` The links array of the item


### Types

**Item data set without ID**

    type ItemData = {
      title : string
      quantity : number
    }

**Data with ID**

    type Document<T> = T & {
      _id : ObjectId
      _commit : ObjectId
      _item : ObjectId
      _tags : Record<string, TagValueType>
      _labels : string[]
      _links : { target : ObjectId, type : string }
      _status : string 
    }

**Mapping to return types**

TODO: check if tags, labels, links, etc. are added

    type TagValueType = string | number | boolean | null;
    type LinkType = {type : string, target : string};

    type Return<T> = T & {
      id : string // (= Document<T>._item.toHexString())
    }

## TODOs

- [ ] Add created field to commit
- [ ] Rank (by order in commit base)


