import {MongoClient} from "mongodb";
import {DBClient} from "./mongo";

export default class DatabaseManager {

  mongo : MongoClient;
  clients : DBClient<any>[] = [];

  constructor(mongoClient : MongoClient) {
    this.mongo = mongoClient;
  }

  addClient<T extends {}>(client : DBClient<T>) {
    // add client
    this.clients.push(client);
  }

  // TODO: use string key
  client<T extends {}>(index : number) {
    return this.clients[index] as DBClient<T>;
  }

}