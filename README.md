# JK Toolchain

## Items API

**Entity operations**

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
  - Body `{[key : string] : string | number | boolean}` The tags to be added
  - Response `{[key : string] : string | number | boolean}` The complete tag object of the item
- [ ] `GET /items/{id}/tags` Returns the tags of the item
  - Response `{[key : string] : string | number | boolean}` The complete tag object of the item
- [ ] `DELETE /items/{id}/tags`
  - Body `{[key : string] : string | number | boolean | }` The tags to be added
  - Response `{[key : string] : string | number | boolean}` The complete tag object of the item

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
      _tags : Record<string, string | number | boolean>
      _labels : string[]
      _links : { target : ObjectId, type : string }
      _status : string
    }

**Mapping to return types**

TODO: check if tags, labels, links, etc. are added

    type Return<T> = T & {
      id : string // (= Document<T>._item.toHexString())
    }

## TODOs

- [ ] Add created field to commit


