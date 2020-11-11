const { ApolloServer, gql } = require('apollo-server');
const { PossibleFragmentSpreadsRule } = require('graphql');

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # 高度
  enum HeightUnit {
    METRE
    CENTIMETER
    FOOT
  }

  # 重量
  enum WeightUnit {
    KILOGRAM
    GRAM
    POUND
  }


  # this "User" type
  type User {
    name: String!
    age: Int
    friends: [User]
    height(unit: HeightUnit = CENTIMETER): Float
    weight(unit: WeightUnit = KILOGRAM): Float
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    self: User
    books: [Book]
    users: [User]
    user(name: String!): User
    usersHeight(unit: HeightUnit = CENTIMETER): [Float]
  }
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const users = [
  {
    name: 'leo',
    age: 20,
    friends: ['woody'],
    height: 175,
    weight: 75
  },
  {
    name: 'woody',
    age: 20,
    friends: [],
    height: 168,
    weight: 60
  }
]

const HeightValue = {
  METRE: 100,
  CENTIMETER: 1,
  FOOT: 30.48
}

const WeightValue = {
  KILOGRAM: 1,
  GRAM: 100,
  POUND: 0.45
}

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    self: () => users.find(user => user.name === 'leo'),
    books: () => books,
    users: () => users,
    user: (root, args, context) => {
      return users.find(user => user.name === args.name)
    },
    usersHeight: (root, args, context) => {
      const { unit } = args

      if (!Object.keys(HeightValue).includes(unit)) {
        throw new Error('error')
      }
      return users.map(item => item.height * HeightValue[unit])
    }
  },
  User: {
    friends: (parent) => {
      return users.filter(user => parent.friends.includes(user.name))
    },
    height: (parent, args) => {
      const { unit } = args

      if (!Object.keys(HeightValue).includes(unit)) {
        throw new Error('error')
      }
      return parent.height * HeightValue[unit]
    },
    weight: (parent, args) => {
      const { unit } = args

      if (!Object.keys(WeightValue).includes(unit)) {
        throw new Error('error')
      }
      return parent.weight * WeightValue[unit]
    }
  }
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
