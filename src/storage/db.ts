import Dexie, { type Table } from 'dexie';
import { Station } from '../types';

export class RadioDB extends Dexie {
  favorites!: Table<Station, string>;
  settings!: Table<{ id: string; value: any }, string>;

  constructor() {
    super('RetroStreamDB');
    this.version(1).stores({
      favorites: 'id, name, country',
      settings: 'id'
    });
  }
}

export const db = new RadioDB();
