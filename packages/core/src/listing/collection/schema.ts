import { StringPublicKey } from '@mirrorworld/mirage.utils';
import { deserializeUnchecked } from 'borsh';
import { RemoveMembersArgs } from './removeMembers';
import { ArrangeMemberArgs } from './arrangeMember';
import { AddMemberOfArgs } from './addMemberOf';
import { FreezeCollectionArgs } from './freezeCollection';
import { AddAuthorityArgs } from './addAuthority';
import { RemoveAuthorityArgs } from './removeAuthority';

export const COLLECTION_PREFIX = 'collection';
export class AddMembersArgs {
  instruction: number = 1;
}

export class CreateCollectionArgs {
  instruction: number = 0;
  name: string;
  description: string;
  image: string;
  advanced: number;
  maxSize: number;
  members: StringPublicKey[];
  memberOf: CollectionSignature[];

  constructor(args: {
    name: string;
    description: string;
    image: string;
    advanced: number;
    maxSize: number;
    members: StringPublicKey[];
    memberOf: CollectionSignature[];
  }) {
    this.name = args.name;
    this.description = args.description;
    this.image = args.image;
    this.advanced = args.advanced;
    this.maxSize = args.maxSize;
    this.members = args.members;
    this.memberOf = args.memberOf;
  }
}

export const decodeCollectionData = (buffer: Buffer): ICollectionData => {
  return deserializeUnchecked(
    COLLECTION_SCHEMA,
    CollectionData,
    buffer
  ) as ICollectionData;
};

export class CollectionSignature {
  collection: StringPublicKey;
  signature: string;

  constructor(args: { collection: StringPublicKey; signature: string }) {
    this.collection = args.collection;
    this.signature = args.signature;
  }
}

export class CollectionData {
  name: string;
  description: string;
  image: string;
  advanced: number;
  maxSize: number;
  members: StringPublicKey[];
  member_of: CollectionSignature[];
  creator: StringPublicKey;

  constructor(args: {
    name: string;
    description: string;
    image: string;
    advanced: number;
    maxSize: number;
    members: StringPublicKey[];
    member_of: CollectionSignature[];
    creator: StringPublicKey;
  }) {
    this.name = args.name;
    this.description = args.description;
    this.creator = args.creator;
    this.image = args.image;
    this.advanced = args.advanced;
    this.maxSize = args.maxSize;
    this.members = args.members;
    this.member_of = args.member_of;
  }
}

export const COLLECTION_SCHEMA = new Map<any, any>([
  [
    CollectionSignature,
    {
      kind: 'struct',
      fields: [
        ['collection', 'pubkeyAsString'],
        ['signature', 'string'],
      ],
    },
  ],
  [
    CreateCollectionArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['name', 'string'],
        ['description', 'string'],
        ['image', 'string'],
        ['advanced', 'u8'],
        ['maxSize', 'u32'],
        ['members', ['pubkeyAsString']],
        ['memberOf', [CollectionSignature]],
      ],
    },
  ],
  [
    CollectionData,
    {
      kind: 'struct',
      fields: [
        ['name', 'string'],
        ['description', 'string'],
        ['image', 'string'],
        ['creator', 'pubkeyAsString'],
        ['authorities', ['pubkeyAsString']],
        ['advanced', 'u8'],
        ['maxSize', 'u32'],
        ['members', ['pubkeyAsString']],
        ['memberOf', [CollectionSignature]],
      ],
    },
  ],
  [
    AddMembersArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    RemoveMembersArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['index', 'u32'],
      ],
    },
  ],
  [
    ArrangeMemberArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['old_index', 'u32'],
        ['new_index', 'u32'],
      ],
    },
  ],
  [
    AddMemberOfArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['signature', ['u8']],
      ],
    },
  ],
  [
    FreezeCollectionArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    AddAuthorityArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    RemoveAuthorityArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
]);

export interface ICollectionData {
  name: string;
  description: string;
  image: string;
  creator: StringPublicKey;
  authorities: StringPublicKey[];
  advanced: number;
  max_size: number;
  members: StringPublicKey[];
  member_of: CollectionSignature[];
  pubkey?: StringPublicKey;
}
