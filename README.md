# JK Toolchain

## Items API

**Main item operations**

- [ ] `POST /items {...}` Adds a single new item
  - Body `UploadDoc<any>`
  - Response 201 `ResponseDoc<any>`
- [ ] `POST /items [{...}, {...}]` Adds multiple new items
  - Body `UploadDoc<any>[]` The item data
  - Response 201 `ResponseDoc<any>[]` The created item
- [ ] `GET /items` Returns all or the filtered items
  - Query `filter ?: FilterType` Defines the filter of the items  
  - Response 200 `ResponseDoc<any>[]` The requested elements
- [ ] `GET /items/{item}` Returns the requested item
  - Parameter `item : string` The item ID
  - Response 200 `ResponseDoc<any>` The requested element
- [ ] `PUT /items/{item} {...}` Updates the item
  - Body `any` The item data 
  - Response 200 `ResponseDoc<any>` The changed item
- [ ] `PATCH /items/{item} {...}` Modifies the item
  - Parameter `item : string` The item ID
  - Body `Partial<UploadDoc<any>>` The fields to be changed
  - Response 200 `ResponseDoc<any>` The changed item
- [ ] `PATCH /items {...}` Modifies all or the filtered items
  - Query `filter ?: FilterType` Defines the filter of the items  
  - Body `Partial<UploadDoc<any>>` The fields to be changed
  - Response 200 `ResponseDoc<any>[]` The changed items
- [ ] `DELETE /items/{item}` Deletes item and its sub-items
  - Parameter `item : string` The item ID
  - Response 200 `string[]` List of deleted IDs
- [ ] `DELETE /items/` Deletes all or the filtered items
  - Query `filter ?: FilterType` Defines the filter of the elements  
  - Response 200 `string[]` List of deleted IDs

**Tags operations**

- [ ] `POST /items/{item}/tags {...}` Adds tags to the item
  - Description: Existing tags are ignored. Existing tag keys are overwritten.
  - Parameter `item : string` The item ID
  - Body `{[key : string] : TagValueType}` The tags to be added
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `GET /items/{item}/tags` Returns the tags of the item
  - Parameter `item : string` The item ID
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `PUT /items/{item}/tags {...}` Replaces all tags of the item
  - Description: All previous tags are deleted.
  - Parameter `item : string` The item ID
  - Body `{[key : string] : TagValueType}` The tags to be set
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `PATCH /items/{item}/tags/{tagKey} {...}` Modifies the tag with the given tag key by setting the new value
  - Description: Creates the tag, if key is unknown.
  - Parameter `item : string` The item ID
  - Parameter `tagKey : string` The key of the tag
  - Body `TagValueType`
  - Response `{[key : string] : TagValueType}` The complete tag object of the item
- [ ] `DELETE /items/{item}/tags` Deletes the tags from the item
  - Description: Tags which completely defined (tag value != undefined) are deleted if they fit with key and value. Tags with value set to undefined are deleted if key fits (the value is ignored).
  - Parameter `item : string` The item ID
  - Body `{[key : string] : TagValueType | undefined }` The tags to be deleted
  - Response `{[key : string] : TagValueType}` The complete tag object of the item

**Labels operations**

- [ ] `POST /items/{item}/labels [...]` Adds labels to the item
  - Description: Existing labels are ignored.
  - Parameter `item : string` The item ID
  - Body `string[]` The labels to be added
  - Response `string[]` The complete labels array of the item
- [ ] `GET /items/{item}/labels` Returns the labels of the item
  - Parameter `item : string` The item ID
  - Response `string[]` The complete labels array of the item
- [ ] `PUT /items/{item}/labels [...]` Replaces all labels of the item
  - Description: All previous labels are deleted.
  - Parameter `item : string` The item ID
  - Body `string[]` The labels to be set    
  - Response `string[]` The complete labels array of the item
- [ ] `DELETE /items/{item}/labels` Deletes the labels from the item
  - Unknown labels are ignored.
  - Parameter `item : string` The item ID
  - Body `string[]` The labels to be deleted
  - Response `string[]` The complete labels array of the item
     
**Links operations**

- [ ] `POST /items/{item}/links {...}` Adds new links to the item
  - Description: Existing links are ignored.
  - Parameter `item : string` The item ID
  - Body `LinkType[]` The links to be added
  - Response `LinkType[]` The complete links array of the item
- [ ] `GET /items/{item}/links` Returns the links of the item
  - Description: If type query is not set, all links are returned. If type is set, only links of specific type are returned.
  - Query `type ?: string` Filters the links by their type
  - Parameter `item : string` The item ID
  - Response `LinkType[]` The links array of the item
- [ ] `DELETE /items/{item}/links` Deletes the links from the item
  - Description: Links which completely defined (link type != undefined and target != undefined) are deleted if they fit with type and target. Links with target not set are deleted if type fits (the target is ignored).
  - Parameter `item : string` The item ID
  - Body `{type : string, target ?: string}[]` The tags to be deleted
  - Response `LinkType[]` The links array of the item
     
**Status operations**

see more about status (TODO)

- [ ] `PATCH /items/{item}/status {...}` Updates the status
  - Description: Status can only be changed to a new state by a valid transition.
  - Parameter `item : string` The item ID
  - Body `string` The transition key to follow
  - Response `{previousStatus : string, newStatus : string, transition : string}` The complete links array of the item
- [ ] `GET /items/{item}/status` Returns the status of the item
  - Parameter `item : string` The item ID
  - Response `{currentStatus: string, transitions: {type : string, status : string}[]` The current status and the possible transition to the next statuses


### Types

**Type definitions**

    type Document<T> = T & {
      _id : ObjectId
      _item : ObjectId
      _commit : ObjectId
      _tags : Record<string, TagValueType>
      _labels : string[]
      _links : { target : ObjectId, type : string }[]
      _status : string 
    }

    type TagValueType = string | number | boolean | null;
    type LinkType = {type : string, target : string};
    type FilterType = object; // TODO

    type ResponseDoc<T> = T & {
      _id : string // this is the item ID (Document<T>._item.toHexString())
    }

    type Internal = {
      _tags : {[key : string] : TagValueType}
      _labels : string[]
      _links : LinkType[]
      _status : string
    }

    type UploadDoc<T> = T & Partial<Internal>


## Example contracts

### Data type definition
    
    type ContractData = {
      title : string
      description : string
      creditor : string
      amount : number
      annually : number // generated
      shared : boolean
      months : boolean[]
    }

    type ResponseContract = ContractData & {
      id : string
      account : string
      status : string
    }

    type ContractFilter = {
      creditor ?: string
      shared ?: boolean
      months ?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
      account ?: string
      status ?: 'Planned' | 'Active' | 'Terminated'
    }

    /* 
     * WORKFLOW: (transition : start state -> end state
     * (*) -> Planned
     * activate : Planned -> Active
     * terminate : Active -> Terminated
     * reactivate : Terminated -> Active
     */

- [ ] `GET /contracts` Returns all or the filtered contracts
  - Query `filter : ContractFilter` Defines the filter of the contracts 
  - Response 200 `ResponseContract[]` The requested contracts
- [ ] `GET /contracts/{contractId}` Returns the requested contract
  - Parameter `contractId : string` The contract ID
  - Response 200 `ResponseContract` The requested contract
- [ ] `POST /contracts {...}` Adds a single contract
  - Parameter `accountId : string` The account ID        
  - Body `ContractData`
  - Response 201 `ResponseContract` The new contract
- [ ] `PUT /contracts/{contractId} {...}` Updates the contract body
  - Parameter `contractId : string` The contract ID
  - Body `ContractData` The contract data 
  - Response 200 `ResponseContract` The changed contract
- [ ] `PATCH /contracts/{contractId}/account {...}` Updates the account of the contract
  - Parameter `accountId : string` The account ID
  - Response 200 `ResponseContract` The changed contract
- [ ] `PATCH /contracts/{contractId}/status {...}` Updates the status of the contract
  - Parameter `transition : string` The transition key
  - Response 200 `ResponseContract` The changed contract
- [ ] `DELETE /contracts/{contractId}` Deletes the contract
  - Parameter `contractId : string` The contract ID
  - Response 200 `string` The deleted contract ID


## TODOs

- [ ] Add created field to commit
- [ ] Rank (by order in commit base)
- [ ] Send commit on updates and check if head to ensure integrity
- [ ] Status with date
- [ ] Sort, Limit


